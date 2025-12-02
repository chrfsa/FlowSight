import * as vscode from 'vscode';
import { startServer, stopServer } from './server/app';
import { getWebviewContent } from './webview/content';

let currentPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    // Start the server and handle incoming traces
    startServer((data, eventType) => {
        if (currentPanel) {
            currentPanel.webview.postMessage({ type: 'TRACE', data: data, event: eventType });
        }
    });

    context.subscriptions.push(vscode.commands.registerCommand('flowsight.open', () => {
        currentPanel = vscode.window.createWebviewPanel(
            'flowsight',
            'FlowSight Monitor',
            vscode.ViewColumn.Two,
            { enableScripts: true, retainContextWhenHidden: true }
        );
        currentPanel.webview.html = getWebviewContent();
        currentPanel.onDidDispose(() => { currentPanel = undefined; }, null, context.subscriptions);
    }));
}

export function deactivate() {
    stopServer();
}