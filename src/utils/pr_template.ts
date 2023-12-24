/**
 * @file pr_template.ts
 */

import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

export const getProjectPath = () => {
    // 获取当前项目的根路径
    const rootPath = vscode.workspace.workspaceFolders;
    if (!rootPath?.length) {
        vscode.window.showErrorMessage('当前没有打开项目');
    } else if (rootPath.length > 1) {
        vscode.window.showErrorMessage('插件暂时只支持在一个项目上下文中进行使用');
    }

    return rootPath;
};

export const getMergeRequestTemplates = () => {
    const merge_request_templates = [] as Record<string, string>[];

    // 获取当前项目的根路径
    const rootPath = vscode.workspace.workspaceFolders;
    if (!rootPath?.length) {
        vscode.window.showErrorMessage('当前没有打开项目');
    } else if (rootPath.length > 1) {
        vscode.window.showErrorMessage('插件暂时只支持在一个项目上下文中进行使用');
    }

    const root = rootPath?.[0].uri.fsPath;
    if (!root) {
        return;
    }

    // 构建 .gitlab/merge_request_templates 文件夹的绝对路径
    const templatesFolderPath = path.join(root, '.gitlab', 'merge_request_templates');

    // 读取 .md 文件的内容
    try {
        const files = fs.readdirSync(templatesFolderPath);
        files.forEach(async (file) => {
            if (file.endsWith('.md')) {
                const filePath = path.join(templatesFolderPath, file);
                try {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const templateKey = file.replace('.md', '');
                    merge_request_templates.push({
                        fileName: templateKey,
                        data
                    });
                } catch (err) {
                    console.error(`Error reading file: ${filePath}`, err);
                }
            }
        });
    } catch (err) {
        vscode.window.showErrorMessage(`Error reading templates folder: ${templatesFolderPath}`);
        console.error(`Error reading templates folder: ${templatesFolderPath}`, err);
    }

    return merge_request_templates;
}