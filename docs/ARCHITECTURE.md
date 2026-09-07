# Architecture

```text
React browser chrome
        │
        │ contextBridge / narrow IPC
        ▼
Electron main process
   ├── TabManager
   │     └── sandboxed WebContentsView per tab
   ├── provider registry
   ├── AI adapters
   └── encrypted settings
```

## Trust boundaries

The React renderer is browser chrome only. It does not receive raw provider secrets. Remote websites are rendered in separate sandboxed `WebContentsView` instances and have no Nyakitsu preload bridge.

The Electron main process owns tab lifecycle, page-context extraction and outbound AI API calls. As agent tools are introduced, the main process will also be the enforcement point for per-domain capabilities and human confirmations.

## Provider adapters

Providers are grouped into four protocol families:

- OpenAI-compatible Chat Completions
- Anthropic Messages
- Google Gemini `generateContent`
- Ollama Chat

A custom OpenAI-compatible provider means newer services can work without Nyakitsu needing a dedicated release for every provider.
