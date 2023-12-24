import { Uri, Webview } from "vscode";
import * as vscode from "vscode";
import { MRParams, ProgressPromise } from "../type";
import { File } from "buffer";

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

export function base64toBlob(base64String: string, contentType: string) {
    const byteCharacters = atob(base64String.replace(/^data:image\/\w+;base64,/, ""));
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    return blob;
}
export function blobToFile(blob: Blob, fileName: string) {
    const file = new File([blob], fileName, { type: blob.type });
    return file;
}

export function validateForm(data: MRParams) {
    const obj = {
        title: 'PR 标题不能为空',
        source_branch: '源分支不能为空',
        target_branch: '目标分支不能为空',
    };
    if (!data.title) {
        return log(obj.title);
    }
    if (!data.source_branch) {
        return log(obj.source_branch);
    }
    if (!data.target_branch) {
        return log(obj.target_branch);
    }
    return true;
}

export const info = (msg: string, ...items: string[]) => {
    return vscode.window.showInformationMessage(msg, ...items);
};