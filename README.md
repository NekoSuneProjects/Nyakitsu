# 🐱🦊 Nyakitsu

**Cat curiosity. Fox intelligence.**

Nyakitsu is an experimental, open-source, AI-native desktop browser. It combines Chromium browsing with a provider-agnostic AI assistant instead of locking the browser to one model company.

> **Status:** `0.1.0-alpha.1` — early development. Do not rely on Nyakitsu yet for sensitive browsing or irreversible AI actions.

## Current alpha features

- Chromium pages hosted in isolated Electron `WebContentsView` tabs
- Tabs, address/search bar, back, forward, reload and stop
- Dark Nyakitsu browser interface
- Context-aware AI sidebar
- ChatGPT subscription sign-in through the bundled official Codex app-server
- Browser task mode: open pages, inspect controls, click, type, select and scroll
- Per-task website grants, action approval cards, activity log, stop and resume
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

### ChatGPT subscription (default on new installs)

Open AI settings, choose **ChatGPT subscription**, and select **Sign in with ChatGPT**. Complete OpenAI's sign-in in your default browser. Back in Nyakitsu, check the connection, optionally discover a model, and save the connection. Choose **Browser task** to ask the assistant to open websites and act, or **Ask about page** for reading and explanation.

The connection uses your eligible account's Codex access, with its model availability and usage limits. API providers remain separate. Nyakitsu stores this sign-in in a dedicated account directory managed by the official app-server; it does not import this desktop app's account or browser cookies. [Official authentication documentation](https://learn.chatgpt.com/docs/auth).

For task controls and limitations, see [Browser tasks](docs/BROWSER_TASKS.md). Complete sign-in and a real authenticated task still need validation with your account; automated checks do not claim that user authentication happened.

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

Browser tasks request site access and approval for buttons/form changes, retain history when paused, and stop when their tab is changed or closed. Website credentials, security codes and file inputs require manual interaction. The initial agent reads main-document text and controls; iframe/shadow-DOM support and dedicated transactional-site validation remain future work.

See [`SECURITY.md`](SECURITY.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Roadmap

The next milestones include bookmarks/history/download UI, browser profiles, split view, voice, multi-tab AI context, AI tool calling, per-domain AI permissions, action confirmations, optional local memory, MCP/plugin integration and stronger extension support.

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

For researched browser requests, extension compatibility (including uBlock Origin), VRChat and other integrations, CLI and online features, see [`TODO.md`](TODO.md).

## License

MIT © NekoSuneProjects
