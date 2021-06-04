import itertools
from functools import partial
import threading
from robocorp_ls_core.basic import implements
from robocorp_ls_core.robotframework_log import get_logger
from robocorp_ls_core.protocols import (
    ILanguageServerClientBase,
    Sentinel,
    COMMUNICATION_DROPPED,
    IIdMessageMatcher,
    IMonitor,
    IRequestCancellable,
)
from typing import Any, Union, Optional, List, Callable

log = get_logger(__name__)


class _MessageMatcher(object):
    def __init__(self):
        self.event = threading.Event()
        self.msg = None

    def notify(self, msg):
        # msg can be None if the communication was finished in the meanwhile.
        self.msg = msg
        self.event.set()


class _IdMessageMatcher(_MessageMatcher):
    def __init__(self, message_id):
        _MessageMatcher.__init__(self)

        self.message_id = message_id

    def __str__(self):
        return "IdMatcher(%s)" % (self.message_id,)

    __repr__ = __str__

    def __typecheckself__(self) -> None:
        from robocorp_ls_core.protocols import check_implements

        _: IIdMessageMatcher = check_implements(self)


class _PatternMessageMatcher(_MessageMatcher):
    def __init__(self, message_pattern):
        self.message_pattern = message_pattern
        _MessageMatcher.__init__(self)

    def matches(self, msg):
        for key, val in self.message_pattern.items():
            if msg.get(key) != val:
                return False
        return True

    def __str__(self):
        return "PatternMatcher(%s)" % (self.message_pattern,)

    __repr__ = __str__


def wait_for_message_matcher(
    message_matcher: IIdMessageMatcher,
    request_cancel: Callable[[Any], None],
    timeout: float,
    monitor: Optional[IMonitor],
) -> bool:
    """
    Note: in the case where the monitor is cancelled the cancel is automatically
    passed to the api too.
    
    :raises JsonRpcRequestCancelled:
        If the monitor is cancelled.
        
    :return True if the message completed in the available time and False otherwise.
    """
    import time

    if monitor is None:
        if message_matcher.event.wait(timeout):
            return True
    else:
        from robocorp_ls_core.jsonrpc.exceptions import JsonRpcRequestCancelled

        try:
            maxtime = time.time() + timeout
            # We need to periodically check for the monitor, so, set up a busy loop that does that.

            # Check at least 20 times / second.
            delta = min(1 / 20.0, timeout)

            # Always do at least 1 check regardless of the time.
            if message_matcher.event.wait(delta):
                return True

            monitor.check_cancelled()

            while time.time() < maxtime:
                if message_matcher.event.wait(delta):
                    return True

                monitor.check_cancelled()

        except JsonRpcRequestCancelled:
            request_cancel(message_matcher.message_id)
            raise

    # If we got here, it timed out, so, we should cancel the request itself
    # (even if it the monitor wasn't cancelled).
    request_cancel(message_matcher.message_id)
    return False


def wait_for_message_matchers(
    message_matchers: List[Optional[IIdMessageMatcher]],
    monitor: Optional[IMonitor],
    request_cancel: Callable[[Any], None],
    timeout: float,
) -> List[IIdMessageMatcher]:
    """
    Note: in the case where the monitor is cancelled the cancel is automatically
    passed to the api too.
    
    :raises JsonRpcRequestCancelled:
        If the monitor is cancelled.
    """
    import time
    from robocorp_ls_core.jsonrpc.exceptions import JsonRpcRequestCancelled

    accepted_message_matchers = []
    curtime = time.time()
    maxtime = curtime + timeout

    # Create a copy as we'll mutate it.
    message_matchers = message_matchers[:]

    while message_matchers:
        message_matcher = message_matchers.pop(0)

        if message_matcher is not None:
            # i.e.: wait X seconds and bail out if we can't get it.
            available_time = maxtime - time.time()
            if available_time <= 0:
                available_time = 0.0001  # Wait at least a bit for each.

            try:
                if wait_for_message_matcher(
                    message_matcher, request_cancel, available_time, monitor
                ):
                    accepted_message_matchers.append(message_matcher)
            except JsonRpcRequestCancelled:
                # If we got here, the monitor was cancelled... the current one was
                # already cancelled, so, go on and cancel the others too.
                for message_matcher in message_matchers:
                    if message_matcher is not None:
                        request_cancel(message_matcher.message_id)
                raise

    return accepted_message_matchers


