"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitIssue = exports.runConfigDiagnostics = exports.RCCDiagnostics = exports.STATUS_WARNING = exports.STATUS_FAIL = exports.STATUS_FATAL = exports.STATUS_OK = exports.submitIssueUI = exports.getRccLocation = void 0;
const fs = require("fs");
const path = require("path");
const os = require("os");
const requestLight_1 = require("./requestLight");
const files_1 = require("./files");
const vscode_1 = require("vscode");
const channel_1 = require("./channel");
const time_1 = require("./time");
const subprocess_1 = require("./subprocess");
function downloadRcc(progress, token) {
    return __awaiter(this, void 0, void 0, function* () {
        // Configure library with http settings.
        // i.e.: https://code.visualstudio.com/docs/setup/network
        let httpSettings = vscode_1.workspace.getConfiguration('http');
        requestLight_1.configure(httpSettings.get('proxy'), httpSettings.get('proxyStrictSSL'));
        let location = getExpectedRccLocation();
        let relativePath;
        if (process.platform == 'win32') {
            if (process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')) {
                // Check if node is a 64 bit process or if it's a 32 bit process running in a 64 bit processor.
                relativePath = '/windows64/rcc.exe';
            }
            else {
                // Do we even have a way to test a 32 bit build?
                relativePath = '/windows32/rcc.exe';
            }
        }
        else if (process.platform == 'darwin') {
            relativePath = '/macos64/rcc';
        }
        else {
            // Linux
            if (process.arch === 'x64') {
                relativePath = '/linux64/rcc';
            }
            else {
                relativePath = '/linux32/rcc';
            }
        }
        const RCC_VERSION = "v9.16.0";
        const prefix = "https://downloads.robocorp.com/rcc/releases/" + RCC_VERSION;
        const url = prefix + relativePath;
        // Downloads can go wrong (so, retry a few times before giving up).
        const maxTries = 3;
        let timing = new time_1.Timing();
        channel_1.OUTPUT_CHANNEL.appendLine('Downloading rcc from: ' + url);
        for (let i = 0; i < maxTries; i++) {
            function onProgress(currLen, totalLen) {
                if (timing.elapsedFromLastMeasurement(300) || currLen == totalLen) {
                    currLen /= (1024 * 1024);
                    totalLen /= (1024 * 1024);
                    let currProgress = currLen / totalLen * 100;
                    let msg = 'Downloaded: ' + currLen.toFixed(1) + "MB of " + totalLen.toFixed(1) + "MB (" + currProgress.toFixed(1) + '%)';
                    if (i > 0) {
                        msg = "Attempt: " + (i + 1) + " - " + msg;
                    }
                    progress.report({ message: msg });
                    channel_1.OUTPUT_CHANNEL.appendLine(msg);
                }
            }
            try {
                let response = yield requestLight_1.xhr({
                    'url': url,
                    'onProgress': onProgress,
                });
                if (response.status == 200) {
                    // Ok, we've been able to get it.
                    // Note: only write to file after we get all contents to avoid
                    // having partial downloads.
                    channel_1.OUTPUT_CHANNEL.appendLine('Finished downloading in: ' + timing.getTotalElapsedAsStr());
                    channel_1.OUTPUT_CHANNEL.appendLine('Writing to: ' + location);
                    progress.report({ message: 'Finished downloading (writing to file).' });
                    let s = fs.createWriteStream(location, { 'encoding': 'binary', 'mode': 0o744 });
                    try {
                        response.responseData.forEach(element => {
                            s.write(element);
                        });
                    }
                    finally {
                        s.close();
                    }
                    // If we don't sleep after downloading, the first activation seems to fail on Windows and Mac 
                    // (EBUSY on Windows, undefined on Mac).
                    yield time_1.sleep(200);
                    return location;
                }
                else {
                    throw Error('Unable to download from ' + url + '. Response status: ' + response.status + 'Response message: ' + response.responseText);
                }
            }
            catch (error) {
                channel_1.OUTPUT_CHANNEL.appendLine('Error downloading (' + i + ' of ' + maxTries + '). Error: ' + error);
                if (i == maxTries - 1) {
                    return undefined;
                }
            }
        }
    });
}
function getExpectedRccLocation() {
    let location;
    if (process.platform == 'win32') {
        location = files_1.getExtensionRelativeFile('../../bin/rcc.exe', false);
    }
    else {
        location = files_1.getExtensionRelativeFile('../../bin/rcc', false);
    }
    return location;
}
// We can't really ship rcc per-platform right now (so, we need to either
// download it or ship it along).
// See: https://github.com/microsoft/vscode/issues/6929
// See: https://github.com/microsoft/vscode/issues/23251
// In particular, if we download things, we should use:
// https://www.npmjs.com/package/request-light according to:
// https://github.com/microsoft/vscode/issues/6929#issuecomment-222153748
function getRccLocation() {
    return __awaiter(this, void 0, void 0, function* () {
        let location = getExpectedRccLocation();
        if (!fs.existsSync(location)) {
            yield vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                title: "Download conda manager (rcc).",
                cancellable: false
            }, downloadRcc);
        }
        return location;
    });
}
exports.getRccLocation = getRccLocation;
function submitIssueUI(logPath) {
    return __awaiter(this, void 0, void 0, function* () {
        // Collect the issue information and send it using RCC.
        let email;
        let askEmailMsg = 'Please provide your e-mail for the issue report';
        do {
            email = yield vscode_1.window.showInputBox({
                'prompt': askEmailMsg,
                'ignoreFocusOut': true,
            });
            if (!email) {
                return;
            }
            // if it doesn't have an @, ask again
            askEmailMsg = 'Invalid e-mail provided. Please provide your e-mail for the issue report';
        } while (email.indexOf('@') == -1);
        let issueDescription = yield vscode_1.window.showInputBox({
            'prompt': 'Please provide a brief description of the issue',
            'ignoreFocusOut': true,
        });
        if (!issueDescription) {
            return;
        }
        yield submitIssue(logPath, "Robocorp Code", email, "Robocorp Code", "Robocorp Code", issueDescription);
    });
}
exports.submitIssueUI = submitIssueUI;
exports.STATUS_OK = 'ok';
exports.STATUS_FATAL = 'fatal';
exports.STATUS_FAIL = 'fail';
exports.STATUS_WARNING = 'warning';
class RCCDiagnostics {
    constructor(checks) {
        this.roboHomeOk = true;
        this.failedChecks = [];
        for (const check of checks) {
            if (check.status != exports.STATUS_OK) {
                this.failedChecks.push(check);
                if (check.type == 'RPA' && check.message.indexOf('ROBOCORP_HOME') != -1) {
                    this.roboHomeOk = false;
                }
            }
        }
    }
    isRobocorpHomeOk() {
        return this.roboHomeOk;
    }
}
exports.RCCDiagnostics = RCCDiagnostics;
/**
 * @param robocorpHome if given, this will be passed as the ROBOCORP_HOME environment variable.
 */
