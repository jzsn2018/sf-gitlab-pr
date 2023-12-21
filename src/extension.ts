import * as vscode from "vscode";
import { PrConfigWebViewProvider } from "./PrConfigWebViewProvider";

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "sf-gitlab-pr" is now active!');

	const sidebarPanel = new PrConfigWebViewProvider(context.extensionUri);
	console.log('sidebarPanel', sidebarPanel);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("sf-gitlab-pr", sidebarPanel),
	);
}

export function deactivate() { }
