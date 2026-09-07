# 🐱🦊 Nyakitsu

**Cat curiosity. Fox intelligence.**

Nyakitsu is an experimental, open-source, AI-native desktop browser. It combines Chromium browsing with a provider-agnostic AI assistant instead of locking the browser to one model company.

> **Status:** `0.1.0-alpha.1` — early development. Do not rely on Nyakitsu yet for sensitive browsing or irreversible AI actions.

## Current alpha features

- Chromium pages hosted in isolated Electron `WebContentsView` tabs
- Tabs, address/search bar, back, forward, reload and stop
- Dark Nyakitsu browser interface
- Context-aware AI sidebar
- Summarize / explain / next-step shortcuts
- Current page and selected-text context for AI
- Provider/model settings and model discovery
- API credentials handled in the Electron main process, not exposed to websites
- OS-backed `safeStorage` encryption when available
- Windows NSIS + portable packages
- Linux AppImage + `.deb` packages
- GitHub Actions builds

## AI providers

Nyakitsu ships a provider adapter system rather than a single AI dependency.

### Native adapters
- Anthropic Claude
- Google Gemini
- Ollama local
- Ollama-compatible cloud endpoints

### OpenAI-compatible providers
- OpenAI
- xAI Grok
- DeepSeek
- Groq
- OpenRouter
- Mistral AI
- Perplexity
- Together AI
- Fireworks AI
- Cerebras
- SambaNova
- NVIDIA NIM
- Hugging Face Inference
- LM Studio
- LocalAI
- vLLM
- KoboldCpp
- Custom OpenAI-compatible endpoint

Free tiers are provider-controlled and may change. Nyakitsu labels providers that commonly offer a free/local path, but does not promise unlimited free API usage.

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Build the renderer:

```bash
npm run check
npm run build
```

Package:

```bash
npm run dist:win
npm run dist:linux
```

## Security model

Websites run with Node integration disabled, context isolation enabled and sandboxing enabled. AI keys stay behind IPC in the main process. The initial alpha also denies website permission requests by default.

This is only the first security layer. Before agentic clicking, typing, uploads, purchases or account changes are enabled, Nyakitsu will add explicit per-site permissions and human approval gates.

See [`SECURITY.md`](SECURITY.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Roadmap

The next milestones include bookmarks/history/download UI, browser profiles, split view, voice, multi-tab AI context, AI tool calling, per-domain AI permissions, action confirmations, optional local memory, MCP/plugin integration and stronger extension support.

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## License

MIT © NekoSuneProjects
