import { Uri, Webview } from "vscode";
import * as vscode from "vscode";
import { ProgressPromise } from "../type";

//  生成特定随机数
export function getNonce() {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


/**
 * A helper function which will get the webview URI of a given file or resource.
 *
 * @remarks This URI can be used within a webview's HTML as a link to the
 * given file/resource.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param pathList An array of strings representing the path to a file/resource
 * @returns A URI pointing to the file/resource
 */
export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

export const log = (msg: string, ...items: string[]) => {
    return vscode.window.showErrorMessage(msg, ...items);
};

export function withProgress(title: string) {
    return new Promise<ProgressPromise>(res => {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            cancellable: false,
            title
        }, progress => {
            return new Promise<void>(r => {
                res({
                    progress,
                    res: r
                });
            });
        });
    });
}

export function handleResError(data: any) {
    if (!data) {
        return log('Failed to create MR!');
    }
    if (data.error) {
        return log(Array.isArray(data.error) ? data.error.join(', ') : data.error);
    }
    if (Array.isArray(data.message)) {
        return log(data.message.join('\n'));
    }
    if (Object.prototype.toString.call(data.message) === '[object Object]') {
        let str = '';
        for (let k in data.message) {
            const v = data.message[k];
            if (v.length) {
                str += `${k} ${v.join(', ')}`;
            }
        }
        return log(str);
    }
    return log(JSON.stringify(data));
}