# Nyakitsu Roadmap

Updated 8 September 2026. Checked items describe implemented foundations, not universal website compatibility. Unchecked items remain planned. See [the feature and integration to-do list](../TODO.md) for researched priorities and community requests.

## Implementation standard — Modular and readable

- [x] Extract the main window/IPC wiring and the navigation, assistant, account and settings UI into focused modules.
- [ ] Split each existing API protocol adapter and expand shared request contracts as integrations grow.
- [ ] Give agent tasks, extensions, each integration and CLI commands their own modules.
- [ ] Maintain a contributor map using [the planned architecture](ARCHITECTURE.md#planned-module-layout).

## Next architecture decision — Extension compatibility

- [ ] Evaluate the browser foundation before committing to broad Chrome extension support.
- [ ] Test full uBlock Origin separately from uBlock Origin Lite; record actual compatibility and missing APIs.
- [ ] Compare extending Electron with adopting a maintained full browser foundation; assess security updates, packaging and ongoing maintenance.

Electron supports only a subset of extension APIs and unpacked loading. Chrome Web Store installation and universal extension compatibility must not be advertised as existing features. Full uBlock Origin compatibility is a requirement to investigate, not a verified capability. Details and sources are in [the extension backlog](../TODO.md#extension-compatibility--architecture-first).

## 0.1 — Browser + AI foundation
- [x] Electron/Chromium browser shell
- [x] Isolated browser tabs
- [x] AI sidebar
- [x] Multi-provider adapters
- [x] Model discovery
- [x] Page context and selected text
- [x] Encrypted provider-key storage
- [x] Windows/Linux CI packaging

## 0.2 — Daily browser features
- [ ] New-tab dashboard
- [ ] Bookmarks
- [ ] History and natural-language history search
- [ ] Downloads manager
- [ ] Profiles and private browsing
- [ ] Find in page
- [ ] Zoom controls
- [ ] Split view

## 0.3 — Agentic browsing
- [x] Browser tool schema: navigate/click/type/select/scroll
- [ ] DOM + accessibility-tree page understanding
- [x] Agent step timeline
- [ ] Per-domain Read / Control / Block permissions
- [x] Per-task site grants and confirmations for buttons/form changes
- [ ] Prompt-injection defenses
- [ ] Download/upload safeguards
- [x] Virtual pointer confined to the browser tab, with visible action marker and stop control
- [x] Observe → act → verify planner loop bounded to 30 steps per run
- [x] Account-control evidence from anywhere in the main document, with signed-in / signed-out / unknown states
- [x] Continue existing sessions and pause/resume for manual login while retaining task history
- [ ] Broaden authentication detection for localized, iframe, shadow-DOM and site-specific interfaces
- [ ] Verify duplicate-submit prevention on live transactional sites
- [ ] Epic free-game workflow: find eligible offers, verify zero total, claim within user-authorized scope, verify ownership
- [ ] Read GitHub folders/files and explain repositories with source links

## ChatGPT authentication — Primary provider

- [x] Add “Sign in with ChatGPT” alongside existing API and local-model providers; default to ChatGPT on new installs.
- [x] Integrate the official Codex app-server browser sign-in flow and cancellation.
- [x] Display connection/plan status, discover account models and surface provider errors.
- [x] Keep subscription authentication in a dedicated Codex home and support sign-out.
- [ ] Verify expired-session and real account usage-limit recovery.
- [ ] Validate the complete browser-agent flow using an eligible signed-in ChatGPT account.

Official documentation describes ChatGPT sign-in for subscription access through Codex and app-server embedding in other products. This uses the account's available Codex entitlement; it does not turn a ChatGPT subscription into unrestricted API credit. Eligibility and limits must be verified during implementation. [Authentication](https://learn.chatgpt.com/docs/auth), [app-server integration](https://learn.chatgpt.com/docs/app-server).

## Claude subscription authentication — Provider approval required

- [ ] Obtain a supported integration route or Anthropic approval before offering Claude.ai subscription login inside Nyakitsu.
- [ ] Assess an explicit integration with the unmodified Claude Code application separately from Nyakitsu's model-provider adapter.
- [ ] Verify Pro, Max and Team eligibility and usage behavior if an approved route becomes available.

Claude API access remains available. Anthropic's documentation distinguishes third-party subscription-login restrictions from users authenticating in the unmodified Claude Code binary. No custom Claude OAuth login has been implemented. [Anthropic authentication conditions](https://code.claude.com/docs/en/legal-and-compliance), [Agent SDK guidance](https://code.claude.com/docs/en/agent-sdk/overview).

## 0.4 — Intelligence
- [ ] Multi-tab research
- [ ] Provider fallback routing
- [ ] Prefer Free / Local Only / Fastest / Cheapest modes
- [ ] Optional local memory
- [ ] Voice mode
- [ ] Reusable AI shortcuts

## Later
- [ ] MCP/plugin support
- [ ] Optional sync service
- [ ] Android exploration
- [ ] Stronger extension compatibility
- [ ] Evaluate migration from Electron shell to maintained Chromium fork
- [ ] CLI task control, online companion and optional scheduling, as scoped in [TODO.md](../TODO.md)
- [ ] VRChat, GitHub, OBS, Discord and other integrations, prioritized in [TODO.md](../TODO.md)
