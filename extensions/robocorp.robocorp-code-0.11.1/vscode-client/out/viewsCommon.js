"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = exports.basename = exports.getSelectedLocator = exports.getSelectedRobot = exports.getSingleTreeSelection = exports.treeViewIdToTreeDataProvider = exports.treeViewIdToTreeView = exports.RobotEntryType = void 0;
const vscode = require("vscode");
const robocorpViews_1 = require("./robocorpViews");
var RobotEntryType;
(function (RobotEntryType) {
    RobotEntryType[RobotEntryType["Robot"] = 0] = "Robot";
    RobotEntryType[RobotEntryType["Task"] = 1] = "Task";
})(RobotEntryType = exports.RobotEntryType || (exports.RobotEntryType = {}));
exports.treeViewIdToTreeView = new Map();
exports.treeViewIdToTreeDataProvider = new Map();
function getSingleTreeSelection(treeId, noSelectionMessage, moreThanOneSelectionMessage) {
    const robotsTree = exports.treeViewIdToTreeView.get(treeId);
    if (!robotsTree || robotsTree.selection.length == 0) {
        if (noSelectionMessage) {
            vscode.window.showWarningMessage(noSelectionMessage);
        }
        return undefined;
    }
    if (robotsTree.selection.length > 1) {
        if (moreThanOneSelectionMessage) {
            vscode.window.showWarningMessage(moreThanOneSelectionMessage);
        }
        return undefined;
    }
    let element = robotsTree.selection[0];
    return element;
}
exports.getSingleTreeSelection = getSingleTreeSelection;
/**
 * Returns the selected robot or undefined if there are no robots or if more than one robot is selected.
 *
 * If the messages are passed as a parameter, a warning is shown with that message if the selection is invalid.
 */
function getSelectedRobot(noSelectionMessage, moreThanOneSelectionMessage) {
    return getSingleTreeSelection(robocorpViews_1.TREE_VIEW_ROBOCORP_ROBOTS_TREE);
}
exports.getSelectedRobot = getSelectedRobot;
function getSelectedLocator(noSelectionMessage, moreThanOneSelectionMessage) {
    return getSingleTreeSelection(robocorpViews_1.TREE_VIEW_ROBOCORP_LOCATORS_TREE);
}
exports.getSelectedLocator = getSelectedLocator;
function basename(s) {
    return s.split('\\').pop().split('/').pop();
}
exports.basename = basename;
exports.debounce = (func, wait) => {
    let timeout;
    return function wrapper(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
//# sourceMappingURL=viewsCommon.js.map