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
exports.showSelectOneStrQuickPick = exports.showSelectOneQuickPick = exports.sortCaptions = void 0;
const vscode_1 = require("vscode");
function sortCaptions(captions) {
    captions.sort(function (a, b) {
        if (a.sortKey < b.sortKey) {
            return -1;
        }
        if (a.sortKey > b.sortKey) {
            return 1;
        }
        if (a.label < b.label) {
            return -1;
        }
        if (a.label > b.label) {
            return 1;
        }
        return 0;
    });
}
exports.sortCaptions = sortCaptions;
function showSelectOneQuickPick(items, message) {
    return __awaiter(this, void 0, void 0, function* () {
        let selectedItem = yield vscode_1.window.showQuickPick(items, {
            "canPickMany": false,
            'placeHolder': message,
            'ignoreFocusOut': true,
        });
        return selectedItem;
    });
}
exports.showSelectOneQuickPick = showSelectOneQuickPick;
function showSelectOneStrQuickPick(items, message) {
    return __awaiter(this, void 0, void 0, function* () {
        let selectedItem = yield vscode_1.window.showQuickPick(items, {
            "canPickMany": false,
            'placeHolder': message,
            'ignoreFocusOut': true,
        });
        return selectedItem;
    });
}
exports.showSelectOneStrQuickPick = showSelectOneStrQuickPick;
//# sourceMappingURL=ask.js.map