import * as vscode from 'vscode';

export class NewprWebViewProvider implements vscode.WebviewViewProvider{
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }

}