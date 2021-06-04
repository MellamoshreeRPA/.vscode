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
exports.RobotContentTreeDataProvider = exports.newFolderInRobotContentTree = exports.deleteResourceInRobotContentTree = exports.renameResourceInRobotContentTree = exports.newFileInRobotContentTree = exports.getCurrRobotTreeContentDir = void 0;
const vscode = require("vscode");
const fs = require("fs");
const channel_1 = require("./channel");
const robocorpViews_1 = require("./robocorpViews");
const viewsCommon_1 = require("./viewsCommon");
const path_1 = require("path");
const vscode_1 = require("vscode");
const vscode_2 = require("vscode");
const fsPromises = fs.promises;
function getCurrRobotTreeContentDir() {
    return __awaiter(this, void 0, void 0, function* () {
        let robotContentTree = viewsCommon_1.treeViewIdToTreeView.get(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOT_CONTENT_TREE);
        if (!robotContentTree) {
            return undefined;
        }
        let parentEntry = undefined;
        let selection = robotContentTree.selection;
        if (selection.length > 0) {
            parentEntry = selection[0];
            if (!parentEntry.filePath) {
                parentEntry = undefined;
            }
        }
        if (!parentEntry) {
            let robot = viewsCommon_1.getSelectedRobot();
            if (!robot) {
                yield vscode.window.showInformationMessage('Unable to create file in Robot (Robot not selected).');
                return undefined;
            }
            parentEntry = {
                filePath: path_1.dirname(robot.uri.fsPath),
                isDirectory: true,
                name: path_1.basename(robot.uri.fsPath)
            };
        }
        if (!parentEntry.isDirectory) {
            parentEntry = {
                filePath: path_1.dirname(parentEntry.filePath),
                isDirectory: true,
                name: path_1.basename(parentEntry.filePath)
            };
        }
        return parentEntry;
    });
}
exports.getCurrRobotTreeContentDir = getCurrRobotTreeContentDir;
function newFileInRobotContentTree() {
    return __awaiter(this, void 0, void 0, function* () {
        let currTreeDir = yield getCurrRobotTreeContentDir();
        if (!currTreeDir) {
            return;
        }
        let filename = yield vscode.window.showInputBox({
            'prompt': 'Please provide file name. Current dir: ' + currTreeDir.filePath,
            'ignoreFocusOut': true,
        });
        if (!filename) {
            return;
        }
        let targetFile = path_1.join(currTreeDir.filePath, filename);
        try {
            yield vscode.workspace.fs.writeFile(vscode_1.Uri.file(targetFile), new Uint8Array());
        }
        catch (err) {
            vscode.window.showErrorMessage('Unable to create file. Error: ' + err);
        }
    });
}
exports.newFileInRobotContentTree = newFileInRobotContentTree;
function renameResourceInRobotContentTree() {
    return __awaiter(this, void 0, void 0, function* () {
        let robotContentTree = viewsCommon_1.treeViewIdToTreeView.get(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOT_CONTENT_TREE);
        if (!robotContentTree) {
            return undefined;
        }
        let selection = robotContentTree.selection;
        if (!selection) {
            yield vscode.window.showInformationMessage("No resources selected for rename.");
            return;
        }
        if (selection.length != 1) {
            yield vscode.window.showInformationMessage("Please select a single resource for rename.");
            return;
        }
        let entry = selection[0];
        let uri = vscode_1.Uri.file(entry.filePath);
        let stat;
        try {
            stat = yield vscode.workspace.fs.stat(uri);
        }
        catch (err) {
            // unable to get stat (file may have been removed in the meanwhile).
            yield vscode.window.showErrorMessage("Unable to stat resource during rename.");
        }
        if (stat) {
            try {
                let newName = yield vscode.window.showInputBox({
                    'prompt': 'Please provide new name for: ' + path_1.basename(entry.filePath) + ' (at: ' + path_1.dirname(entry.filePath) + ')',
                    'ignoreFocusOut': true,
                });
                if (!newName) {
                    return;
                }
                let target = vscode_1.Uri.file(path_1.join(path_1.dirname(entry.filePath), newName));
                yield vscode.workspace.fs.rename(uri, target, { overwrite: false });
            }
            catch (err) {
                let msg = yield vscode.window.showErrorMessage("Error renaming resource: " + entry.filePath);
            }
        }
    });
}
exports.renameResourceInRobotContentTree = renameResourceInRobotContentTree;
function deleteResourceInRobotContentTree() {
    return __awaiter(this, void 0, void 0, function* () {
        let robotContentTree = viewsCommon_1.treeViewIdToTreeView.get(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOT_CONTENT_TREE);
        if (!robotContentTree) {
            return undefined;
        }
        let selection = robotContentTree.selection;
        if (!selection) {
            yield vscode.window.showInformationMessage("No resources selected for deletion.");
            return;
        }
        for (const entry of selection) {
            let uri = vscode_1.Uri.file(entry.filePath);
            let stat;
            try {
                stat = yield vscode.workspace.fs.stat(uri);
            }
            catch (err) {
                // unable to get stat (file may have been removed in the meanwhile).
            }
            if (stat) {
                try {
                    yield vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true });
                }
                catch (err) {
                    let msg = yield vscode.window.showErrorMessage("Unable to move to trash: " + entry.filePath + ". How to proceed?", "Delete permanently", "Cancel");
                    if (msg == "Delete permanently") {
                        yield vscode.workspace.fs.delete(uri, { recursive: true, useTrash: false });
                    }
                    else {
                        return;
                    }
                }
            }
        }
    });
}
exports.deleteResourceInRobotContentTree = deleteResourceInRobotContentTree;
function newFolderInRobotContentTree() {
    return __awaiter(this, void 0, void 0, function* () {
        let currTreeDir = yield getCurrRobotTreeContentDir();
        if (!currTreeDir) {
            return;
        }
        let directoryName = yield vscode.window.showInputBox({
            'prompt': 'Please provide dir name. Current dir: ' + currTreeDir.filePath,
            'ignoreFocusOut': true,
        });
        if (!directoryName) {
            return;
        }
        let targetFile = path_1.join(currTreeDir.filePath, directoryName);
        try {
            yield vscode.workspace.fs.createDirectory(vscode_1.Uri.file(targetFile));
        }
        catch (err) {
            vscode.window.showErrorMessage('Unable to create directory. Error: ' + err);
        }
    });
}
exports.newFolderInRobotContentTree = newFolderInRobotContentTree;
class RobotContentTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.lastRobotEntry = undefined;
        this.lastWatcher = undefined;
    }
    fireRootChange() {
        this._onDidChangeTreeData.fire(null);
    }
    robotSelectionChanged(robotEntry) {
        // When the robot selection changes, we need to start tracking file-changes at the proper place.
        if (this.lastWatcher) {
            this.lastWatcher.dispose();
            this.lastWatcher = undefined;
        }
        this.fireRootChange();
        let d = path_1.basename(path_1.dirname(robotEntry.uri.fsPath));
        let watcher = vscode.workspace.createFileSystemWatcher('**/' + d + '/**', false, true, false);
        this.lastWatcher = watcher;
        let onChangedSomething = viewsCommon_1.debounce(() => {
            // Note: this doesn't currently work if the parent folder is renamed or removed.
            // (https://github.com/microsoft/vscode/pull/110858)
            this.fireRootChange();
        }, 100);
        watcher.onDidCreate(onChangedSomething);
        watcher.onDidDelete(onChangedSomething);
    }
    onRobotsTreeSelectionChanged() {
        let robotEntry = viewsCommon_1.getSelectedRobot();
        if (!this.lastRobotEntry && !robotEntry) {
            // nothing changed
            return;
        }
        if (!this.lastRobotEntry && robotEntry) {
            // i.e.: we didn't have a selection previously: refresh.
            this.robotSelectionChanged(robotEntry);
            return;
        }
        if (!robotEntry && this.lastRobotEntry) {
            this.robotSelectionChanged(robotEntry);
            return;
        }
        if (robotEntry.robot.filePath != this.lastRobotEntry.robot.filePath) {
            // i.e.: the selection changed: refresh.
            this.robotSelectionChanged(robotEntry);
            return;
        }
    }
    onRobotContentTreeTreeSelectionChanged(robotContentTree) {
        return __awaiter(this, void 0, void 0, function* () {
            let selection = robotContentTree.selection;
            if (selection.length == 1) {
                let entry = selection[0];
                if (entry.filePath && !entry.isDirectory) {
                    let uri = vscode_1.Uri.file(entry.filePath);
                    let document = yield vscode.workspace.openTextDocument(uri);
                    if (document) {
                        yield vscode.window.showTextDocument(document);
                    }
                }
            }
        });
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            if (!element) {
                // i.e.: the contents of this tree depend on what's selected in the robots tree.
                const robotsTree = viewsCommon_1.treeViewIdToTreeView.get(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOTS_TREE);
                if (!robotsTree || robotsTree.selection.length == 0) {
                    this.lastRobotEntry = undefined;
                    return [{
                            name: "<Waiting for Robot Selection...>",
                            isDirectory: false,
                            filePath: undefined,
                        }];
                }
                let robotEntry = robotsTree.selection[0];
                this.lastRobotEntry = robotEntry;
                let robotUri = robotEntry.uri;
                try {
                    let robotDir = path_1.dirname(robotUri.fsPath);
                    let dirContents = yield fsPromises.readdir(robotDir, { withFileTypes: true });
                    for (const dirContent of dirContents) {
                        ret.push({
                            name: dirContent.name,
                            isDirectory: dirContent.isDirectory(),
                            filePath: path_1.join(robotDir, dirContent.name),
                        });
                    }
                }
                catch (err) {
                    channel_1.OUTPUT_CHANNEL.appendLine('Error listing dir contents: ' + robotUri);
                }
                return ret;
            }
            else {
                // We have a parent...
                if (!element.isDirectory) {
                    return ret;
                }
                try {
                    let dirContents = yield fsPromises.readdir(element.filePath, { withFileTypes: true });
                    for (const dirContent of dirContents) {
                        ret.push({
                            name: dirContent.name,
                            isDirectory: dirContent.isDirectory(),
                            filePath: path_1.join(element.filePath, dirContent.name),
                        });
                    }
                }
                catch (err) {
                    channel_1.OUTPUT_CHANNEL.appendLine('Error listing dir contents: ' + element.filePath);
                }
                return ret;
            }
        });
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.name);
        if (element.isDirectory) {
            treeItem.collapsibleState = vscode_2.TreeItemCollapsibleState.Collapsed;
        }
        else {
            treeItem.collapsibleState = vscode_2.TreeItemCollapsibleState.None;
        }
        if (element.filePath === undefined) {
            // https://microsoft.github.io/vscode-codicons/dist/codicon.html
            treeItem.iconPath = new vscode.ThemeIcon("error");
        }
        else if (element.isDirectory) {
            treeItem.iconPath = vscode.ThemeIcon.Folder;
            treeItem.resourceUri = vscode_1.Uri.file(element.filePath);
        }
        else {
            treeItem.iconPath = vscode.ThemeIcon.File;
            treeItem.resourceUri = vscode_1.Uri.file(element.filePath);
        }
        return treeItem;
    }
}
exports.RobotContentTreeDataProvider = RobotContentTreeDataProvider;
//# sourceMappingURL=viewsRobotContent.js.map