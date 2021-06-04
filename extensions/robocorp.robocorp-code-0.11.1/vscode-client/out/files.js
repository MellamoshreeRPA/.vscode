'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFileExists = exports.getExtensionRelativeFile = void 0;
const path = require("path");
const fs = require("fs");
const vscode_1 = require("vscode");
const channel_1 = require("./channel");
/**
 * @param mustExist if true, if the returned file does NOT exist, returns undefined.
 */
function getExtensionRelativeFile(relativeLocation, mustExist = true) {
    let targetFile = path.resolve(__dirname, relativeLocation);
    if (mustExist) {
        if (!verifyFileExists(targetFile)) {
            return undefined;
        }
    }
    return targetFile;
}
exports.getExtensionRelativeFile = getExtensionRelativeFile;
function verifyFileExists(targetFile) {
    if (!fs.existsSync(targetFile)) {
        let msg = 'Error. Expected: ' + targetFile + " to exist.";
        vscode_1.window.showWarningMessage(msg);
        channel_1.OUTPUT_CHANNEL.appendLine(msg);
        return false;
    }
    return true;
}
exports.verifyFileExists = verifyFileExists;
//# sourceMappingURL=files.js.map