class _ReaderThread(threading.Thread):
    def __init__(self, reader):
        threading.Thread.__init__(self)
        self.setDaemon(True)
        self.reader = reader
        self._lock = threading.Lock()
        self._finished = False

        # Message matchers.
        self._id_message_matchers = {}  # msg id-> matcher
        self._pattern_message_matchers = {}  # id(matcher) -> matcher

    def run(self):
        try:
            self.reader.listen(self._on_message)
        finally:
            with self._lock:
                self._finished = True
                id_message_matchers = self._id_message_matchers
                self._id_message_matchers = {}

                pattern_message_matchers = self._pattern_message_matchers
                self._pattern_message_matchers = {}

            for message_matcher in id_message_matchers.values():
                message_matcher.notify(None)

            for message_matcher in pattern_message_matchers.values():
                message_matcher.notify(None)

    def _on_message(self, msg):
        from robocorp_ls_core.options import Setup

        notify_matchers = []
        log.debug("Will handle read message: %s" % (msg,))
        with self._lock:
            for message_matcher in self._pattern_message_matchers.values():
                if message_matcher.matches(msg):
                    notify_matchers.append(message_matcher)

            for message_matcher in notify_matchers:
                del self._pattern_message_matchers[id(message_matcher)]

            if "id" in msg:
                message_matcher = self._id_message_matchers.pop(msg["id"], None)
                if message_matcher is not None:
                    notify_matchers.append(message_matcher)

            if Setup.options.DEBUG_MESSAGE_MATCHERS:
                log.debug(
                    "Notify matchers: %s\nRemaining id matchers: %s\nRemaining pattern matchers: %s"
                    % (
                        notify_matchers,
                        self._id_message_matchers,
                        self._pattern_message_matchers,
                    )
                )

        for message_matcher in notify_matchers:
            message_matcher.notify(msg)

    def obtain_pattern_message_matcher(self, message_pattern):
        """
        :param message_pattern:
            Obtains a matcher which will be notified when the given message pattern is
            returned.
            
        :return:
            None if it's already finished or the message matcher otherwise.
        """
        with self._lock:
            if self._finished:
                return None
            message_matcher = _PatternMessageMatcher(message_pattern)
            self._pattern_message_matchers[id(message_matcher)] = message_matcher
            return message_matcher

    def obtain_id_message_matcher(self, message_id) -> Optional[IIdMessageMatcher]:
        """
        :param message_id:
            Obtains a matcher which will be notified when the given message id is
            returned.
            
        :return:
            None if it's already finished or the message matcher otherwise.
        """
        with self._lock:
            if self._finished:
                return None
            message_matcher = _IdMessageMatcher(message_id)
            self._id_message_matchers[message_id] = message_matcher
            return message_matcher


class LanguageServerClientBase(object):
    """
    A base implementation for talking with a process that implements the language
    server.
    """

    DEFAULT_TIMEOUT: Optional[
        int
    ] = None  # The default if not redefined is not having a timeout.

    def __init__(self, writer, reader):
        """
        
        :param JsonRpcStreamWriter writer:
        :param JsonRpcStreamReader reader:
        """
        self.writer = writer
        self.reader = reader

        t = _ReaderThread(reader)
        self._reader_thread = t
        t.start()
        self.require_exit_messages = True
        self.next_id = partial(next, itertools.count())

    @implements(ILanguageServerClientBase.request_async)
    def request_async(self, contents: dict) -> Optional[IIdMessageMatcher]:
        message_id = contents["id"]
        message_matcher = self._reader_thread.obtain_id_message_matcher(message_id)
        if message_matcher is None:
            return None

        if not self.write(contents):
            return None

        return message_matcher

    @implements(ILanguageServerClientBase.request)
    def request(
        self,
        contents,
        timeout: Union[int, Sentinel, None] = Sentinel.USE_DEFAULT_TIMEOUT,
        default: Any = COMMUNICATION_DROPPED,
    ):
        """
        :param contents:
        :param timeout:
        :return:
            The returned message if everything goes ok.
            `default` if the communication dropped in the meanwhile and timeout was None.
        
        :raises:
            TimeoutError if the timeout was given and no answer was given at the available time
            (including if the communication was dropped).
        """
        if timeout is Sentinel.USE_DEFAULT_TIMEOUT:
            timeout = self.DEFAULT_TIMEOUT

        message_id = contents["id"]
        message_matcher = self._reader_thread.obtain_id_message_matcher(message_id)
        if message_matcher is None:
            if timeout:
                raise TimeoutError(
                    "Request timed-out (%s) - no message matcher: %s"
                    % (timeout, contents)
                )
            return default

        if not self.write(contents):
            if timeout:
                raise TimeoutError(
                    "Request timed-out (%s) - no write: %s" % (timeout, contents)
                )
            return default

        if not message_matcher.event.wait(timeout=timeout):
            raise TimeoutError("Request timed-out (%s): %s" % (timeout, contents))

        return message_matcher.msg

    @implements(ILanguageServerClientBase.obtain_pattern_message_matcher)
    def obtain_pattern_message_matcher(self, message_pattern):
        return self._reader_thread.obtain_pattern_message_matcher(message_pattern)

    @implements(ILanguageServerClientBase.obtain_id_message_matcher)
    def obtain_id_message_matcher(self, message_id):
        return self._reader_thread.obtain_id_message_matcher(message_id)

    @implements(ILanguageServerClientBase.write)
    def write(self, contents):
        return self.writer.write(contents)

    @implements(ILanguageServerClientBase.shutdown)
    def shutdown(self):
        self.write({"jsonrpc": "2.0", "id": self.next_id(), "method": "shutdown"})

    @implements(ILanguageServerClientBase.exit)
    def exit(self):
        self.write({"jsonrpc": "2.0", "id": self.next_id(), "method": "exit"})
