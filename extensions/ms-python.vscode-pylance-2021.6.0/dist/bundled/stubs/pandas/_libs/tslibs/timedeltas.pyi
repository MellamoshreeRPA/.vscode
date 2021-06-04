from __future__ import annotations
from typing import Any, Union, Tuple, Type, Optional, Sequence

import numpy as np
from pandas._typing import Dtype

class _Timedelta:
    def __hash__(self) -> int: ...
    def __richcmp__(self, other, op: int) -> Any: ...
    def to_timedelta64(self) -> np.timedelta64: ...
    def view(self, dtype: Dtype): ...
    @property
    def components(self) -> Tuple: ... # Really a namedtuple
    @property
    def delta(self) -> int: ...
    @property
    def asm8(self) -> np.timedelta64: ...
    @property
    def resolution_string(self) -> str: ...
    @property
    def nanoseconds(self) -> int: ...
    def __repr__(self) -> str: ...
    def __str__(self) -> str: ...
    def __bool__(self) -> bool: ...
    def isoformat(self) -> str: ...

class Timedelta(_Timedelta):
    def __new__(cls, value: object, unit: Optional[str] = ..., **kwargs) -> Timedelta: ...
    def __setstate__(self, state) -> None: ...
    def __reduce__(self) -> Tuple[Type[Timedelta], int]: ...
    def round(self, freq: str) -> Timedelta: ...
    def floor(self, freq: str) -> Timedelta: ...
    def ceil(self, freq: str) -> Timedelta: ...
    def __inv__(self) -> Timedelta: ...
    def __neg__(self) -> Timedelta: ...
    def __pos__(self) -> Timedelta: ...
    def __abs__(self) -> Timedelta: ...
    def __add__(self, other) -> Timedelta: ...
    def __radd__(self, other) -> Timedelta: ...
    def __sub__(self, other) -> Timedelta: ...
    def __rsub_(self, other) -> Timedelta: ...
    def __mul__(self, other) -> Timedelta: ...
    __rmul__ = __mul__
    def __truediv__(self, other) -> Union[float, Timedelta]: ...
    def __rtruediv__(self, other) -> float: ...
    def __floordiv__(self, other) -> Union[int, Timedelta]: ...
    def __rfloordiv__(self, other) -> int: ...
    def __mod__(self, other) -> int: ...
    def __rmod__(self, other) -> int: ...
    def __divmod__(self, other) -> Tuple[int, int]: ...
    def __rdivmod__(self, other) -> Tuple[int, int]: ...

def delta_to_nanoseconds(delta: _Timedelta) -> int: ...
def ints_to_pytimedelta(arr: Sequence[int], box: bool = ...) -> np.ndarray: ...