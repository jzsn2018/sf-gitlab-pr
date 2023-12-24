import * as vscode from "vscode";
import { base64toBlob, blobToFile, getNonce, getUri, info, log, validateForm, withProgress } from "./utils";
import { getMergeRequestTemplates } from "./utils/pr_template";
import GitExtensionWrap from "./utils/git_helper";
import Api from "./api/gitlab";
import { ExtensionConfig, GitlabBranch } from "./type";
import axios from "axios";

let n = 0;
export class PrConfigWebViewProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    git?: GitExtensionWrap;
    api?: Api;
    gitUrl?: string;
    repoPath?: string;

    config: ExtensionConfig = {};

    constructor(private readonly _extensionUri: vscode.Uri,) { }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.type) {
                case "init":
                    this.init(msg.data);
                    break;
                case "searchUsers":
                    this.getUsers(msg.data);
                    break;
                case "uploadImage":
                    this.uploadImage(msg.data);
                    break;
                case "submitMr":
                    this.submitMR(msg.data);
                    break;
                default:
                    break;
            }
        });

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private async init(repoPath?: string) {
        this.getConfig();

        if (!this.config.token) {
            log('请在vscode设置中，配置你的内网gitlab的个人 access_token');
        }

        this.repoPath = repoPath || this.repoPath || '';

        const { res: promiseRes } = await withProgress('正在初始化内网提交PR插件...');

        const mergeRequestTemplates = getMergeRequestTemplates();
        this.postMsg("mergeRequestTemplates", mergeRequestTemplates);

        const fn = async () => {
            try {
                this.git = new GitExtensionWrap();
                await this.git.init(this.repoPath || '', (paths) => {
                    this.postMsg('updateRepoTab', paths);
                });
                await this.setupRepo();
            } catch (err) {
            }
            if (n < 10 && !this.api?.id) {
                n++;
                await new Promise(res => setTimeout(res, 1000));
                await fn();
            }
        };
        await fn();

        promiseRes();
    }

    async setupRepo(path?: string) {
        if (!this.git) {
            return;
        }

        if (path) {
            this.git.repoPath = path;
        }

        const { branches: localRepoBranches, currentBranchName, projectName, url } = await this.git.getInfo();
        this.gitUrl = url;
        this.postMsg('currentBranch', currentBranchName);
        this.api = new Api(this.config);
        await this.api.getProject(projectName, url);

        if (this.api?.project) {
            this.postMsg('web_url', this.api.project.web_url);
        }

        if (this.api.id) {
            const repositoryBranchesRes = await this.api.getBranches();
            this.getBranches(localRepoBranches, repositoryBranchesRes);
            await this.getUsers();
        } else {
            log('Failed to fetch repository info!');
        }
    }

    async uploadImage(file: any) {
        if (!file) {
            return;
        }

        const { res: promiseRes } = await withProgress('正在上传图片中...');

        const fileBlob = base64toBlob(file.file, file.type);
        const fileNew = blobToFile(fileBlob, file.name);
        const formData = new FormData();
        formData.append('file', fileNew);
        this.api?.uploadImage(formData).then(res => {
            if (this?.api?.project) {
                this.postMsg('imageUploadedRes', {
                    ...res.data,
                });

                promiseRes();
            }
        })
    }
    getUsers(name?: string) {
        this.api?.getUsers(name).then(res => {
            this.postMsg('users', res.data);
        });
    }
    getBranches(branches: any[], repositoryBranchesRes: axios.AxiosResponse<GitlabBranch[], any>) {
        const data = branches.filter(v => v.type === 0 && !v.name.includes('HEAD')).map(v => {
            v.name = v.name.replace('origin/', '');
            return v;
        });

        this.postMsg('branches', {
            local: data,
            remote: repositoryBranchesRes?.data || [],
        });
    }

    getConfig() {
        const { host: instanceUrl, AccessToken: token } = vscode.workspace.getConfiguration('深信服内网PR提交插件');
        this.config = { instanceUrl, token };
    }

    private async submitMR(data: any) {
        // 表单校验
        const result = validateForm(data);
        if (result !== true) {
            return;
        };

        const { res: promiseRes } = await withProgress('正在提交PR...');
        const res = await this.api?.submitMR(data).catch(promiseRes);
        promiseRes();
        if (res) {
            info('PR创建成功', '跳转查看PR', '复制PR链接地址').then((item) => {
                if (item === '跳转查看PR' && res.data.web_url) {
                    const url = res.data.web_url.replace(/^http(s)?:\/\/[^\/]+/, this.config.instanceUrl || '');
                    vscode.env.openExternal(vscode.Uri.parse(url));
                }
                if (item === '复制PR链接地址' && res.data.web_url) {
                    const url = res.data.web_url.replace(/^http(s)?:\/\/[^\/]+/, this.config.instanceUrl || '');
                    vscode.env.clipboard.writeText(url);
                }
            });
        }
    }
    private initStatusBar() {
        // TODO 
        // const sfPrBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        // sfPrBtn.command = 'sf-pr-quick';
        // sfPrBtn.text = `$(zap)PR提交`;
        // sfPrBtn.tooltip = "快速提交PR";
        // sfPrBtn.show();
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private postMsg(type: string, data: any) {
        this._view?.webview.postMessage({ type, data });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const stylesUri = getUri(webview, this._extensionUri, [
            "webview-ui",
            "build",
            "assets",
            "index.css",
        ]);
        const scriptUri = getUri(webview, this._extensionUri, [
            "webview-ui",
            "build",
            "assets",
            "index.js",
        ]);
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