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
exports.createRccTerminal = exports.askAndCreateRccTerminal = void 0;
const vscode_1 = require("vscode");
const channel_1 = require("./channel");
const rcc_1 = require("./rcc");
const roboConfig = require("./robocorpSettings");
const pathModule = require("path");
const subprocess_1 = require("./subprocess");
const activities_1 = require("./activities");
function askAndCreateRccTerminal() {
    return __awaiter(this, void 0, void 0, function* () {
        let robot = yield activities_1.listAndAskRobotSelection('Please select the target Robot for the terminal.', 'Unable to create terminal (no Robot detected in the Workspace).');
        if (robot) {
            yield createRccTerminal(robot);
        }
    });
}
exports.askAndCreateRccTerminal = askAndCreateRccTerminal;
function createRccTerminal(robotInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const rccLocation = yield rcc_1.getRccLocation();
        if (!rccLocation) {
            vscode_1.window.showErrorMessage('Unable to find RCC to create terminal.');
            return;
        }
        let robocorpHome = roboConfig.getHome();
        let env = Object.assign({}, process.env);
        if (robocorpHome) {
            env['ROBOCORP_HOME'] = robocorpHome;
        }
        if (robotInfo) {
            function startShell(progress) {
                return __awaiter(this, void 0, void 0, function* () {
                    let execFileReturn = yield subprocess_1.execFilePromise(rccLocation, ['env', 'variables', '-j', '-r', robotInfo.filePath, '--controller', 'RobocorpCode'], { env: env });
                    if (execFileReturn.stdout) {
                        let envArray = JSON.parse(execFileReturn.stdout);
                        for (let index = 0; index < envArray.length; index++) {
                            const element = envArray[index];
                            let key = element['key'];
                            let isPath = false;
                            if (process.platform == 'win32') {
                                if (key.toLowerCase() == 'path') {
                                    isPath = true;
                                }
                            }
                            else {
                                if (key == 'PATH') {
                                    isPath = true;
                                }
                            }
                            if (isPath) {
                                env[key] = pathModule.dirname(rccLocation) + pathModule.delimiter + element['value'];
                            }
                            else {
                                env[key] = element['value'];
                            }
                        }
                        if (robocorpHome) {
                            env['ROBOCORP_HOME'] = robocorpHome;
                        }
                        channel_1.OUTPUT_CHANNEL.appendLine('Create terminal with RCC:' + rccLocation + ' for Robot: ' + robotInfo.name);
                        const terminal = vscode_1.window.createTerminal({
                            name: robotInfo.name + ' Robot environment',
                            env: env,
                            cwd: pathModule.dirname(robotInfo.filePath),
                        });
                        terminal.show();
                    }
                    return undefined;
                });
            }
            yield vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                title: 'Robocorp: start RCC shell for: ' + robotInfo.name + ' Robot',
                cancellable: false
            }, startShell);
        }
    });
}
exports.createRccTerminal = createRccTerminal;
//# sourceMappingURL=rccTerminal.js.map