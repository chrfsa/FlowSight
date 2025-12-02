export function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
    <style>
        :root {
            /* Palette Dark Pro inspirée de LangSmith / VS Code */
            --bg-app: #0d1117;
            --bg-panel: #161b22;
            --bg-hover: #21262d;
            --bg-active: rgba(56, 139, 253, 0.15);
            --border: #30363d;
            --text-main: #e6edf3;
            --text-muted: #8b949e;
            --accent: #58a6ff;
            --success: #238636;
            --error: #da3633;
            --warning: #d29922;
            --font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }

        * { box-sizing: border-box; }
        body { 
            font-family: var(--font-ui); 
            background-color: var(--bg-app); 
            color: var(--text-main); 
            margin: 0; padding: 0; height: 100vh; overflow: hidden; font-size: 13px;
        }

        /* MERMAID GRAPH STYLING */
        .mermaid { font-family: var(--font-ui) !important; }
        .mermaid .node rect,
        .mermaid .node circle,
        .mermaid .node ellipse,
        .mermaid .node polygon { 
            fill: var(--bg-hover) !important; 
            stroke: var(--accent) !important; 
            stroke-width: 2px !important;
        }
        .mermaid .nodeLabel,
        .mermaid .node .label {
            color: #ffffff !important;
            fill: #ffffff !important;
            font-size: 20px !important;
            font-weight: 700 !important;
            text-shadow: 0 0 4px rgba(0,0,0,0.8) !important;
        }
        .mermaid .edgeLabel {
            background-color: var(--bg-panel) !important;
            color: var(--accent) !important;
            fill: var(--accent) !important;
            font-size: 16px !important;
            font-weight: 600 !important;
        }
        .mermaid .edgePath .path {
            stroke: var(--accent) !important;
            stroke-width: 2px !important;
            opacity: 0.7;
        }

        /* --- LAYOUT DYNAMIQUE (CSS GRID) --- */
        #app-container {
            display: grid;
            height: 100vh;
            width: 100vw;
            /* État 1 : Accueil (Que l'historique) */
            grid-template-columns: 100% 0fr 0fr; 
            transition: grid-template-columns 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* État 2 : Trace Ouverte (Sidebar réduite + Trace Large) */
        #app-container.mode-trace {
            grid-template-columns: 280px 1fr 0fr;
        }

        /* État 3 : Inspection (Sidebar Mini + Trace Moyenne + Inspecteur Large) */
        #app-container.mode-inspect {
            grid-template-columns: 240px 300px 1fr;
        }

        /* --- PANNEAUX COMMUNS --- */
        .panel { 
            display: flex; flex-direction: column; 
            border-right: 1px solid var(--border);
            background: var(--bg-panel);
            overflow: hidden;
            min-width: 0; /* Important pour l'animation */
        }
        #sidebar { background: #0d1117; } /* Plus sombre */
        #inspector { background: var(--bg-app); }

        .panel-header {
            height: 48px; padding: 0 16px; 
            border-bottom: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
            font-weight: 600; font-size: 11px; 
            text-transform: uppercase; letter-spacing: 0.5px;
            color: var(--text-muted); background: var(--bg-panel);
            flex-shrink: 0; white-space: nowrap;
        }

        .scroll-area { flex: 1; overflow-y: auto; overflow-x: hidden; }

        /* --- 1. RUNS HISTORY (GAUCHE) --- */
        .run-item { 
            padding: 14px 16px; 
            border-bottom: 1px solid var(--border); 
            cursor: pointer; transition: all 0.2s;
            position: relative;
        }
        .run-item:hover { background: var(--bg-hover); }
        .run-item.active { background: var(--bg-active); }
        .run-item.active::before {
            content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--accent);
        }

        .run-title { font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 6px; }
        .run-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); }

        /* --- 2. TRACE WATERFALL (MILIEU) --- */
        .trace-row { 
            display: flex; align-items: center; 
            padding: 6px 12px; cursor: pointer; 
            border-bottom: 1px solid transparent; 
            transition: background 0.1s;
        }
        .trace-row:hover { background: var(--bg-hover); }
        .trace-row.selected { background: #1f6feb33; color: white; }
        
        .trace-line-guide {
            border-left: 1px solid #30363d;
            height: 100%; display: inline-block; width: 1px; margin-right: 14px;
        }
        
        .trace-time { 
            margin-left: auto; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); 
            background: rgba(255,255,255,0.05); padding: 2px 5px; border-radius: 4px;
        }

        /* --- 3. INSPECTOR (DROITE) --- */
        #inspector-container { display: flex; height: 100%; }
        #inspector-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 0; }
        /* Colonne Stats à Droite */
        #inspector-stats { 
            min-width: 260px; background: var(--bg-panel); border-left: 1px solid var(--border); 
            padding: 20px; overflow-y: auto; flex-shrink: 0;
        }

        /* Header du Node */
        .insp-header { padding: 20px; border-bottom: 1px solid var(--border); background: var(--bg-panel); }
        .insp-title { font-size: 16px; font-weight: 600; color: var(--text-main); margin-bottom: 12px; }
        
        /* Onglets */
        .tab-bar { display: flex; border-bottom: 1px solid var(--border); background: var(--bg-panel); padding: 0 10px; }
        .tab-btn { 
            padding: 12px 20px; background: none; border: none; color: var(--text-muted); cursor: pointer; 
            font-size: 12px; font-weight: 600; border-bottom: 2px solid transparent; transition: color 0.2s;
        }
        .tab-btn:hover { color: var(--text-main); }
        .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
        
        .tab-content { display: none; padding: 0; flex: 1; overflow-y: auto; background: var(--bg-app); }
        .tab-content.active { display: block; }

        /* JSON & Clés/Valeurs */
        .kv-section { padding: 20px; border-bottom: 1px solid var(--border); }
        .kv-title { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px; }

        pre { 
            background: #0d1117; border: 1px solid var(--border); border-radius: 6px; 
            padding: 12px; margin: 0; overflow-x: auto; font-family: var(--font-mono); font-size: 12px; color: #e6edf3;
        }
        .key { color: #7ee787; } .string { color: #a5d6ff; } .number { color: #79c0ff; } .boolean { color: #569cd6; }

        /* Badges */
        .badge { padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; border: 1px solid; }
        .badge.success { background: rgba(35,134,54,0.15); color: #3fb950; border-color: rgba(35,134,54,0.4); }
        .badge.error { background: rgba(218,54,51,0.15); color: #f85149; border-color: rgba(218,54,51,0.4); }
        .badge.running { background: rgba(210,153,34,0.15); color: #e3b341; border-color: rgba(210,153,34,0.4); }

        /* Bouton fermeture */
        .close-btn { cursor: pointer; opacity: 0.5; transition: opacity 0.2s; font-size: 14px; }
        .close-btn:hover { opacity: 1; }

    </style>
</head>
<body>

    <div id="app-container">
        
        <div id="sidebar" class="panel">
            <div class="panel-header">
                <span>Runs History</span>
                <span id="run-count" style="background:var(--bg-hover); padding:2px 6px; border-radius:4px; font-size:10px">0</span>
            </div>
            <div id="run-list" class="scroll-area">
                </div>
        </div>

        <div id="waterfall" class="panel">
            <div class="panel-header" style="justify-content: space-between;">
                <span>Trace Execution</span>
            </div>
            <div id="trace-tree" class="scroll-area"></div>
        </div>

        <div id="inspector" class="panel" style="border-right:none;">
            <div id="inspector-container">
                
                <div id="inspector-main">
                    <div class="panel-header" style="background:var(--bg-app); border-bottom:1px solid var(--border);">
                        <span>Node Details</span>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <button onclick="showGraph()" style="background:var(--bg-hover); border:1px solid var(--border); color:var(--text-muted); padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px;">📊 Graph</button>
                            <button id="btn-stats" onclick="toggleStats()" style="background:var(--bg-hover); border:1px solid var(--border); color:var(--text-muted); padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px;">📈 Stats</button>
                            <span class="close-btn" onclick="closeInspector()" title="Close details">✕</span>
                        </div>
                    </div>

                    <div id="insp-header" class="insp-header">
                        <div id="insp-title" class="insp-title"></div>
                        <div style="display:flex; gap:8px;">
                            <span id="insp-status" class="badge"></span>
                            <span id="insp-type" class="badge" style="color:var(--text-muted); border-color:var(--border)"></span>
                        </div>
                    </div>

                    <div class="tab-bar">
                        <button class="tab-btn active" onclick="switchTab('run')">RUN</button>
                        <button class="tab-btn" onclick="switchTab('metadata')">METADATA</button>
                    </div>

                    <div id="tab-run" class="tab-content active">
                        <div class="kv-section">
                            <div class="kv-title">Input</div>
                            <div id="insp-input"></div>
                        </div>
                        <div class="kv-section">
                            <div class="kv-title">Output</div>
                            <div id="insp-output"></div>
                        </div>
                    </div>

                    <div id="tab-metadata" class="tab-content">
                         <div class="kv-section">
                            <div class="kv-title">Raw JSON Payload</div>
                            <div id="insp-extra"></div>
                        </div>
                    </div>
                </div>

                <div id="inspector-stats" style="display:none;">
                    <div style="margin-bottom:24px;">
                        <div class="kv-title">Start Time</div>
                        <div id="stat-start" style="font-family:var(--font-mono); font-size:12px;">-</div>
                    </div>
                    <div style="margin-bottom:24px;">
                        <div class="kv-title">Latency</div>
                        <div id="stat-latency" style="font-family:var(--font-mono); font-size:16px; font-weight:600;">-</div>
                    </div>
                    <div style="margin-bottom:24px;">
                        <div class="kv-title">Tokens</div>
                        <div id="stat-tokens" style="font-family:var(--font-mono); font-size:14px;">-</div>
                    </div>
                    <div style="margin-bottom:24px;">
                        <div class="kv-title">ID</div>
                        <div id="stat-id" style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted); word-break:break-all;">-</div>
                    </div>
                </div>

            </div>
        </div>

    </div>

    <!-- Graph Modal -->
    <div id="graph-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:9999;">
        <div style="position:relative; width:90%; height:90%; margin:5% auto; background:var(--bg-panel); border:1px solid var(--border); border-radius:8px; display:flex; flex-direction:column;">
            <div style="padding:16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; color:var(--text-main);">📊 Workflow Graph</h3>
                <button onclick="closeGraph()" style="background:var(--bg-hover); border:1px solid var(--border); color:var(--text-muted); padding:6px 12px; border-radius:4px; cursor:pointer;">✕ Close</button>
            </div>
            <div id="graph-content" style="flex:1; padding:20px; overflow:auto; display:flex; align-items:center; justify-content:center;"></div>
        </div>
    </div>

    <script>
        mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        
        const runs = {};
        const rootRuns = [];
        let selectedRootId = null;
        let selectedSpanId = null;

        window.addEventListener('message', e => { if (e.data.type === 'TRACE') ingest(e.data.data, e.data.event); });

        // --- GESTION DE L'AFFICHAGE DYNAMIQUE (LE COEUR DU DESIGN) ---
        function setViewMode(mode) {
            const container = document.getElementById('app-container');
            container.classList.remove('mode-trace', 'mode-inspect');
            
            // Mode 1: Default (Juste l'historique en grand)
            // Mode 2: Trace (Historique réduit + Trace)
            if (mode === 'trace') container.classList.add('mode-trace');
            // Mode 3: Inspect (Tout affiché)
            if (mode === 'inspect') container.classList.add('mode-inspect');
        }

        function closeInspector() {
            selectedSpanId = null;
            renderWaterfall(selectedRootId);
            setViewMode('trace');
        }

        // GRAPH FUNCTIONS
        function showGraph() {
            if (!selectedRootId) { alert('Select a run first'); return; }
            
            // Priority 1: Check metadata
            const rootRun = runs[selectedRootId];
            let graph = rootRun?.metadata?.mermaid_graph || rootRun?.extra?.metadata?.mermaid_graph;
            
            // Fallback: Auto-generate
            if (!graph) {
                console.log('No graph in metadata, auto-generating...');
                graph = makeGraph(selectedRootId);
            } else {
                console.log('✅ Using graph from metadata');
            }
            
            const modal = document.getElementById('graph-modal');
            const content = document.getElementById('graph-content');
            modal.style.display = 'block';
            content.innerHTML = '<div class="mermaid">' + graph + '</div>';
            setTimeout(() => { mermaid.run({ querySelector: '.mermaid' }); }, 100);
        }

        function closeGraph() {
            document.getElementById('graph-modal').style.display = 'none';
        }

        function toggleStats() {
            const panel = document.getElementById('inspector-stats');
            const btn = document.getElementById('btn-stats');
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                btn.style.background = 'var(--bg-active)';
                btn.style.color = 'var(--accent)';
            } else {
                panel.style.display = 'none';
                btn.style.background = 'var(--bg-hover)';
                btn.style.color = 'var(--text-muted)';
            }
        }

        function makeGraph(rootId) {
            let graph = 'graph TD\\n';
            const seen = new Set();
            function walk(id) {
                if (seen.has(id)) return;
                seen.add(id);
                const r = runs[id];
                if (!r) return;
                const nid = id.slice(0,8).replace(/[^a-z0-9]/gi, '_');
                const name = (r.name || 'node').replace(/"/g, "'");
                graph += '    ' + nid + '["' + name + '"]\\n';
                (r.children || []).forEach(cid => {
                    const cnid = cid.slice(0,8).replace(/[^a-z0-9]/gi, '_');
                    graph += '    ' + nid + ' --> ' + cnid + '\\n';
                    walk(cid);
                });
            }
            walk(rootId);
            return graph;
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Logique simple pour trouver les boutons
            const btns = document.querySelectorAll('.tab-btn');
            if(tabName === 'run') btns[0].classList.add('active');
            else btns[1].classList.add('active');
            
            document.getElementById('tab-' + tabName).classList.add('active');
        }

        // --- LOGIQUE METIER ---
        function ingest(data, type) {
            const id = data.id;
            if (!runs[id]) {
                runs[id] = { ...data, status: 'running', children: [] };
                if (!data.parent_run_id) { 
                    rootRuns.unshift(id); 
                    renderSidebar(); 
                } else {
                    const p = runs[data.parent_run_id];
                    if (p && !p.children.includes(id)) p.children.push(id);
                }
            } else {
                runs[id] = { ...runs[id], ...data };
                if (data.outputs) runs[id].status = 'success';
                if (data.error) runs[id].status = 'error';
                
                if (rootRuns.includes(id)) renderSidebar();
                if (selectedRootId === getRoot(id)) renderWaterfall(selectedRootId);
                if (selectedSpanId === id) renderInspector(id);
            }
        }

        function getRoot(id) {
            let c = runs[id];
            while (c && c.parent_run_id) c = runs[c.parent_run_id];
            return c ? c.id : id;
        }

        function renderSidebar() {
            document.getElementById('run-count').innerText = rootRuns.length;
            document.getElementById('run-list').innerHTML = rootRuns.map(id => {
                const r = runs[id];
                const active = id === selectedRootId ? 'active' : '';
                const dur = calcDur(r);
                const st = r.status === 'error' ? 'error' : (r.status === 'success' ? 'success' : 'running');
                return \`<div class="run-item \${active}" onclick="selectRoot('\${id}')">
                    <div class="run-title" style="color:\${st === 'running' ? '#e3b341' : (st==='error'?'#f85149':'#e6edf3')}">\${r.name || 'Untitled'}</div>
                    <div class="run-meta"><span>\${st}</span><span>\${dur}</span></div>
                </div>\`;
            }).join('');
        }

        function selectRoot(id) {
            selectedRootId = id;
            selectedSpanId = null;
            renderSidebar();
            renderWaterfall(id);
            // ANIMATION : On passe en mode Trace
            setViewMode('trace');
        }

        function renderWaterfall(rootId) {
            const el = document.getElementById('trace-tree');
            if(!runs[rootId]) return;
            let h = '';
            
            function build(rid, d) {
                const r = runs[rid];
                if(!r) return;
                const sel = rid === selectedSpanId ? 'selected' : '';
                const icon = r.run_type === 'llm' ? '🤖' : (r.run_type === 'chain' ? '🔗' : '⚪');
                const col = r.status === 'error' ? '#f85149' : (r.status === 'success' ? '#3fb950' : '#e3b341');
                
                // Lignes de guide visuel
                const indent = d > 0 ? \`<span style="width:\${d*20}px; display:inline-block; border-right:1px solid #30363d; height:10px; margin-right:10px; opacity:0.3"></span>\` : '';

                h += \`<div class="trace-row \${sel}" onclick="selectSpan('\${rid}')">
                    <div style="padding-left:\${d*15}px; display:flex; align-items:center; flex:1; overflow:hidden">
                        <span style="color:\${col}; margin-right:8px; font-size:10px">●</span>
                        <span style="margin-right:8px">\${icon}</span>
                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px">\${r.name}</span>
                    </div>
                    <span class="trace-time">\${calcDur(r)}</span>
                </div>\`;
                if(r.children) {
                    r.children.sort((a,b) => (runs[a].start_time > runs[b].start_time) ? 1 : -1);
                    r.children.forEach(c => build(c, d+1));
                }
            }
            build(rootId, 0);
            el.innerHTML = h;
        }

        function selectSpan(id) {
            selectedSpanId = id;
            renderWaterfall(selectedRootId);
            renderInspector(id);
            // ANIMATION : On passe en mode Inspect
            setViewMode('inspect');
        }

        function renderInspector(id) {
            const r = runs[id];
            if(!r) return;

            document.getElementById('insp-title').innerText = r.name;
            const st = document.getElementById('insp-status');
            st.className = 'badge ' + (r.status === 'error' ? 'error' : (r.status === 'success' ? 'success' : 'running'));
            st.innerText = r.status;
            document.getElementById('insp-type').innerText = r.run_type;

            // Tab RUN
            document.getElementById('insp-input').innerHTML = formatJson(r.inputs);
            document.getElementById('insp-output').innerHTML = formatJson(r.outputs);
            
            // Tab META & STATS (Droite)
            document.getElementById('stat-start').innerText = new Date(r.start_time).toLocaleTimeString();
            document.getElementById('stat-latency').innerText = calcDur(r);
            document.getElementById('stat-latency').style.color = r.status === 'success' ? '#3fb950' : '#c9d1d9';
            document.getElementById('stat-tokens').innerText = (r.extra?.token_usage?.total_tokens) || '0';
            document.getElementById('stat-id').innerText = r.id;
            
            document.getElementById('insp-extra').innerHTML = formatJson(r.extra || {});
        }

        function calcDur(r) {
            if(!r.end_time || !r.start_time) return r.status === 'running' ? '...' : '';
            return ((new Date(r.end_time) - new Date(r.start_time))/1000).toFixed(2) + 's';
        }

        function formatJson(obj) {
            if(!obj) return '<span style="color:#8b949e; font-style:italic">Empty</span>';
            return '<pre>' + JSON.stringify(obj, null, 2).replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'number';
                if (/^"/.test(match)) cls = /:$/.test(match) ? 'key' : 'string';
                else if (/true|false/.test(match)) cls = 'boolean';
                else if (/null/.test(match)) cls = 'null';
                return '<span class="' + cls + '">' + match + '</span>';
            }) + '</pre>';
        }
    </script>
</body>
</html>`;
}
