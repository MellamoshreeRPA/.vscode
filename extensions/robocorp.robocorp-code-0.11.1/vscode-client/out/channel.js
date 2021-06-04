"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTPUT_CHANNEL = exports.OUTPUT_CHANNEL_NAME = void 0;
const vscode_1 = require("vscode");
exports.OUTPUT_CHANNEL_NAME = "Robocorp Code";
exports.OUTPUT_CHANNEL = vscode_1.window.createOutputChannel(exports.OUTPUT_CHANNEL_NAME);
//# sourceMappingURL=channel.js.map