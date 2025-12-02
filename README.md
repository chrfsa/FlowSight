# 🎯 FlowSight - Extension de Tracing LangChain Local

Extension VSCode pour tracer et visualiser vos applications LangChain/LangGraph **localement**, sans dépendance cloud.

## 🚀 Fonctionnalités

- **Tracing Local**: Compatible API LangSmith (port 1984)
- **Visualisation Graph**: 3 stratégies automatiques
  1. 🌐 Fetch depuis API externe (port 8000)
  2. 📦 Lecture depuis metadata
  3. 🔧 Auto-génération depuis hiérarchie des runs
- **UI Moderne**: GitHub-style, dark theme, panels interactifs
- **Real-time**: Mise à jour en temps réel pendant l'exécution

## 📦 Installation

### 1. Installer l'extension dans VSCode

```bash
cd /home/said/Bureau/FlowSightProject
npm install
npm run compile
```

### 2. Lancer l'extension

1. Ouvrir le projet dans VSCode
2. Appuyer sur `F5` pour lancer en mode debug
3. Dans la fenêtre VSCode qui s'ouvre:
   - `Cmd+Shift+P` (ou `Ctrl+Shift+P`)
   - Taper "FlowSight: Open Monitor"

## 🔌 Configuration Python

### Configuration Simple (tracing uniquement)

```python
import os

# Active le tracing LangChain
os.environ["LANGCHAIN_TRACING_V2"] = "true"

# Redirige vers FlowSight local au lieu du cloud
os.environ["LANGCHAIN_ENDPOINT"] = "http://localhost:1984"

# Votre code LangChain habituel
from langchain_openai import ChatOpenAI
model = ChatOpenAI()
result = model.invoke("Hello!")
```

### Configuration avec Graph API (recommandé)

Si vous avez un serveur LangGraph qui expose les endpoints:

```python
import os

# Tracing FlowSight
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "http://localhost:1984"

# L'extension tentera de récupérer le graph depuis:
# http://localhost:8000/api/v1/runs/{run_id}/graph
```

**Note**: Par défaut, FlowSight cherche l'API graph sur `http://localhost:8000`. Modifiable dans `extension.ts` ligne 236.

## 📊 Visualisation Graph

### Comment ça marche

Quand vous cliquez sur le bouton **📈 Graph**, FlowSight utilise une cascade de 3 stratégies:

#### 1️⃣ **Fetch API** (Priorité Haute)
```
GET http://localhost:8000/api/v1/runs/{run_id}/graph

Response attendue:
{
  "nodes": [
    {"id": "node1", "name": "llm_call", "type": "llm"},
    {"id": "node2", "name": "review", "type": "chain"}
  ],
  "edges": [
    {"source": "node1", "target": "node2"}
  ]
}
```

#### 2️⃣ **Metadata** (Fallback)
Si l'API n'est pas disponible, cherche dans les métadonnées du run:
```python
from langgraph.graph import StateGraph
from langchain_core.runnables import RunnableConfig

graph = StateGraph(...)
compiled = graph.compile()

# Générer le Mermaid
mermaid_graph = compiled.get_graph().draw_mermaid()

# Envoyer dans metadata
result = compiled.invoke(
    input_data,
    config=RunnableConfig(metadata={"mermaid_graph": mermaid_graph})
)
```

#### 3️⃣ **Auto-génération** (Last Resort)
Si aucune des deux méthodes ne fonctionne, génère automatiquement un graph depuis la hiérarchie parent/enfant des runs tracés.

### Exemple visuel

```
🌐 API disponible → Graph riche avec conditional edges
📦 Metadata fournie → Graph LangGraph natif
🔧 Auto-gen → Graph simple (arbre des runs)
```

## 🖥️ Interface Utilisateur

### Panels

```
┌─────────────┬──────────────────┬────────────────────────┐
│  Runs       │  Trace Tree      │    Inspector           │
│  History    │  (Waterfall)     │                        │
│             │                  │  📈 Graph  📊 Stats    │
│  • Run 1    │  🤖 LLM Call     │                        │
│  • Run 2    │    🔗 Chain      │  [Détails du span]     │
│  • Run 3    │      ⚪ Tool     │                        │
└─────────────┴──────────────────┴────────────────────────┘
```

### Boutons

- **📈 Graph**: Affiche le graphe de workflow (en overlay)
- **📊 Stats**: Toggle panneau statistiques (latence, tokens, timestamps)
- **×**: Fermer l'inspector

## 🧪 Test Rapide

```bash
# Lancer le test existant
python test_graph.py
```

Vérifier dans VSCode FlowSight Monitor:
1. Un nouveau run apparaît dans "Runs History"
2. Cliquer dessus → voir l'arbre d'exécution
3. Cliquer "📈 Graph" → voir le graphe auto-généré

## 🛠️ Développement

### Structure du projet

```
FlowSightProject/
├── src/
│   └── extension.ts    # Backend (Express) + Frontend (Webview)
├── out/                # Compiled JS
├── test_graph.py       # Script de test
└── package.json
```

### Compiler après modifications

```bash
npm run compile
# ou en mode watch
npm run watch
```

### Debugging

1. Console du webview: `Developer Tools` dans la fenêtre FlowSight
2. Logs serveur: Visible dans la console VSCode Debug

## 📝 Endpoints Implémentés

### FlowSight Server (Port 1984)
- `GET /info` - Info serveur
- `POST /runs` - Créer un run
- `PATCH /runs/:runId` - Mettre à jour un run
- `POST /runs/batch` - Opérations batch

### API Graph Externe (Port 8000 - Optionnel)
- `GET /api/v1/runs/{run_id}/graph` - Structure du graph

## 🎨 Personnalisation

### Changer le port API Graph

Dans `extension.ts` ligne 236:
```javascript
const GRAPH_API_ENDPOINT = 'http://localhost:8000';
```

### Modifier les styles Mermaid

Dans `convertAPIGraphToMermaid()` ligne 290:
```javascript
const nodeStyles = {
    'start': '([START])',
    'end': '([END])',
    'llm': '{{LLM}}',      // ← Formes des nodes
    'chain': '[CHAIN]',
    'tool': '[(TOOL)]',
};
```

## 🐛 Troubleshooting

### Le graph ne s'affiche pas

1. **Ouvrir la console**: Clic droit dans FlowSight → "Inspect Element"
2. **Vérifier les logs**:
   - `✅ Graph fetched from API` → API OK
   - `✅ Graph loaded from metadata` → Metadata OK
   - `⚙️ Auto-generating graph from runs...` → Fallback actif
   - Erreur Mermaid? → Syntaxe invalide

### "Graph API not available"

C'est normal si vous n'avez pas de serveur sur port 8000. L'extension utilisera automatiquement le fallback (metadata ou auto-gen).

### Pas de runs dans la sidebar

Vérifier que:
```python
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "http://localhost:1984"
```

## 🔒 Confidentialité

**100% local** - Aucune donnée n'est envoyée au cloud. Tous les runs restent sur votre machine.

## 📄 License

Projet open-source pour usage personnel et éducatif.

---

**Made with ❤️ for local LangChain development**
