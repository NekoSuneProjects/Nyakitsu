# ChatGPT and browser tasks

## Connect an account

1. Open the settings button in the Nyakitsu AI sidebar.
2. Choose **ChatGPT subscription** and select **Sign in with ChatGPT**.
3. Complete OpenAI's authentication in your default browser. The bundled official Codex app-server handles the callback and credential lifecycle.
4. Use **Check connection** if the sidebar has not refreshed yet. You can cancel a pending sign-in or sign out later.
5. Optionally select **Discover** and choose an available model, or leave the model empty to use the account default. Select **Save connection**.

Existing saved provider settings are retained; new installations start with ChatGPT selected. Subscription access is through the account's available Codex entitlement, not API credit. No credentials from the Codex desktop app are copied into Nyakitsu.

## Run and resume tasks

Choose **Browser task**, enter a request such as “Open GitHub and read this repository's README,” and send it. The assistant requests access to websites it needs, reads the current page, proposes an action, performs it, and inspects the next page. A purple pointer marker shows interaction coordinates inside the web content.

Navigation links can proceed within granted sites. Buttons, form input and potentially consequential links show an approval with the site, control and proposed action. **Stop task** cancels further steps. **Resume task** retains the original request, site grants and action history while obtaining a fresh page observation.

Sign-in evidence is gathered across visible main-document controls. A sign-out control provides evidence of a session; an account icon by itself is uncertain. The planner can inspect an account menu and should continue when already signed in. Credentials, MFA and CAPTCHA require manual interaction before resumption.

Use **Ask about page** to read and summarize without browser control. The original summarize/explain/next-step shortcuts remain in this mode.

## What is tested and what remains

- Unit tests exercise URL/action validation, trusted IPC, account URL validation, cancellation, session continuation and task resumption.
- The Chromium fixture checks typing, selecting, blocked sensitive input, stale-target rejection and an approved simulated zero-cost claim followed by ownership verification.
- The account smoke check uses a fresh signed-out directory and the bundled executable. It checks initialization, official OAuth URL creation and cancellation without completing user login or running inference.
- UI checks cover connection settings, login-button dispatch, model discovery, saving, task mode and approval rendering using a test account adapter.
- The Windows unpacked-package smoke test confirms current source files are included, the bundled native helper starts outside the application archive, and a fresh account directory remains signed out. This is not a signed installer or a Linux runtime test.

Run `npm test`, `npm run test:browser`, `npm run test:account` and (after `npm run build`) `npm run test:ui`. After creating `release/win-unpacked`, run `npx electron tests/integration/packaged.cjs` to check the packaged helper.

A successful real account login, a subscription-backed model response and real Epic Games claiming are not established by those tests. Do not mark those end-to-end milestones complete until they are actually exercised. The current reader does not traverse cross-origin frames, shadow roots or graphical-only controls. It captures up to 24,000 characters and 500 main-document controls per observation. Task history is in memory and does not survive closing Nyakitsu.

## Code map

| Responsibility | Files |
| --- | --- |
| Startup/window | `electron/main.cjs`, `electron/app/window.cjs` |
| Trusted IPC and message validation | `electron/ipc/handlers.cjs`, `electron/preload.cjs` |
| Subscription transport/authentication | `electron/ai/auth/codex-transport.cjs`, `electron/ai/auth/chatgpt.cjs` |
| Subscription model adapter | `electron/ai/providers/chatgpt.cjs` |
| Existing API adapters/registry | `electron/ai/client.cjs`, `electron/ai/providers.cjs` |
| Browser observations and actions | `electron/agent/observation.cjs`, `electron/agent/actions.cjs` |
| Task state and planner | `electron/agent/task-runner.cjs`, `electron/agent/planner.cjs` |
| Navigation UI | `src/features/navigation/`, `src/hooks/useBrowserTabs.ts` |
| Assistant UI | `src/features/assistant/` |
| Provider/account UI | `src/features/settings/` |
| Shared renderer contracts | `src/types.ts` |

## Claude and extensions

The existing Claude API adapter can use the same browser task planner. A custom Claude Pro/Max/Team OAuth login has not been added; Anthropic's documented restrictions and the possible unmodified-Claude-Code route are tracked in the roadmap.

Chrome extension installation, uBlock Origin compatibility, VRChat, OBS, Discord, CLI and online-companion features remain in the to-do list. Their entries are plans, not working functionality.
