# Architecture

The current implemented module map is in [Browser tasks](BROWSER_TASKS.md#code-map). The larger directory tree below remains the target for future features.

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

Providers are grouped into five protocol families:

- OpenAI-compatible Chat Completions
- Anthropic Messages
- Google Gemini `generateContent`
- Ollama Chat
- ChatGPT subscription through the bundled official Codex app-server

A custom OpenAI-compatible provider means newer services can work without Nyakitsu needing a dedicated release for every provider.

## Planned module layout

This is the target structure for future refactoring and features, not the current file tree. The present entry points are `electron/main.cjs` and `src/App.tsx`; keep them focused on startup and composition when extracting modules. Add modules when they have working responsibilities, rather than creating empty placeholders for every future idea.

```text
electron/
  main.cjs                       App startup and shutdown only
  app/                           Window creation and lifecycle
  ipc/                           Trusted-sender checks and handler registration
  browser/                       Tabs, profiles, navigation, history, downloads
  agent/                         Task runner, observations, browser actions,
                                 sign-in state, permissions, result verification
  ai/
    providers/                   One adapter per provider protocol
    auth/                        Subscription sign-in and account lifecycle
    registry.cjs                 Provider metadata and capabilities
  extensions/                    Loading, compatibility checks, permissions, updates
  integrations/
    github/                      Repository reading and GitHub authentication
    epic/                        Offer discovery and claim workflow
    vrchat/                      OSC connection and controls
    obs/                         OBS connection and commands
    discord/                     Presence and deliberate sharing
  storage/                       Settings, credentials, migrations and data access
  services/                      Scheduling and optional sync/remote pairing
src/
  App.tsx                        Compose the browser interface
  features/
    tabs/                        Tab strip and tab actions
    navigation/                  Address bar and navigation controls
    assistant/                   Chat, task progress, approvals and resume UI
    settings/                    Provider, account and preference panels
    workspaces/                  Workspace navigation and management
    extensions/                  Extension manager UI
    integrations/                Connection and integration settings
  components/                    Small UI elements shared across features
  hooks/                         Shared browser-event hooks
  styles/                        Theme tokens and shared layout styles
shared/                          Request/event contracts and public data types
cli/                             Command parsing and desktop connection client
tests/
  unit/                          State transitions and validation
  integration/                   Provider/protocol and browser integration tests
  e2e/                           Login/resume, task completion and extension checks
docs/                            Architecture, contributor map and feature guides
```

## Module boundaries and contributor rules

- Keep UI, application logic and external-service calls separate. UI components must not read credentials, run shell commands or directly control remote websites.
- Each integration owns its connection, actions and tests. Shared browser mechanics belong in the browser/agent modules, not duplicated in each integration.
- Keep sign-in detection separate from site-specific workflows. Epic can use the shared session state without hard-coding a top-right account button.
- Keep AI provider authentication separate from website login cookies and browser profiles.
- Use one set of typed request/event contracts for desktop UI and CLI. Both call the same task engine and permission checks.
- Place public exports at each feature boundary. Avoid a growing miscellaneous helper file or circular imports between integrations.
- Keep provider capabilities explicit: chat, tool use, vision, subscription authentication and model discovery may differ.
- Use descriptive filenames, small functions and comments that explain intent or constraints. Split files by responsibility rather than an arbitrary line limit.
- Document new features with their entry point, owned data, dependencies, permission boundary and relevant tests.
- Refactor existing behavior first, verify it still works, then add features in small reviewable changes.

## Refactoring order

1. Extract tab strip, toolbar, assistant, provider settings and event hooks from `src/App.tsx`.
2. Extract window lifecycle and IPC registration from `electron/main.cjs`.
3. Separate the existing AI protocol adapters behind their common interface.
4. Establish shared contracts and storage boundaries before adding accounts or task state.
5. Add agent, extension and integration modules as their roadmap milestones begin.

Use this layout as a guide rather than a requirement to introduce a plugin framework before the first integration. The browser-foundation decision for extension compatibility may change the backend directories; the responsibility boundaries should survive that decision.
