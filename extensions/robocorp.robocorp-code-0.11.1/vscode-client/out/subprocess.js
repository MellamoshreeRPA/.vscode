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
exports.execFilePromise = void 0;
const channel_1 = require("./channel");
const child_process_1 = require("child_process");
;
;
function _execFileAsPromise(command, args, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            child_process_1.execFile(command, args, options, (error, stdout, stderr) => {
                if (error) {
                    reject({ error: 'error', 'stdout': stdout, 'stderr': stderr });
                    return;
                }
                resolve({ 'stdout': stdout, 'stderr': stderr });
            });
        });
    });
}
/**
 * @param options may be something as: { env: { ...process.env, ENV_VAR: 'test' } }
 */
function execFilePromise(command, args, options) {
    return __awaiter(this, void 0, void 0, function* () {
        channel_1.OUTPUT_CHANNEL.appendLine('Executing: ' + command + ',' + args);
        try {
            return yield _execFileAsPromise(command, args, options);
        }
        catch (exc) {
            let errorInfo = exc;
            let error = errorInfo.error;
            channel_1.OUTPUT_CHANNEL.appendLine('Error executing: ' + command + ',' + args);
            channel_1.OUTPUT_CHANNEL.appendLine('Error code: ' + error.code);
            channel_1.OUTPUT_CHANNEL.appendLine('Error: ' + error);
            if (error.name) {
                channel_1.OUTPUT_CHANNEL.appendLine('Error name: ' + error.name);
            }
            if (errorInfo.stderr) {
                channel_1.OUTPUT_CHANNEL.appendLine('Stderr: ' + errorInfo.stderr);
            }
            if (errorInfo.stdout) {
                channel_1.OUTPUT_CHANNEL.appendLine('Stdout: ' + errorInfo.stdout);
            }
            throw exc;
        }
    });
}
exports.execFilePromise = execFilePromise;
//# sourceMappingURL=subprocess.js.map