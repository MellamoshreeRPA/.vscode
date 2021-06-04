/*
Original work Copyright (c) Microsoft Corporation (MIT)
See ThirdPartyNotices.txt in the project root for license information.
All modifications Copyright (c) Robocorp Technologies Inc.
All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License")
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http: // www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
'use strict';
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
exports.deactivate = exports.activate = void 0;
const net = require("net");
const fs = require("fs");
const path = require("path");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
const locators = require("./locators");
const views = require("./views");
const roboConfig = require("./robocorpSettings");
const roboCommands = require("./robocorpCommands");
const channel_1 = require("./channel");
const files_1 = require("./files");
const rcc_1 = require("./rcc");
const time_1 = require("./time");
const subprocess_1 = require("./subprocess");
const activities_1 = require("./activities");
const time_2 = require("./time");
const progress_1 = require("./progress");
const robocorpViews_1 = require("./robocorpViews");
const rccTerminal_1 = require("./rccTerminal");
const viewsRobotContent_1 = require("./viewsRobotContent");
const clientOptions = {
    documentSelector: [
        { language: 'json', pattern: '**/locators.json' },
        { language: 'yaml', pattern: '**/conda.yaml' },
        { language: 'yaml', pattern: '**/robot.yaml' }
    ],
    synchronize: {
        configurationSection: "robocorp"
    },
    outputChannel: channel_1.OUTPUT_CHANNEL,
};
function startLangServerIO(command, args, environ) {
    const serverOptions = {
        command,
        args,
    };
    if (!environ) {
        environ = process.env;
    }
    let src = path.resolve(__dirname, '../../src');
    serverOptions.options = { env: Object.assign(Object.assign({}, environ), { PYTHONPATH: src }) };
    // See: https://code.visualstudio.com/api/language-extensions/language-server-extension-guide
    return new node_1.LanguageClient(command, serverOptions, clientOptions);
}
function startLangServerTCP(addr) {
    const serverOptions = function () {
        return new Promise((resolve, reject) => {
            var client = new net.Socket();
            client.connect(addr, "127.0.0.1", function () {
                resolve({
                    reader: client,
                    writer: client
                });
            });
        });
    };
    return new node_1.LanguageClient(`tcp lang server (port ${addr})`, serverOptions, clientOptions);
}
class RobocorpCodeDebugConfigurationProvider {
    provideDebugConfigurations(folder, token) {
        let configurations = [];
        configurations.push({
            "type": "robocorp-code",
            "name": "Robocorp Code: Launch task from robot.yaml",
            "request": "launch",
            "robot": '^"\\${file}"',
            "task": "",
        });
        return configurations;
    }
    ;
    resolveDebugConfigurationWithSubstitutedVariables(folder, debugConfiguration, token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (debugConfiguration.noDebug) {
                // Not running with debug: just use rcc to launch.
                return debugConfiguration;
            }
            // If it's a debug run, we need to get the input contents -- something as:
            // "type": "robocorp-code",
            // "name": "Robocorp Code: Launch task from current robot.yaml",
            // "request": "launch",
            // "robot": "c:/robot.yaml",
            // "task": "entrypoint",
            //
            // and convert it to the contents expected by robotframework-lsp:
            //
            // "type": "robotframework-lsp",
            // "name": "Robot: Current File",
            // "request": "launch",
            // "cwd": "${workspaceFolder}",
            // "target": "c:/task.robot",
            //
            // (making sure that we can actually do this and it's a robot launch for the task)
            if (!fs.existsSync(debugConfiguration.robot)) {
                vscode_1.window.showWarningMessage('Error. Expected: specified "robot": ' + debugConfiguration.robot + " to exist.");
                return;
            }
            // Note: this will also activate robotframework-lsp if it's still not activated.
            let interpreter = undefined;
            try {
                interpreter = yield vscode_1.commands.executeCommand('robot.resolveInterpreter', debugConfiguration.robot);
            }
            catch (error) {
                vscode_1.window.showWarningMessage('Error resolving interpreter info: ' + error);
                return;
            }
            if (!interpreter) {
                vscode_1.window.showErrorMessage("Unable to resolve robot.yaml based on: " + debugConfiguration.robot);
                return;
            }
            let actionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_COMPUTE_ROBOT_LAUNCH_FROM_ROBOCORP_CODE_LAUNCH, {
                'name': debugConfiguration.name,
                'request': debugConfiguration.request,
                'robot': debugConfiguration.robot,
                'task': debugConfiguration.task,
                'additionalPythonpathEntries': interpreter.additionalPythonpathEntries,
                'env': interpreter.environ,
                'pythonExe': interpreter.pythonExe,
            });
            if (!actionResult.success) {
                vscode_1.window.showErrorMessage(actionResult.message);
                return;
            }
            let result = actionResult.result;
            if (result && result.type && result.type == 'python') {
                let extension = vscode_1.extensions.getExtension('ms-python.python');
                if (extension) {
                    if (!extension.isActive) {
                        // i.e.: Auto-activate python extension for the launch as the extension
                        // is only activated for debug on the resolution, whereas in this case
                        // the launch is already resolved.
                        yield extension.activate();
                    }
                }
            }
            return result;
        });
    }
    ;
}
function registerDebugger(pythonExecutable) {
    function createDebugAdapterExecutable(config) {
        return __awaiter(this, void 0, void 0, function* () {
            let env = config.env;
            let robotHome = roboConfig.getHome();
            if (robotHome && robotHome.length > 0) {
                if (env) {
                    env['ROBOCORP_HOME'] = robotHome;
                }
                else {
                    env = { 'ROBOCORP_HOME': robotHome };
                }
            }
            let targetMain = path.resolve(__dirname, '../../src/robocorp_code_debug_adapter/__main__.py');
            if (!fs.existsSync(targetMain)) {
                vscode_1.window.showWarningMessage('Error. Expected: ' + targetMain + " to exist.");
                return;
            }
            if (!fs.existsSync(pythonExecutable)) {
                vscode_1.window.showWarningMessage('Error. Expected: ' + pythonExecutable + " to exist.");
                return;
            }
            if (env) {
                return new vscode_1.DebugAdapterExecutable(pythonExecutable, ['-u', targetMain], { "env": env });
            }
            else {
                return new vscode_1.DebugAdapterExecutable(pythonExecutable, ['-u', targetMain]);
            }
        });
    }
    ;
    vscode_1.debug.registerDebugAdapterDescriptorFactory('robocorp-code', {
        createDebugAdapterDescriptor: session => {
            const config = session.configuration;
            return createDebugAdapterExecutable(config);
        }
    });
    vscode_1.debug.registerDebugConfigurationProvider('robocorp-code', new RobocorpCodeDebugConfigurationProvider());
}
function verifyRobotFrameworkInstalled() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!roboConfig.getVerifylsp()) {
            return;
        }
        const ROBOT_EXTENSION_ID = 'robocorp.robotframework-lsp';
        let found = true;
        try {
            let extension = vscode_1.extensions.getExtension(ROBOT_EXTENSION_ID);
            if (!extension) {
                found = false;
            }
        }
        catch (error) {
            found = false;
        }
        if (!found) {
            // It seems it's not installed, install?
            let install = 'Install';
            let dontAsk = "Don't ask again";
            let chosen = yield vscode_1.window.showInformationMessage("It seems that the Robot Framework Language Server extension is not installed to work with .robot Files.", install, dontAsk);
            if (chosen == install) {
                vscode_1.commands.executeCommand('workbench.extensions.search', ROBOT_EXTENSION_ID);
            }
            else if (chosen == dontAsk) {
                roboConfig.setVerifylsp(false);
            }
        }
    });
}
let langServer;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let timing = new time_1.Timing();
            // The first thing we need is the python executable.
            channel_1.OUTPUT_CHANNEL.appendLine("Activating Robocorp Code extension.");
            // Note: register the submit issue actions early on so that we can later actually
            // report startup errors.
            let logPath = context.logPath;
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_SUBMIT_ISSUE, () => { rcc_1.submitIssueUI(logPath); });
            // i.e.: allow other extensions to also use our submit issue api.
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_SUBMIT_ISSUE_INTERNAL, (dialogMessage, email, errorName, errorCode, errorMessage) => rcc_1.submitIssue(logPath, // gotten from plugin context
            dialogMessage, email, errorName, errorCode, errorMessage));
            let executableAndEnv = yield getLanguageServerPythonInfo();
            if (!executableAndEnv) {
                channel_1.OUTPUT_CHANNEL.appendLine("Unable to activate Robocorp Code extension (unable to get python executable).");
                return;
            }
            channel_1.OUTPUT_CHANNEL.appendLine("Using python executable: " + executableAndEnv.pythonExe);
            let port = roboConfig.getLanguageServerTcpPort();
            if (port) {
                // For TCP server needs to be started seperately
                langServer = startLangServerTCP(port);
            }
            else {
                let targetFile = files_1.getExtensionRelativeFile('../../src/robocorp_code/__main__.py');
                if (!targetFile) {
                    return;
                }
                let args = ["-u", targetFile];
                let lsArgs = roboConfig.getLanguageServerArgs();
                if (lsArgs) {
                    args = args.concat(lsArgs);
                }
                langServer = startLangServerIO(executableAndEnv.pythonExe, args, executableAndEnv.environ);
            }
            let disposable = langServer.start();
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_GET_LANGUAGE_SERVER_PYTHON, () => getLanguageServerPython());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_GET_LANGUAGE_SERVER_PYTHON_INFO, () => getLanguageServerPythonInfo());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_CREATE_ROBOT, () => activities_1.createRobot());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_UPLOAD_ROBOT_TO_CLOUD, () => activities_1.uploadRobot());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_CONFIGURATION_DIAGNOSTICS, () => activities_1.rccConfigurationDiagnostics());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_RUN_ROBOT_RCC, () => activities_1.askAndRunRobotRCC(true));
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_DEBUG_ROBOT_RCC, () => activities_1.askAndRunRobotRCC(false));
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_SET_PYTHON_INTERPRETER, () => activities_1.setPythonInterpreterFromRobotYaml());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_REFRESH_ROBOTS_VIEW, () => views.refreshTreeView(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOTS_TREE));
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_REFRESH_CLOUD_VIEW, () => views.refreshCloudTreeView());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_ROBOTS_VIEW_TASK_RUN, () => views.runSelectedRobot(true));
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_ROBOTS_VIEW_TASK_DEBUG, () => views.runSelectedRobot(false));
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_START_BROWSER_LOCATOR, () => locators.startBrowserLocator());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_CREATE_LOCATOR_FROM_BROWSER_PICK, () => locators.pickBrowserLocator());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_CREATE_LOCATOR_FROM_SCREEN_REGION, () => locators.pickImageLocator());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_NEW_LOCATOR_UI, () => locators.newLocatorUI());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_NEW_LOCATOR_UI_TREE_INTERNAL, () => locators.newLocatorUITreeInternal());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_COPY_LOCATOR_TO_CLIPBOARD_INTERNAL, () => locators.copySelectedToClipboard());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_OPEN_ROBOT_TREE_SELECTION, () => views.openRobotTreeSelection());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_CLOUD_UPLOAD_ROBOT_TREE_SELECTION, () => views.cloudUploadRobotTreeSelection());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_OPEN_LOCATOR_TREE_SELECTION, () => views.openLocatorTreeSelection());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_CREATE_RCC_TERMINAL_TREE_SELECTION, () => views.createRccTerminalTreeSelection());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_RCC_TERMINAL_NEW, () => rccTerminal_1.askAndCreateRccTerminal());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_REFRESH_ROBOT_CONTENT_VIEW, () => views.refreshTreeView(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOT_CONTENT_TREE));
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_NEW_FILE_IN_ROBOT_CONTENT_VIEW, viewsRobotContent_1.newFileInRobotContentTree);
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_NEW_FOLDER_IN_ROBOT_CONTENT_VIEW, viewsRobotContent_1.newFolderInRobotContentTree);
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_DELETE_RESOURCE_IN_ROBOT_CONTENT_VIEW, viewsRobotContent_1.deleteResourceInRobotContentTree);
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_RENAME_RESOURCE_IN_ROBOT_CONTENT_VIEW, viewsRobotContent_1.renameResourceInRobotContentTree);
            function cloudLoginShowConfirmation() {
                return __awaiter(this, void 0, void 0, function* () {
                    let loggedIn = yield activities_1.cloudLogin();
                    if (loggedIn) {
                        vscode_1.window.showInformationMessage("Successfully logged in Robocorp Cloud.");
                    }
                });
            }
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_CLOUD_LOGIN, () => cloudLoginShowConfirmation());
            vscode_1.commands.registerCommand(roboCommands.ROBOCORP_CLOUD_LOGOUT, () => activities_1.cloudLogout());
            views.registerViews(context);
            registerDebugger(executableAndEnv.pythonExe);
            context.subscriptions.push(disposable);
            // i.e.: if we return before it's ready, the language server commands
            // may not be available.
            channel_1.OUTPUT_CHANNEL.appendLine("Waiting for Robocorp Code (python) language server to finish activating...");
            yield langServer.onReady();
            channel_1.OUTPUT_CHANNEL.appendLine("Robocorp Code extension ready. Took: " + timing.getTotalElapsedAsStr());
            langServer.onNotification("$/customProgress", (args) => {
                // OUTPUT_CHANNEL.appendLine(args.id + ' - ' + args.kind + ' - ' + args.title + ' - ' + args.message + ' - ' + args.increment);
                progress_1.handleProgressMessage(args);
            });
            langServer.onNotification("$/linkedAccountChanged", () => {
                views.refreshCloudTreeView();
            });
            verifyRobotFrameworkInstalled();
        }
        finally {
            vscode_1.workspace.onDidChangeConfiguration(event => {
                for (let s of [roboConfig.ROBOCORP_LANGUAGE_SERVER_ARGS, roboConfig.ROBOCORP_LANGUAGE_SERVER_PYTHON, roboConfig.ROBOCORP_LANGUAGE_SERVER_TCP_PORT]) {
                    if (event.affectsConfiguration(s)) {
                        vscode_1.window.showWarningMessage('Please use the "Reload Window" action for changes in ' + s + ' to take effect.', ...["Reload Window"]).then((selection) => {
                            if (selection === "Reload Window") {
                                vscode_1.commands.executeCommand("workbench.action.reloadWindow");
                            }
                        });
                        return;
                    }
                }
            });
        }
    });
}
exports.activate = activate;
function deactivate() {
    if (!langServer) {
        return undefined;
    }
    return langServer.stop();
}
exports.deactivate = deactivate;
let _cachedPythonInfo;
function getLanguageServerPython() {
    return __awaiter(this, void 0, void 0, function* () {
        let info = yield getLanguageServerPythonInfo();
        if (!info) {
            return undefined;
        }
        return info.pythonExe;
    });
}
function getLanguageServerPythonInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        if (_cachedPythonInfo) {
            return _cachedPythonInfo;
        }
        let cachedPythonInfo = yield getLanguageServerPythonInfoUncached();
        if (!cachedPythonInfo) {
            return undefined; // Unable to get it.
        }
        // Ok, we got it (cache that info).
        _cachedPythonInfo = cachedPythonInfo;
        return _cachedPythonInfo;
    });
}
function enableWindowsLongPathSupport(rccLocation) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            try {
                // Expected failure if not admin.
                yield subprocess_1.execFilePromise(rccLocation, ['configure', 'longpaths', '--enable'], { env: Object.assign({}, process.env) });
                yield time_2.sleep(100);
            }
            catch (error) {
                // Expected error (it means we need an elevated shell to run the command).
                try {
                    // Now, at this point we resolve the links to have a canonical location, because
                    // we'll execute with a different user (i.e.: admin), we first resolve substs
                    // which may not be available for that user (i.e.: a subst can be applied to one
                    // account and not to the other) because path.resolve and fs.realPathSync don't
                    // seem to resolve substed drives, we do it manually here.
                    if (rccLocation.charAt(1) == ':') { // Check that we're actually have a drive there.
                        try {
                            let resolved = fs.readlinkSync(rccLocation.charAt(0) + ':');
                            rccLocation = path.join(resolved, rccLocation.slice(2));
                        }
                        catch (error) {
                            // ignore (it's not a link)
                        }
                    }
                    rccLocation = path.resolve(rccLocation);
                    rccLocation = fs.realpathSync(rccLocation);
                }
                catch (error) {
                    channel_1.OUTPUT_CHANNEL.appendLine('Error (handled) resolving rcc canonical location: ' + error);
                }
                rccLocation = rccLocation.split('\\').join('/'); // escape for the shell execute
                let result = yield subprocess_1.execFilePromise('C:/Windows/System32/mshta.exe', // i.e.: Windows scripting
                [
                    "javascript: var shell = new ActiveXObject('shell.application');" + // create a shell
                        "shell.ShellExecute('" + rccLocation + "', 'configure longpaths --enable', '', 'runas', 1);close();" // runas will run in elevated mode
                ], { env: Object.assign({}, process.env) });
                // Wait a second for the command to be executed as admin before proceeding.
                yield time_2.sleep(1000);
            }
        }
        catch (error) {
            // Ignore here...
        }
    });
}
function isLongPathSupportEnabledOnWindows(rccLocation) {
    return __awaiter(this, void 0, void 0, function* () {
        let enabled = true;
        try {
            let configureLongpathsOutput = yield subprocess_1.execFilePromise(rccLocation, ['configure', 'longpaths'], { env: Object.assign({}, process.env) });
            if (configureLongpathsOutput.stdout.indexOf('OK.') != -1 || configureLongpathsOutput.stderr.indexOf('OK.') != -1) {
                enabled = true;
            }
            else {
                enabled = false;
            }
        }
        catch (error) {
            enabled = false;
        }
        if (enabled) {
            channel_1.OUTPUT_CHANNEL.appendLine('Windows long paths support enabled');
        }
        else {
            channel_1.OUTPUT_CHANNEL.appendLine('Windows long paths support NOT enabled.');
        }
        return enabled;
    });
}
function verifyLongPathSupportOnWindows(rccLocation) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.platform == 'win32') {
            while (true) {
                let enabled = yield isLongPathSupportEnabledOnWindows(rccLocation);
                if (!enabled) {
                    const YES = 'Yes (requires elevated shell)';
                    const MANUALLY = 'Open manual instructions';
                    let result = yield vscode_1.window.showErrorMessage("Windows long paths support (required by Robocorp Code) is not enabled. Would you like to have Robocorp Code enable it now?", { 'modal': true }, YES, MANUALLY);
                    if (result == YES) {
                        // Enable it.
                        yield enableWindowsLongPathSupport(rccLocation);
                        let enabled = yield isLongPathSupportEnabledOnWindows(rccLocation);
                        if (enabled) {
                            return true;
                        }
                        else {
                            let result = yield vscode_1.window.showErrorMessage("It was not possible to automatically enable windows long path support. " +
                                "Please follow the instructions from https://robocorp.com/docs/troubleshooting/windows-long-path (press Ok to open in browser).", { 'modal': true }, 'Ok');
                            if (result == 'Ok') {
                                yield vscode_1.env.openExternal(vscode_1.Uri.parse('https://robocorp.com/docs/troubleshooting/windows-long-path'));
                            }
                        }
                    }
                    else if (result == MANUALLY) {
                        yield vscode_1.env.openExternal(vscode_1.Uri.parse('https://robocorp.com/docs/troubleshooting/windows-long-path'));
                    }
                    else {
                        // Cancel
                        channel_1.OUTPUT_CHANNEL.appendLine('Extension will not be activated because Windows long paths support not enabled.');
                        return false;
                    }
                    result = yield vscode_1.window.showInformationMessage("Press Ok after Long Path support is manually enabled.", { 'modal': true }, 'Ok');
                    if (!result) {
                        channel_1.OUTPUT_CHANNEL.appendLine('Extension will not be activated because Windows long paths support not enabled.');
                        return false;
                    }
                }
                else {
                    return true;
                }
            }
        }
        return true;
    });
}
function getLanguageServerPythonInfoUncached() {
    return __awaiter(this, void 0, void 0, function* () {
        let rccLocation = yield rcc_1.getRccLocation();
        if (!rccLocation) {
            return;
        }
        let robotYaml = files_1.getExtensionRelativeFile('../../bin/create_env/robot.yaml');
        if (!robotYaml) {
            return;
        }
        function createDefaultEnv(progress) {
            return __awaiter(this, void 0, void 0, function* () {
                // Check that the user has long names enabled on windows.
                if (!(yield verifyLongPathSupportOnWindows(rccLocation))) {
                    return undefined;
                }
                // Check that ROBOCORP_HOME is valid (i.e.: doesn't have any spaces in it).
                let robocorpHome = roboConfig.getHome();
                if (!robocorpHome || robocorpHome.length == 0) {
                    robocorpHome = process.env['ROBOCORP_HOME'];
                    if (!robocorpHome) {
                        // Default from RCC (maybe it should provide an API to get it before creating an env?)
                        if (process.platform == 'win32') {
                            robocorpHome = path.join(process.env.LOCALAPPDATA, 'robocorp');
                        }
                        else {
                            robocorpHome = path.join(process.env.HOME, '.robocorp');
                        }
                    }
                }
                channel_1.OUTPUT_CHANNEL.appendLine('ROBOCORP_HOME: ' + robocorpHome);
                let rccDiagnostics = yield rcc_1.runConfigDiagnostics(rccLocation, robocorpHome);
                if (!rccDiagnostics) {
                    let msg = 'There was an error getting RCC diagnostics. Robocorp Code will not be started!';
                    channel_1.OUTPUT_CHANNEL.appendLine(msg);
                    vscode_1.window.showErrorMessage(msg);
                    return undefined;
                }
                while (!rccDiagnostics.isRobocorpHomeOk()) {
                    const SELECT_ROBOCORP_HOME = 'Set new ROBOCORP_HOME';
                    const CANCEL = "Cancel";
                    let result = yield vscode_1.window.showInformationMessage("The current ROBOCORP_HOME is invalid (paths with spaces/non ascii chars are not supported).", SELECT_ROBOCORP_HOME, CANCEL);
                    if (!result || result == CANCEL) {
                        channel_1.OUTPUT_CHANNEL.appendLine('Cancelled setting new ROBOCORP_HOME.');
                        return undefined;
                    }
                    let uriResult = yield vscode_1.window.showOpenDialog({
                        'canSelectFolders': true,
                        'canSelectFiles': false,
                        'canSelectMany': false,
                        'openLabel': 'Set as ROBOCORP_HOME'
                    });
                    if (!uriResult) {
                        channel_1.OUTPUT_CHANNEL.appendLine('Cancelled getting ROBOCORP_HOME path.');
                        return undefined;
                    }
                    if (uriResult.length != 1) {
                        channel_1.OUTPUT_CHANNEL.appendLine('Expected 1 path to set as ROBOCORP_HOME. Found: ' + uriResult.length);
                        return undefined;
                    }
                    robocorpHome = uriResult[0].fsPath;
                    rccDiagnostics = yield rcc_1.runConfigDiagnostics(rccLocation, robocorpHome);
                    if (!rccDiagnostics) {
                        let msg = 'There was an error getting RCC diagnostics. Robocorp Code will not be started!';
                        channel_1.OUTPUT_CHANNEL.appendLine(msg);
                        vscode_1.window.showErrorMessage(msg);
                        return undefined;
                    }
                    if (rccDiagnostics.isRobocorpHomeOk()) {
                        channel_1.OUTPUT_CHANNEL.appendLine('Selected ROBOCORP_HOME: ' + robocorpHome);
                        let config = vscode_1.workspace.getConfiguration('robocorp');
                        yield config.update('home', robocorpHome, vscode_1.ConfigurationTarget.Global);
                    }
                }
                function createOpenUrl(failedCheck) {
                    return (value) => {
                        if (value == 'Open troubleshoot URL') {
                            vscode_1.env.openExternal(vscode_1.Uri.parse(failedCheck.url));
                        }
                    };
                }
                let canProceed = true;
                for (const failedCheck of rccDiagnostics.failedChecks) {
                    if (failedCheck.status == rcc_1.STATUS_FATAL) {
                        canProceed = false;
                    }
                    let func = vscode_1.window.showErrorMessage;
                    if (failedCheck.status == rcc_1.STATUS_WARNING) {
                        func = vscode_1.window.showWarningMessage;
                    }
                    if (failedCheck.url) {
                        func(failedCheck.message, 'Open troubleshoot URL').then(createOpenUrl(failedCheck));
                    }
                    else {
                        func(failedCheck.message);
                    }
                }
                if (!canProceed) {
                    return undefined;
                }
                progress.report({ message: 'Update env (may take a few minutes).' });
                // Get information on a base package with our basic dependencies (this can take a while...).
                let resultPromise = subprocess_1.execFilePromise(rccLocation, ['task', 'run', '--robot', robotYaml, '--controller', 'RobocorpCode'], { env: Object.assign(Object.assign({}, process.env), { ROBOCORP_HOME: robocorpHome }) });
                let timing = new time_1.Timing();
                let finishedCondaRun = false;
                let onFinish = function () {
                    finishedCondaRun = true;
                };
                resultPromise.then(onFinish, onFinish);
                // Busy async loop so that we can show the elapsed time.
                while (true) {
                    yield time_2.sleep(93); // Strange sleep so it's not always a .0 when showing ;)
                    if (finishedCondaRun) {
                        break;
                    }
                    if (timing.elapsedFromLastMeasurement(5000)) {
                        progress.report({ message: 'Update env (may take a few minutes). ' + timing.getTotalElapsedAsStr() + ' elapsed.' });
                    }
                }
                let result = yield resultPromise;
                channel_1.OUTPUT_CHANNEL.appendLine('Took ' + timing.getTotalElapsedAsStr() + ' to update conda env.');
                return result;
            });
        }
        let result = yield vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Robocorp",
            cancellable: false
        }, createDefaultEnv);
        function disabled(msg) {
            msg = 'Robocorp Code extension disabled. Reason: ' + msg;
            channel_1.OUTPUT_CHANNEL.appendLine(msg);
            vscode_1.window.showErrorMessage(msg);
            return undefined;
        }
        if (!result) {
            return disabled('Unable to get python to launch language server.');
        }
        try {
            let jsonContents = result.stderr;
            let start = jsonContents.indexOf('JSON START>>');
            let end = jsonContents.indexOf('<<JSON END');
            if (start == -1 || end == -1) {
                throw Error("Unable to find JSON START>> or <<JSON END");
            }
            start += 'JSON START>>'.length;
            jsonContents = jsonContents.substr(start, end - start);
            let contents = JSON.parse(jsonContents);
            let pythonExe = contents['python_executable'];
            channel_1.OUTPUT_CHANNEL.appendLine('Python executable: ' + pythonExe);
            channel_1.OUTPUT_CHANNEL.appendLine('Python version: ' + contents['python_version']);
            channel_1.OUTPUT_CHANNEL.appendLine('Robot Version: ' + contents['robot_version']);
            let env = contents['environment'];
            if (!env) {
                channel_1.OUTPUT_CHANNEL.appendLine('Environment: NOT received');
            }
            else {
                // Print some env vars we may care about:
                channel_1.OUTPUT_CHANNEL.appendLine('Environment:');
                channel_1.OUTPUT_CHANNEL.appendLine('    PYTHONPATH: ' + env['PYTHONPATH']);
                channel_1.OUTPUT_CHANNEL.appendLine('    APPDATA: ' + env['APPDATA']);
                channel_1.OUTPUT_CHANNEL.appendLine('    HOMEDRIVE: ' + env['HOMEDRIVE']);
                channel_1.OUTPUT_CHANNEL.appendLine('    HOMEPATH: ' + env['HOMEPATH']);
                channel_1.OUTPUT_CHANNEL.appendLine('    HOME: ' + env['HOME']);
                channel_1.OUTPUT_CHANNEL.appendLine('    ROBOT_ROOT: ' + env['ROBOT_ROOT']);
                channel_1.OUTPUT_CHANNEL.appendLine('    ROBOT_ARTIFACTS: ' + env['ROBOT_ARTIFACTS']);
                channel_1.OUTPUT_CHANNEL.appendLine('    RCC_INSTALLATION_ID: ' + env['RCC_INSTALLATION_ID']);
                channel_1.OUTPUT_CHANNEL.appendLine('    ROBOCORP_HOME: ' + env['ROBOCORP_HOME']);
                channel_1.OUTPUT_CHANNEL.appendLine('    PROCESSOR_ARCHITECTURE: ' + env['PROCESSOR_ARCHITECTURE']);
                channel_1.OUTPUT_CHANNEL.appendLine('    OS: ' + env['OS']);
                channel_1.OUTPUT_CHANNEL.appendLine('    PATH: ' + env['PATH']);
            }
            if (files_1.verifyFileExists(pythonExe)) {
                return {
                    pythonExe: pythonExe,
                    environ: contents['environment'],
                    additionalPythonpathEntries: [],
                };
            }
            return disabled('Python executable: ' + pythonExe + ' does not exist.');
        }
        catch (error) {
            return disabled('Unable to get python to launch language server.\nStderr: ' + result.stderr + '\nStdout (json contents): ' + result.stdout);
        }
    });
}
//# sourceMappingURL=extension.js.map