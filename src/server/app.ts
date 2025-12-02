import express from 'express';
import cors from 'cors';
import * as vscode from 'vscode';

let server: any;

export function startServer(onTrace: (data: any, eventType: string) => void) {
    const app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(cors());

    // --- HANDLERS ---
    const batchHandler = (req: any, res: any) => {
        const body = req.body;
        if (body.post && Array.isArray(body.post)) body.post.forEach((r: any) => onTrace(r, 'start'));
        if (body.patch && Array.isArray(body.patch)) body.patch.forEach((r: any) => onTrace(r, 'end'));
        res.status(200).json({});
    };

    const createRunHandler = (req: any, res: any) => {
        onTrace(req.body, 'start');
        res.status(200).json({ id: req.body.id, created_at: new Date().toISOString() });
    };

    const updateRunHandler = (req: any, res: any) => {
        const fullUpdate = { ...req.body, id: req.params.runId };
        onTrace(fullUpdate, 'end');
        res.status(200).json({ id: req.params.runId, updated_at: new Date().toISOString() });
    };

    // --- ROUTES ---
    app.get('/info', (req, res) => res.status(200).json({ version: "0.5.0", license_type: "open_source" }));
    app.post('/runs/batch', batchHandler); app.post('/api/v1/runs/batch', batchHandler);
    app.post('/runs', createRunHandler); app.post('/api/v1/runs', createRunHandler);
    app.patch('/runs/:runId', updateRunHandler); app.patch('/api/v1/runs/:runId', updateRunHandler);

    server = app.listen(1984, () => {
        console.log('🕵️ FlowSight UI listening on port 1984');
        vscode.window.showInformationMessage('FlowSight UI Ready (Port 1984)');
    });
}

export function stopServer() {
    if (server) {
        server.close();
        server = undefined;
    }
}
