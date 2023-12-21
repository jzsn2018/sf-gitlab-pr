import * as vscode from 'vscode';
import { getNonce, getUri } from './utils';

export class PrConfigWebViewProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;

    constructor(private readonly _extensionUri: vscode.Uri) { }
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        console.log('PrConfigWebViewProvider', webviewView);
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        console.log(' this._extensionUri', this._extensionUri);

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "detail":
                    vscode.window.showErrorMessage(data.value);
                    break;

                default:
                    break;
            }
        });

    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const stylesUri = getUri(webview, this._extensionUri, ["webview-ui", "build", "assets", "index.css"]);
        const scriptUri = getUri(webview, this._extensionUri, ["webview-ui", "build", "assets", "index.js"]);
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${stylesUri}" rel="stylesheet">
                    </head>
                  <body>
                      <div id="app"></div>
                      <script nonce="${nonce}" src="${scriptUri}"></script>
                  </body>
        </html>`;
    }
}