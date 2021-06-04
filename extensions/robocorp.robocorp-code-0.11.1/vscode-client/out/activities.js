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
exports.createRobot = exports.runRobotRCC = exports.askAndRunRobotRCC = exports.uploadRobot = exports.rccConfigurationDiagnostics = exports.setPythonInterpreterFromRobotYaml = exports.askRobotSelection = exports.listAndAskRobotSelection = exports.cloudLogout = exports.cloudLogin = void 0;
const vscode_1 = require("vscode");
const path_1 = require("path");
const channel_1 = require("./channel");
const roboCommands = require("./robocorpCommands");
const ask_1 = require("./ask");
function cloudLogin() {
    return __awaiter(this, void 0, void 0, function* () {
        let loggedIn;
        do {
            let credentials = yield vscode_1.window.showInputBox({
                'password': true,
                'prompt': 'Please provide the access credentials - Confirm without entering any text to open https://cloud.robocorp.com/settings/access-credentials where credentials may be obtained - ',
                'ignoreFocusOut': true,
            });
            if (credentials == undefined) {
                return false;
            }
            if (!credentials) {
                vscode_1.env.openExternal(vscode_1.Uri.parse('https://cloud.robocorp.com/settings/access-credentials'));
                continue;
            }
            loggedIn = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_CLOUD_LOGIN_INTERNAL, { 'credentials': credentials });
            if (!loggedIn) {
                let retry = "Retry with new credentials";
                let selectedItem = yield vscode_1.window.showWarningMessage('Unable to log in with the provided credentials.', { 'modal': true }, retry);
                if (!selectedItem) {
                    return false;
                }
            }
        } while (!loggedIn);
        return true;
    });
}
exports.cloudLogin = cloudLogin;
function cloudLogout() {
    return __awaiter(this, void 0, void 0, function* () {
        let loggedOut;
        let isLoginNeeded = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_IS_LOGIN_NEEDED_INTERNAL);
        if (!isLoginNeeded) {
            vscode_1.window.showInformationMessage('Error getting information if already linked in.');
            return;
        }
        if (isLoginNeeded.result) {
            vscode_1.window.showInformationMessage('Unable to unlink and remove credentials from Robocorp Cloud. Not linked with valid cloud credentials.');
            return;
        }
        loggedOut = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_CLOUD_LOGOUT_INTERNAL);
        if (!loggedOut) {
            vscode_1.window.showInformationMessage('Error with unlinking Robocorp Cloud credentials.');
            return;
        }
        if (!loggedOut.success) {
            vscode_1.window.showInformationMessage('Unable to unlink Robocorp Cloud credentials.');
            return;
        }
        vscode_1.window.showInformationMessage('Robocorp Cloud credentials successfully unlinked and removed.');
    });
}
exports.cloudLogout = cloudLogout;
function listAndAskRobotSelection(selectionMessage, noRobotErrorMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_LOCAL_LIST_ROBOTS_INTERNAL);
        if (!actionResult.success) {
            vscode_1.window.showInformationMessage('Error listing robots: ' + actionResult.message);
            return;
        }
        let robotsInfo = actionResult.result;
        if (!robotsInfo || robotsInfo.length == 0) {
            vscode_1.window.showInformationMessage(noRobotErrorMessage);
            return;
        }
        let robot = yield askRobotSelection(robotsInfo, selectionMessage);
        if (!robot) {
            return;
        }
        return robot;
    });
}
exports.listAndAskRobotSelection = listAndAskRobotSelection;
function askRobotSelection(robotsInfo, message) {
    return __awaiter(this, void 0, void 0, function* () {
        let robot;
        if (robotsInfo.length > 1) {
            let captions = new Array();
            for (let i = 0; i < robotsInfo.length; i++) {
                const element = robotsInfo[i];
                let caption = {
                    'label': element.name,
                    'description': element.directory,
                    'action': element
                };
                captions.push(caption);
            }
            let selectedItem = yield ask_1.showSelectOneQuickPick(captions, message);
            if (!selectedItem) {
                return;
            }
            robot = selectedItem.action;
        }
        else {
            robot = robotsInfo[0];
        }
        return robot;
    });
}
exports.askRobotSelection = askRobotSelection;
function askAndCreateNewRobotAtWorkspace(wsInfo, directory) {
    return __awaiter(this, void 0, void 0, function* () {
        let robotName = yield vscode_1.window.showInputBox({
            'prompt': 'Please provide the name for the new Robot.',
            'ignoreFocusOut': true,
        });
        if (!robotName) {
            return;
        }
        let actionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_UPLOAD_TO_NEW_ROBOT_INTERNAL, { 'workspaceId': wsInfo.workspaceId, 'directory': directory, 'robotName': robotName });
        if (!actionResult.success) {
            let msg = 'Error uploading to new Robot: ' + actionResult.message;
            channel_1.OUTPUT_CHANNEL.appendLine(msg);
            vscode_1.window.showErrorMessage(msg);
        }
        else {
            vscode_1.window.showInformationMessage('Successfully submitted new Robot ' + robotName + ' to the cloud.');
        }
    });
}
function setPythonInterpreterFromRobotYaml() {
    return __awaiter(this, void 0, void 0, function* () {
        let actionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_LOCAL_LIST_ROBOTS_INTERNAL);
        if (!actionResult.success) {
            vscode_1.window.showInformationMessage('Error listing existing robots: ' + actionResult.message);
            return;
        }
        let robotsInfo = actionResult.result;
        if (!robotsInfo || robotsInfo.length == 0) {
            vscode_1.window.showInformationMessage('Unable to set Python extension interpreter (no Robot detected in the Workspace).');
            return;
        }
        let robot = yield askRobotSelection(robotsInfo, 'Please select the Robot from which the python executable should be used.');
        if (!robot) {
            return;
        }
        try {
            let result = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_RESOLVE_INTERPRETER, { 'target_robot': robot.filePath });
            if (!result.success) {
                vscode_1.window.showWarningMessage('Error resolving interpreter info: ' + result.message);
                return;
            }
            let interpreter = result.result;
            if (!interpreter || !interpreter.pythonExe) {
                vscode_1.window.showWarningMessage('Unable to obtain interpreter information from: ' + robot.filePath);
                return;
            }
            // Note: if we got here we have a robot in the workspace.
            let selectedItem = yield ask_1.showSelectOneStrQuickPick(['Workspace Settings', 'Global Settings'], 'Please select where the python.pythonPath configuration should be set.');
            if (!selectedItem) {
                return;
            }
            let configurationTarget = undefined;
            if (selectedItem == 'Global Settings') {
                configurationTarget = vscode_1.ConfigurationTarget.Global;
            }
            else if (selectedItem == 'Workspace Settings') {
                configurationTarget = vscode_1.ConfigurationTarget.Workspace;
            }
            else {
                vscode_1.window.showWarningMessage('Invalid configuration target: ' + selectedItem);
                return;
            }
            let config = vscode_1.workspace.getConfiguration('python');
            yield config.update('pythonPath', interpreter.pythonExe, configurationTarget);
            vscode_1.window.showInformationMessage('Successfully set python.pythonPath set in: ' + selectedItem);
        }
        catch (error) {
            vscode_1.window.showWarningMessage('Error setting python.pythonPath configuration: ' + error);
            return;
        }
    });
}
exports.setPythonInterpreterFromRobotYaml = setPythonInterpreterFromRobotYaml;
function rccConfigurationDiagnostics() {
    return __awaiter(this, void 0, void 0, function* () {
        let actionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_LOCAL_LIST_ROBOTS_INTERNAL);
        if (!actionResult.success) {
            vscode_1.window.showInformationMessage('Error listing robots: ' + actionResult.message);
            return;
        }
        let robotsInfo = actionResult.result;
        if (!robotsInfo || robotsInfo.length == 0) {
            vscode_1.window.showInformationMessage('No Robot detected in the Workspace. If a robot.yaml is available, open it for more information.');
            return;
        }
        let robot = yield askRobotSelection(robotsInfo, 'Please select the Robot to analyze.');
        if (!robot) {
            return;
        }
        let diagnosticsActionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_CONFIGURATION_DIAGNOSTICS_INTERNAL, { 'robotYaml': robot.filePath });
        if (!diagnosticsActionResult.success) {
            vscode_1.window.showErrorMessage('Error computing diagnostics for Robot: ' + diagnosticsActionResult.message);
            return;
        }
        channel_1.OUTPUT_CHANNEL.appendLine(diagnosticsActionResult.result);
        vscode_1.workspace.openTextDocument({ 'content': diagnosticsActionResult.result }).then(document => {
            vscode_1.window.showTextDocument(document);
        });
    });
}
exports.rccConfigurationDiagnostics = rccConfigurationDiagnostics;
function uploadRobot(robot) {
    return __awaiter(this, void 0, void 0, function* () {
        // Start this in parallel while we ask the user for info.
        let isLoginNeededPromise = vscode_1.commands.executeCommand(roboCommands.ROBOCORP_IS_LOGIN_NEEDED_INTERNAL);
        let currentUri;
        if (vscode_1.window.activeTextEditor && vscode_1.window.activeTextEditor.document) {
            currentUri = vscode_1.window.activeTextEditor.document.uri;
        }
        let actionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_LOCAL_LIST_ROBOTS_INTERNAL);
        if (!actionResult.success) {
            vscode_1.window.showInformationMessage('Error submitting Robot to the cloud: ' + actionResult.message);
            return;
        }
        let robotsInfo = actionResult.result;
        if (!robotsInfo || robotsInfo.length == 0) {
            vscode_1.window.showInformationMessage('Unable to submit Robot to the cloud (no Robot detected in the Workspace).');
            return;
        }
        let isLoginNeeded = yield isLoginNeededPromise;
        if (!isLoginNeeded) {
            vscode_1.window.showInformationMessage('Error getting if login is needed.');
            return;
        }
        if (isLoginNeeded.result) {
            let loggedIn = yield cloudLogin();
            if (!loggedIn) {
                return;
            }
        }
        if (!robot) {
            robot = yield askRobotSelection(robotsInfo, 'Please select the Robot to upload to the Cloud.');
            if (!robot) {
                return;
            }
        }
        let refresh = false;
        SELECT_OR_REFRESH: do {
            // We ask for the information on the existing workspaces information.
            // Note that this may be cached from the last time it was asked, 
            // so, we have an option to refresh it (and ask again).
            let actionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_CLOUD_LIST_WORKSPACES_INTERNAL, { 'refresh': refresh });
            if (!actionResult.success) {
                vscode_1.window.showErrorMessage('Error listing cloud workspaces: ' + actionResult.message);
                return;
            }
            let workspaceInfo = actionResult.result;
            if (!workspaceInfo || workspaceInfo.length == 0) {
                vscode_1.window.showErrorMessage('A Cloud Workspace must be created to submit a Robot to the cloud.');
                return;
            }
            // Now, if there are only a few items or a single workspace,
            // just show it all, otherwise do a pre-selectedItem with the workspace.
            let workspaceIdFilter = undefined;
            if (workspaceInfo.length > 1) {
                // Ok, there are many workspaces, let's provide a pre-filter for it.
                let captions = new Array();
                for (let i = 0; i < workspaceInfo.length; i++) {
                    const wsInfo = workspaceInfo[i];
                    let caption = {
                        'label': '$(folder) ' + wsInfo.workspaceName,
                        'action': { 'filterWorkspaceId': wsInfo.workspaceId },
                    };
                    captions.push(caption);
                }
                ask_1.sortCaptions(captions);
                let caption = {
                    'label': '$(refresh) * Refresh list',
                    'description': 'Expected Workspace is not appearing.',
                    'sortKey': '09999',
                    'action': { 'refresh': true }
                };
                captions.push(caption);
                let selectedItem = yield ask_1.showSelectOneQuickPick(captions, 'Please select Workspace to upload: ' + robot.name + ' (' + robot.directory + ')' + '.');
                if (!selectedItem) {
                    return;
                }
                if (selectedItem.action.refresh) {
                    refresh = true;
                    continue SELECT_OR_REFRESH;
                }
                else {
                    workspaceIdFilter = selectedItem.action.filterWorkspaceId;
                }
            }
            // -------------------------------------------------------
            // Select Robot/New Robot/Refresh
            // -------------------------------------------------------
            let captions = new Array();
            for (let i = 0; i < workspaceInfo.length; i++) {
                const wsInfo = workspaceInfo[i];
                if (workspaceIdFilter) {
                    if (workspaceIdFilter != wsInfo.workspaceId) {
                        continue;
                    }
                }
                for (let j = 0; j < wsInfo.packages.length; j++) {
                    const robotInfo = wsInfo.packages[j];
                    // i.e.: Show the Robots with the same name with more priority in the list.
                    let sortKey = 'b' + robotInfo.name;
                    if (robotInfo.name == robot.name) {
                        sortKey = 'a' + robotInfo.name;
                    }
                    let caption = {
                        'label': '$(file) ' + robotInfo.name,
                        'description': '(Workspace: ' + wsInfo.workspaceName + ')',
                        'sortKey': sortKey,
                        'action': { 'existingRobotPackage': robotInfo }
                    };
                    captions.push(caption);
                }
                let caption = {
                    'label': '$(new-folder) + Create new Robot',
                    'description': '(Workspace: ' + wsInfo.workspaceName + ')',
                    'sortKey': 'c' + wsInfo.workspaceName,
                    'action': { 'newRobotPackageAtWorkspace': wsInfo }
                };
                captions.push(caption);
            }
            let caption = {
                'label': '$(refresh) * Refresh list',
                'description': 'Expected Workspace or Robot is not appearing.',
                'sortKey': 'd',
                'action': { 'refresh': true }
            };
            captions.push(caption);
            ask_1.sortCaptions(captions);
            let selectedItem = yield ask_1.showSelectOneQuickPick(captions, 'Please select target Robot to upload: ' + robot.name + ' (' + robot.directory + ').');
            if (!selectedItem) {
                return;
            }
            let action = selectedItem.action;
            if (action.refresh) {
                refresh = true;
                continue SELECT_OR_REFRESH;
            }
            if (action.newRobotPackageAtWorkspace) {
                // No confirmation in this case
                let wsInfo = action.newRobotPackageAtWorkspace;
                yield askAndCreateNewRobotAtWorkspace(wsInfo, robot.directory);
                return;
            }
            if (action.existingRobotPackage) {
                let yesOverride = 'Yes (override existing Robot)';
                let noChooseDifferentTarget = 'No (choose different target)';
                let cancel = 'Cancel';
                let robotInfo = action.existingRobotPackage;
                let selectedItem = yield vscode_1.window.showWarningMessage("Upload of the contents of " + robot.directory + " to: " + robotInfo.name + " (" + robotInfo.workspaceName + ")", ...[yesOverride, noChooseDifferentTarget, cancel]);
                // robot.language-server.python
                if (selectedItem == noChooseDifferentTarget) {
                    refresh = false;
                    continue SELECT_OR_REFRESH;
                }
                if (selectedItem == cancel) {
                    return;
                }
                // selectedItem == yesOverride.
                let actionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_UPLOAD_TO_EXISTING_ROBOT_INTERNAL, { 'workspaceId': robotInfo.workspaceId, 'robotId': robotInfo.id, 'directory': robot.directory });
                if (!actionResult.success) {
                    let msg = 'Error uploading to existing Robot: ' + actionResult.message;
                    channel_1.OUTPUT_CHANNEL.appendLine(msg);
                    vscode_1.window.showErrorMessage(msg);
                }
                else {
                    vscode_1.window.showInformationMessage('Successfully submitted Robot ' + robot.name + ' to the cloud.');
                }
                return;
            }
        } while (true);
    });
}
exports.uploadRobot = uploadRobot;
function askAndRunRobotRCC(noDebug) {
    return __awaiter(this, void 0, void 0, function* () {
        let textEditor = vscode_1.window.activeTextEditor;
        let fileName = undefined;
        if (textEditor) {
            fileName = textEditor.document.fileName;
        }
        const RUN_IN_RCC_LRU_CACHE_NAME = 'RUN_IN_RCC_LRU_CACHE';
        let runLRU = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_LOAD_FROM_DISK_LRU, { 'name': RUN_IN_RCC_LRU_CACHE_NAME });
        let actionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_LOCAL_LIST_ROBOTS_INTERNAL);
        if (!actionResult.success) {
            vscode_1.window.showErrorMessage('Error listing Robots: ' + actionResult.message);
            return;
        }
        let robotsInfo = actionResult.result;
        if (!robotsInfo || robotsInfo.length == 0) {
            vscode_1.window.showInformationMessage('Unable to run Robot (no Robot detected in the Workspace).');
            return;
        }
        let items = new Array();
        for (let robotInfo of robotsInfo) {
            let yamlContents = robotInfo.yamlContents;
            let tasks = yamlContents['tasks'];
            if (tasks) {
                let taskNames = Object.keys(tasks);
                for (let taskName of taskNames) {
                    let keyInLRU = robotInfo.name + ' - ' + taskName + ' - ' + robotInfo.filePath;
                    let item = {
                        'label': 'Run robot: ' + robotInfo.name + '    Task: ' + taskName,
                        'description': robotInfo.filePath,
                        'robotYaml': robotInfo.filePath,
                        'taskName': taskName,
                        'keyInLRU': keyInLRU,
                    };
                    if (runLRU && runLRU.length > 0 && keyInLRU == runLRU[0]) {
                        // Note that although we have an LRU we just consider the last one for now.
                        items.splice(0, 0, item);
                    }
                    else {
                        items.push(item);
                    }
                }
            }
        }
        if (!items) {
            vscode_1.window.showInformationMessage('Unable to run Robot (no Robot detected in the Workspace).');
            return;
        }
        let selectedItem;
        if (items.length == 1) {
            selectedItem = items[0];
        }
        else {
            selectedItem = yield vscode_1.window.showQuickPick(items, {
                "canPickMany": false,
                'placeHolder': 'Please select the Robot and Task to run.',
                'ignoreFocusOut': true,
            });
        }
        if (!selectedItem) {
            return;
        }
        yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_SAVE_IN_DISK_LRU, { 'name': RUN_IN_RCC_LRU_CACHE_NAME, 'entry': selectedItem.keyInLRU, 'lru_size': 3 });
        runRobotRCC(noDebug, selectedItem.robotYaml, selectedItem.taskName);
    });
}
exports.askAndRunRobotRCC = askAndRunRobotRCC;
function runRobotRCC(noDebug, robotYaml, taskName) {
    return __awaiter(this, void 0, void 0, function* () {
        let debugConfiguration = {
            'name': 'Config',
            'type': 'robocorp-code',
            'request': 'launch',
            'robot': robotYaml,
            'task': taskName,
            'args': [],
            'noDebug': noDebug,
        };
        let debugSessionOptions = {};
        vscode_1.debug.startDebugging(undefined, debugConfiguration, debugSessionOptions);
    });
}
exports.runRobotRCC = runRobotRCC;
function createRobot() {
    return __awaiter(this, void 0, void 0, function* () {
        // Unfortunately vscode does not have a good way to request multiple inputs at once,
        // so, for now we're asking each at a separate step.
        let actionResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_LIST_ROBOT_TEMPLATES_INTERNAL);
        if (!actionResult.success) {
            vscode_1.window.showErrorMessage('Unable to list Robot templates: ' + actionResult.message);
            return;
        }
        let availableTemplates = actionResult.result;
        if (availableTemplates) {
            let wsFolders = vscode_1.workspace.workspaceFolders;
            if (!wsFolders) {
                vscode_1.window.showErrorMessage('Unable to create Robot (no workspace folder is currently opened).');
                return;
            }
            let selectedItem = yield vscode_1.window.showQuickPick(availableTemplates, {
                "canPickMany": false,
                'placeHolder': 'Please select the template for the Robot.',
                'ignoreFocusOut': true,
            });
            channel_1.OUTPUT_CHANNEL.appendLine('Selected: ' + selectedItem);
            let ws;
            if (!selectedItem) {
                // Operation cancelled.
                return;
            }
            if (wsFolders.length == 1) {
                ws = wsFolders[0];
            }
            else {
                ws = yield vscode_1.window.showWorkspaceFolderPick({
                    'placeHolder': 'Please select the folder to create the Robot.',
                    'ignoreFocusOut': true,
                });
            }
            if (!ws) {
                // Operation cancelled.
                return;
            }
            let name = yield vscode_1.window.showInputBox({
                'value': 'Example',
                'prompt': 'Please provide the name for the Robot folder name.',
                'ignoreFocusOut': true,
            });
            if (!name) {
                // Operation cancelled.
                return;
            }
            channel_1.OUTPUT_CHANNEL.appendLine('Creating Robot at: ' + ws.uri.fsPath);
            let createRobotResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_CREATE_ROBOT_INTERNAL, { 'directory': ws.uri.fsPath, 'template': selectedItem, 'name': name });
            if (createRobotResult.success) {
                try {
                    vscode_1.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
                }
                catch (error) {
                    channel_1.OUTPUT_CHANNEL.appendLine('Error refreshing file explorer.');
                }
                vscode_1.window.showInformationMessage('Robot successfully created in:\n' + path_1.join(ws.uri.fsPath, name));
            }
            else {
                channel_1.OUTPUT_CHANNEL.appendLine('Error creating Robot at: ' + +ws.uri.fsPath);
                vscode_1.window.showErrorMessage(createRobotResult.message);
            }
        }
    });
}
exports.createRobot = createRobot;
//# sourceMappingURL=activities.js.map