function runConfigDiagnostics(rccLocation, robocorpHome) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let env = Object.assign({}, process.env);
            if (robocorpHome) {
                env['ROBOCORP_HOME'] = robocorpHome;
            }
            let configureLongpathsOutput = yield subprocess_1.execFilePromise(rccLocation, ['configure', 'diagnostics', '-j', '--controller', 'RobocorpCode'], { env: env });
            channel_1.OUTPUT_CHANNEL.appendLine('RCC Diagnostics:\nStdout:\n' + configureLongpathsOutput.stdout + '\nStderr:\n' + configureLongpathsOutput.stderr);
            let outputAsJSON = JSON.parse(configureLongpathsOutput.stdout);
            let checks = outputAsJSON.checks;
            return new RCCDiagnostics(checks);
        }
        catch (error) {
            let errorMSg = ('' + error).trim();
            if (errorMSg == '[object Object]') {
                errorMSg = JSON.stringify(error);
            }
            channel_1.OUTPUT_CHANNEL.appendLine('Error getting RCC diagnostics: ' + errorMSg);
            return undefined;
        }
    });
}
exports.runConfigDiagnostics = runConfigDiagnostics;
function submitIssue(logPath, dialogMessage, email, errorName, errorCode, errorMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let errored = false;
        try {
            let rccLocation = yield getRccLocation();
            if (rccLocation) {
                if (!fs.existsSync(rccLocation)) {
                    channel_1.OUTPUT_CHANNEL.appendLine('Unable to send issue report (' + rccLocation + ') does not exist.');
                    return;
                }
                function acceptLogFile(f) {
                    let lower = path.basename(f).toLowerCase();
                    if (!lower.endsWith(".log")) {
                        return false;
                    }
                    // Whitelist what we want so that we don't gather unwanted info.
                    if (lower.includes("robocorp code") || lower.includes("robot framework") || lower.includes("exthost")) {
                        return true;
                    }
                    return false;
                }
                // This should be parent directory for the logs.
                let logsRootDir = path.dirname(logPath);
                channel_1.OUTPUT_CHANNEL.appendLine('Log path: ' + logsRootDir);
                let logFiles = [];
                const stat = yield fs.promises.stat(logsRootDir);
                if (stat.isDirectory()) {
                    // Get the .log files under the logsRootDir and subfolders.
                    const files = yield fs.promises.readdir(logsRootDir);
                    for (const fileI of files) {
                        let f = path.join(logsRootDir, fileI);
                        const stat = yield fs.promises.stat(f);
                        if (acceptLogFile(f) && stat.isFile()) {
                            logFiles.push(f);
                        }
                        else if (stat.isDirectory()) {
                            // No need to recurse (we just go 1 level deep).
                            let currDir = f;
                            const innerFiles = yield fs.promises.readdir(currDir);
                            for (const fileI of innerFiles) {
                                let f = path.join(currDir, fileI);
                                const stat = yield fs.promises.stat(f);
                                if (acceptLogFile(f) && stat.isFile()) {
                                    logFiles.push(f);
                                }
                            }
                        }
                    }
                }
                let version = vscode_1.extensions.getExtension('robocorp.robocorp-code').packageJSON.version;
                const metadata = {
                    logsRootDir,
                    platform: os.platform(),
                    osRelease: os.release(),
                    nodeVersion: process.version,
                    version: version,
                    controller: 'rcc.robocorpcode',
                    dialogMessage,
                    email,
                    errorName,
                    errorCode,
                    errorMessage,
                };
                const reportPath = path.join(os.tmpdir(), `robocode_issue_report_${Date.now()}.json`);
                fs.writeFileSync(reportPath, JSON.stringify(metadata, null, 4), { encoding: 'utf-8' });
                let args = ['feedback', 'issue', '-r', reportPath, '--controller', 'RobocorpCode'];
                for (const file of logFiles) {
                    args.push('-a');
                    args.push(file);
                }
                yield subprocess_1.execFilePromise(rccLocation, args, {});
            }
        }
        catch (err) {
            errored = true;
            channel_1.OUTPUT_CHANNEL.appendLine('Error sending issue: ' + err);
        }
        if (!errored) {
            channel_1.OUTPUT_CHANNEL.appendLine('Issue sent.');
        }
        return;
    });
}
exports.submitIssue = submitIssue;
//# sourceMappingURL=rcc.js.map