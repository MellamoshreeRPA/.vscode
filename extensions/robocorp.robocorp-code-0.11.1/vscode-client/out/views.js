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
exports.registerViews = exports.runSelectedRobot = exports.createRccTerminalTreeSelection = exports.openLocatorTreeSelection = exports.cloudUploadRobotTreeSelection = exports.openRobotTreeSelection = exports.refreshTreeView = exports.refreshCloudTreeView = exports.LocatorsTreeDataProvider = exports.RobotsTreeDataProvider = exports.CloudTreeDataProvider = void 0;
const robocorpViews_1 = require("./robocorpViews");
const vscode = require("vscode");
const roboCommands = require("./robocorpCommands");
const channel_1 = require("./channel");
const activities_1 = require("./activities");
const rccTerminal_1 = require("./rccTerminal");
const viewsRobotContent_1 = require("./viewsRobotContent");
const viewsCommon_1 = require("./viewsCommon");
function getRobotLabel(robotInfo) {
    let label = undefined;
    if (robotInfo.yamlContents) {
        label = robotInfo.yamlContents['name'];
    }
    if (!label) {
        if (robotInfo.directory) {
            label = viewsCommon_1.basename(robotInfo.directory);
        }
    }
    if (!label) {
        label = '';
    }
    return label;
}
let _globalSentMetric = false;
class CloudTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.refreshOnce = false;
    }
    fireRootChange() {
        this._onDidChangeTreeData.fire(null);
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!element) {
                let accountInfoResult = yield vscode.commands.executeCommand(roboCommands.ROBOCORP_GET_LINKED_ACCOUNT_INFO_INTERNAL);
                if (!accountInfoResult.success) {
                    return [{
                            'label': 'Account not linked. Click to link account.',
                            'iconPath': 'link',
                            'command': {
                                'title': 'Link to Robocorp Cloud',
                                'command': roboCommands.ROBOCORP_CLOUD_LOGIN,
                            }
                        }];
                }
                let accountInfo = accountInfoResult.result;
                let ret = [{
                        'label': 'Account: ' + accountInfo['fullname'] + ' (' + accountInfo['email'] + ')',
                    }];
                let refresh = this.refreshOnce;
                this.refreshOnce = false;
                let actionResult = yield vscode.commands.executeCommand(roboCommands.ROBOCORP_CLOUD_LIST_WORKSPACES_INTERNAL, { 'refresh': refresh });
                if (actionResult.success) {
                    let workspaceInfo = actionResult.result;
                    for (let i = 0; i < workspaceInfo.length; i++) {
                        const element = workspaceInfo[i];
                        let children = [];
                        let packages = element.packages;
                        for (let j = 0; j < packages.length; j++) {
                            const p = packages[j];
                            children.push({ 'label': p.name });
                        }
                        ret.push({
                            'label': element.workspaceName,
                            'children': children
                        });
                    }
                }
                return ret;
            }
            if (element.children) {
                return element.children;
            }
            return [];
        });
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.label, element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        treeItem.command = element.command;
        treeItem.iconPath = new vscode.ThemeIcon(element.iconPath);
        return treeItem;
    }
}
exports.CloudTreeDataProvider = CloudTreeDataProvider;
class RobotsTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    fireRootChange() {
        this._onDidChangeTreeData.fire(null);
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (element) {
                // Get child elements.
                if (element.type == viewsCommon_1.RobotEntryType.Task) {
                    return []; // Tasks don't have children.
                }
                let yamlContents = element.robot.yamlContents;
                if (!yamlContents) {
                    return [];
                }
                let tasks = yamlContents['tasks'];
                if (!tasks) {
                    return [];
                }
                const robotInfo = element.robot;
                return Object.keys(tasks).map((task) => ({
                    'label': task,
                    'uri': vscode.Uri.file(robotInfo.filePath),
                    'robot': robotInfo,
                    'taskName': task,
                    'iconPath': 'symbol-misc',
                    'type': viewsCommon_1.RobotEntryType.Task,
                }));
            }
            if (!_globalSentMetric) {
                _globalSentMetric = true;
                vscode.commands.executeCommand(roboCommands.ROBOCORP_SEND_METRIC, {
                    'name': 'vscode.treeview.used', 'value': '1'
                });
            }
            // Get root elements.
            let actionResult = yield vscode.commands.executeCommand(roboCommands.ROBOCORP_LOCAL_LIST_ROBOTS_INTERNAL);
            if (!actionResult.success) {
                channel_1.OUTPUT_CHANNEL.appendLine(actionResult.message);
                return [];
            }
            let robotsInfo = actionResult.result;
            if (!robotsInfo || robotsInfo.length == 0) {
                return [];
            }
            return robotsInfo.map((robotInfo) => ({
                'label': getRobotLabel(robotInfo),
                'uri': vscode.Uri.file(robotInfo.filePath),
                'robot': robotInfo,
                'iconPath': 'package',
                'type': viewsCommon_1.RobotEntryType.Robot,
            }));
        });
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.label, element.taskName ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.iconPath = new vscode.ThemeIcon(element.iconPath);
        return treeItem;
    }
}
exports.RobotsTreeDataProvider = RobotsTreeDataProvider;
class LocatorsTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.lastRobotEntry = undefined;
    }
    fireRootChange() {
        this._onDidChangeTreeData.fire(null);
    }
    onRobotsTreeSelectionChanged() {
        let robotEntry = viewsCommon_1.getSelectedRobot();
        if (!this.lastRobotEntry && !robotEntry) {
            // nothing changed
            return;
        }
        if (!this.lastRobotEntry && robotEntry) {
            // i.e.: we didn't have a selection previously: refresh.
            this.fireRootChange();
            return;
        }
        if (!robotEntry && this.lastRobotEntry) {
            this.fireRootChange();
            return;
        }
        if (robotEntry.robot.filePath != this.lastRobotEntry.robot.filePath) {
            // i.e.: the selection changed: refresh.
            this.fireRootChange();
            return;
        }
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            // i.e.: the contents of this tree depend on what's selected in the robots tree.
            const robotsTree = viewsCommon_1.treeViewIdToTreeView.get(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOTS_TREE);
            if (!robotsTree || robotsTree.selection.length == 0) {
                this.lastRobotEntry = undefined;
                return [{
                        name: "<Waiting for Robot Selection...>",
                        type: "info",
                        line: 0,
                        column: 0,
                        filePath: undefined,
                    }];
            }
            let robotEntry = robotsTree.selection[0];
            let actionResult = yield vscode.commands.executeCommand(roboCommands.ROBOCORP_GET_LOCATORS_JSON_INFO, { 'robotYaml': robotEntry.robot.filePath });
            if (!actionResult['success']) {
                this.lastRobotEntry = undefined;
                return [{
                        name: actionResult.message,
                        type: "error",
                        line: 0,
                        column: 0,
                        filePath: robotEntry.robot.filePath,
                    }];
            }
            this.lastRobotEntry = robotEntry;
            let locatorInfo = actionResult['result'];
            return locatorInfo;
        });
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.name);
        // https://microsoft.github.io/vscode-codicons/dist/codicon.html
        let iconPath = "file-media";
        if (element.type == "browser") {
            iconPath = "browser";
        }
        else if (element.type == "error") {
            iconPath = "error";
        }
        treeItem.iconPath = new vscode.ThemeIcon(iconPath);
        return treeItem;
    }
}
exports.LocatorsTreeDataProvider = LocatorsTreeDataProvider;
function refreshCloudTreeView() {
    let dataProvider = viewsCommon_1.treeViewIdToTreeDataProvider.get(robocorpViews_1.TREE_VIEW_ROBOCORP_CLOUD_TREE);
    if (dataProvider) {
        dataProvider.refreshOnce = true;
        dataProvider.fireRootChange();
    }
}
exports.refreshCloudTreeView = refreshCloudTreeView;
function refreshTreeView(treeViewId) {
    let dataProvider = viewsCommon_1.treeViewIdToTreeDataProvider.get(treeViewId);
    if (dataProvider) {
        dataProvider.fireRootChange();
    }
}
exports.refreshTreeView = refreshTreeView;
function openRobotTreeSelection() {
    let robot = viewsCommon_1.getSelectedRobot();
    if (robot) {
        vscode.window.showTextDocument(robot.uri);
    }
}
exports.openRobotTreeSelection = openRobotTreeSelection;
function cloudUploadRobotTreeSelection() {
    let robot = viewsCommon_1.getSelectedRobot();
    if (robot) {
        activities_1.uploadRobot(robot.robot);
    }
}
exports.cloudUploadRobotTreeSelection = cloudUploadRobotTreeSelection;
function openLocatorTreeSelection() {
    let locator = viewsCommon_1.getSelectedLocator();
    if (locator) {
        vscode.window.showTextDocument(vscode.Uri.file(locator.filePath));
    }
}
exports.openLocatorTreeSelection = openLocatorTreeSelection;
function createRccTerminalTreeSelection() {
    return __awaiter(this, void 0, void 0, function* () {
        let robot = viewsCommon_1.getSelectedRobot();
        if (robot) {
            rccTerminal_1.createRccTerminal(robot.robot);
        }
    });
}
exports.createRccTerminalTreeSelection = createRccTerminalTreeSelection;
function runSelectedRobot(noDebug) {
    let element = viewsCommon_1.getSelectedRobot("Unable to make launch (Robot task not selected in Robots Tree).", "Unable to make launch -- only 1 task must be selected.");
    activities_1.runRobotRCC(noDebug, element.robot.filePath, element.taskName);
}
exports.runSelectedRobot = runSelectedRobot;
function registerViews(context) {
    let cloudTreeDataProvider = new CloudTreeDataProvider();
    let cloudTree = vscode.window.createTreeView(robocorpViews_1.TREE_VIEW_ROBOCORP_CLOUD_TREE, { 'treeDataProvider': cloudTreeDataProvider });
    viewsCommon_1.treeViewIdToTreeView.set(robocorpViews_1.TREE_VIEW_ROBOCORP_CLOUD_TREE, cloudTree);
    viewsCommon_1.treeViewIdToTreeDataProvider.set(robocorpViews_1.TREE_VIEW_ROBOCORP_CLOUD_TREE, cloudTreeDataProvider);
    let treeDataProvider = new RobotsTreeDataProvider();
    let robotsTree = vscode.window.createTreeView(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOTS_TREE, { 'treeDataProvider': treeDataProvider });
    viewsCommon_1.treeViewIdToTreeView.set(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOTS_TREE, robotsTree);
    viewsCommon_1.treeViewIdToTreeDataProvider.set(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOTS_TREE, treeDataProvider);
    let robotContentTreeDataProvider = new viewsRobotContent_1.RobotContentTreeDataProvider();
    let robotContentTree = vscode.window.createTreeView(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOT_CONTENT_TREE, { 'treeDataProvider': robotContentTreeDataProvider });
    viewsCommon_1.treeViewIdToTreeView.set(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOT_CONTENT_TREE, robotContentTree);
    viewsCommon_1.treeViewIdToTreeDataProvider.set(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOT_CONTENT_TREE, robotContentTreeDataProvider);
    context.subscriptions.push(robotsTree.onDidChangeSelection(e => robotContentTreeDataProvider.onRobotsTreeSelectionChanged()));
    context.subscriptions.push(robotContentTree.onDidChangeSelection(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield robotContentTreeDataProvider.onRobotContentTreeTreeSelectionChanged(robotContentTree);
        });
    }));
    context.subscriptions.push(robotsTree.onDidChangeSelection(e => {
        let events = e.selection;
        if (!events || events.length == 0 || events.length > 1) {
            vscode.commands.executeCommand('setContext', 'robocorp-code:single-task-selected', false);
            vscode.commands.executeCommand('setContext', 'robocorp-code:single-robot-selected', false);
            return;
        }
        let robotEntry = events[0];
        vscode.commands.executeCommand('setContext', 'robocorp-code:single-task-selected', robotEntry.type == viewsCommon_1.RobotEntryType.Task);
        vscode.commands.executeCommand('setContext', 'robocorp-code:single-robot-selected', true);
    }));
    let locatorsDataProvider = new LocatorsTreeDataProvider();
    let locatorsTree = vscode.window.createTreeView(robocorpViews_1.TREE_VIEW_ROBOCORP_LOCATORS_TREE, { 'treeDataProvider': locatorsDataProvider });
    viewsCommon_1.treeViewIdToTreeView.set(robocorpViews_1.TREE_VIEW_ROBOCORP_LOCATORS_TREE, locatorsTree);
    viewsCommon_1.treeViewIdToTreeDataProvider.set(robocorpViews_1.TREE_VIEW_ROBOCORP_LOCATORS_TREE, locatorsDataProvider);
    context.subscriptions.push(robotsTree.onDidChangeSelection(e => locatorsDataProvider.onRobotsTreeSelectionChanged()));
    let robotsWatcher = vscode.workspace.createFileSystemWatcher("**/robot.yaml");
    let onChangeRobotsYaml = viewsCommon_1.debounce(() => {
        // Note: this doesn't currently work if the parent folder is renamed or removed.
        // (https://github.com/microsoft/vscode/pull/110858)
        refreshTreeView(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOTS_TREE);
    }, 300);
    robotsWatcher.onDidChange(onChangeRobotsYaml);
    robotsWatcher.onDidCreate(onChangeRobotsYaml);
    robotsWatcher.onDidDelete(onChangeRobotsYaml);
    let locatorsWatcher = vscode.workspace.createFileSystemWatcher("**/locators.json");
    let onChangeLocatorsJson = viewsCommon_1.debounce(() => {
        // Note: this doesn't currently work if the parent folder is renamed or removed.
        // (https://github.com/microsoft/vscode/pull/110858)
        refreshTreeView(robocorpViews_1.TREE_VIEW_ROBOCORP_LOCATORS_TREE);
    }, 300);
    locatorsWatcher.onDidChange(onChangeLocatorsJson);
    locatorsWatcher.onDidCreate(onChangeLocatorsJson);
    locatorsWatcher.onDidDelete(onChangeLocatorsJson);
    context.subscriptions.push(robotsTree);
    context.subscriptions.push(locatorsTree);
    context.subscriptions.push(robotsWatcher);
    context.subscriptions.push(locatorsWatcher);
}
exports.registerViews = registerViews;
//# sourceMappingURL=views.js.map