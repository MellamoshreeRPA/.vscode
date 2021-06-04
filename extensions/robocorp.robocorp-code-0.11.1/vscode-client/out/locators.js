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
exports.startBrowserLocator = exports.pickImageLocator = exports.pickBrowserLocator = exports.newLocatorUITreeInternal = exports.copySelectedToClipboard = exports.newLocatorUI = void 0;
const roboCommands = require("./robocorpCommands");
const vscode_1 = require("vscode");
const activities_1 = require("./activities");
const ask_1 = require("./ask");
const viewsCommon_1 = require("./viewsCommon");
const channel_1 = require("./channel");
let LAST_URL = undefined;
function newLocatorUI(robotYaml) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!robotYaml) {
            // Ask for the robot to be used and then show dialog with the options.
            let robot = yield activities_1.listAndAskRobotSelection('Please select the Robot where the locators should be saved.', 'Unable to create locator (no Robot detected in the Workspace).');
            if (!robot) {
                return;
            }
            robotYaml = robot.filePath;
        }
        let items = [{
                'label': 'Browser Locator',
                'description': 'Select element in browser to create a Locator',
                'action': 'browser'
            },
            {
                'label': 'Image Locator',
                'description': 'Create Image locator from a screen region.',
                'action': 'image'
            }];
        let selectedItem = yield ask_1.showSelectOneQuickPick(items, "Select locator to create");
        if (!selectedItem) {
            return;
        }
        if (selectedItem.action == 'browser') {
            yield newBrowserLocatorUI(robotYaml);
        }
        else if (selectedItem.action == 'image') {
            yield newImageLocatorUI(robotYaml);
        }
        else {
            throw Error('Unexpected action: ' + selectedItem.action);
        }
    });
}
exports.newLocatorUI = newLocatorUI;
function newImageLocatorUI(robotYaml) {
    return __awaiter(this, void 0, void 0, function* () {
        let msg = "Select action";
        while (true) {
            let items = [{
                    'label': 'Create Image Locator from screen region',
                    'description': 'Please arrange the windows prior to activating this option',
                    'action': 'pick'
                },
                {
                    'label': 'Cancel',
                    'description': 'Stops Locator creation',
                    'action': 'stop'
                }];
            let selectedItem = yield ask_1.showSelectOneQuickPick(items, msg);
            if (!selectedItem || selectedItem.action == 'stop') {
                return;
            }
            yield pickImageLocator(robotYaml);
            msg = 'Locator created. Do you want to create another one?';
        }
    });
}
function newBrowserLocatorUI(robotYaml) {
    return __awaiter(this, void 0, void 0, function* () {
        startBrowserLocator(robotYaml);
        let msg = "When browser is opened, enter the URL and when ready select 'Create Browser Locator from Pick'.";
        while (true) {
            let items = [{
                    'label': 'Create Browser Locator from Pick',
                    'description': 'Select element in browser to create a Locator',
                    'action': 'pick'
                },
                {
                    'label': 'Cancel',
                    'description': 'Closes Browser and stops Locator creation',
                    'action': 'stop'
                }];
            let selectedItem = yield ask_1.showSelectOneQuickPick(items, msg);
            if (!selectedItem || selectedItem.action == 'stop') {
                yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_STOP_BROWSER_LOCATOR);
                return;
            }
            yield pickBrowserLocator();
            msg = 'Locator created. Do you want to create another one or close the browser?';
        }
    });
}
function copySelectedToClipboard() {
    return __awaiter(this, void 0, void 0, function* () {
        let locatorSelected = viewsCommon_1.getSelectedLocator();
        if (locatorSelected) {
            vscode_1.env.clipboard.writeText(locatorSelected.name);
        }
    });
}
exports.copySelectedToClipboard = copySelectedToClipboard;
function newLocatorUITreeInternal(robotYaml) {
    return __awaiter(this, void 0, void 0, function* () {
        // Same as newLocatorUI but we'll use the robot passed as a parameter or
        // get the selected robot from the robots tree.
        if (!robotYaml) {
            let robotEntry = viewsCommon_1.getSelectedRobot("Unable to create locator (Robot not selected in Robots Tree).", "Unable to create locator -- only 1 Robot must be selected.");
            if (!robotEntry) {
                return;
            }
            robotYaml = robotEntry.robot.filePath;
        }
        if (!robotYaml) {
            vscode_1.window.showErrorMessage('robotYaml not available to create locator.');
        }
        // For now we can only deal with the Browser Locator...
        // let s = showSelectOneStrQuickPick(['Browser Locator'], 'Select locator to create');
        newLocatorUI(robotYaml);
    });
}
exports.newLocatorUITreeInternal = newLocatorUITreeInternal;
function pickBrowserLocator() {
    return __awaiter(this, void 0, void 0, function* () {
        let pickResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_CREATE_LOCATOR_FROM_BROWSER_PICK_INTERNAL);
        if (pickResult.success) {
            vscode_1.window.showInformationMessage("Created locator: " + pickResult.result['name']);
        }
        else {
            channel_1.OUTPUT_CHANNEL.appendLine(pickResult.message);
            vscode_1.window.showErrorMessage(pickResult.message);
        }
    });
}
exports.pickBrowserLocator = pickBrowserLocator;
function pickImageLocator(robotYaml) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!robotYaml) {
            let robot = yield activities_1.listAndAskRobotSelection('Please select the Robot where the locators should be saved.', 'Unable to create image locator (no Robot detected in the Workspace).');
            if (!robot) {
                return;
            }
            robotYaml = robot.filePath;
        }
        let pickResult = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_CREATE_LOCATOR_FROM_SCREEN_REGION_INTERNAL, { 'robotYaml': robotYaml });
        if (pickResult.success) {
            vscode_1.window.showInformationMessage("Created locator: " + pickResult.result['name']);
        }
        else {
            channel_1.OUTPUT_CHANNEL.appendLine(pickResult.message);
            vscode_1.window.showErrorMessage(pickResult.message);
        }
    });
}
exports.pickImageLocator = pickImageLocator;
function startBrowserLocator(robotYaml) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!robotYaml) {
            let robot = yield activities_1.listAndAskRobotSelection('Please select the Robot where the locators should be saved.', 'Unable to start browser locator (no Robot detected in the Workspace).');
            if (!robot) {
                return;
            }
            robotYaml = robot.filePath;
        }
        let actionResultCreateLocator = yield vscode_1.commands.executeCommand(roboCommands.ROBOCORP_START_BROWSER_LOCATOR_INTERNAL, { 'robotYaml': robotYaml });
        if (actionResultCreateLocator.success) {
            vscode_1.window.showInformationMessage("Started browser to create locators. Please use the 'Robocorp: Create Locator from Browser Pick' command to actually create a locator.");
        }
        else {
            channel_1.OUTPUT_CHANNEL.appendLine(actionResultCreateLocator.message);
            vscode_1.window.showErrorMessage(actionResultCreateLocator.message);
        }
    });
}
exports.startBrowserLocator = startBrowserLocator;
//# sourceMappingURL=locators.js.map