# Nyakitsu feature and integration to-do list

Research date: 7 September 2026. Research backlog; unchecked items remain planned. The primary ChatGPT and browser-task implementation is described in [Browser tasks](docs/BROWSER_TASKS.md). ChatGPT authentication is tracked in [the roadmap](docs/ROADMAP.md#chatgpt-authentication--primary-provider).

## Recommended order

1. Validate the primary ChatGPT/browser-task implementation with a real signed-in account, then investigate extension compatibility and full uBlock Origin feasibility.
2. Expand session recovery and workspaces on the implemented browser task foundation.
3. Deliver GitHub reading and the requested Epic free-game workflow as useful end-to-end tasks.
4. Add VRChat and OBS as a focused creator/gaming integration pack, then Discord.
5. Expose the same tasks through a CLI; add an online companion and optional sync after local use is reliable.

These priorities are recommendations based on this project's direction, dependencies and the sources below. Public feature requests are qualitative evidence, not a representative survey or proof that everyone wants a feature. Many requested capabilities already exist in some browsers; the opportunity is improving incomplete workflows and combining them coherently.

## Code organization — Required for implementation

- [ ] Follow the [planned module layout](docs/ARCHITECTURE.md#planned-module-layout); keep entry files small and give each feature a clear home.
- [x] Split the current interface into navigation/tabs, assistant, account and settings components.
- [x] Separate window startup, IPC handlers, browser services and AI protocol adapters.
- [ ] Give each integration its own folder and tests; share browser actions, permissions and session handling.
- [ ] Use shared typed contracts across the desktop interface, task engine and CLI.
- [x] Add a [contributor file map and browser-task guide](docs/BROWSER_TASKS.md#code-map).
- [ ] Verify the existing browser behavior after refactoring before introducing new features.

## Browser needs supported by community feedback

| Priority | Need people describe | Proposed Nyakitsu feature | Evidence |
| --- | --- | --- | --- |
| High | Too many windows and repeated account switching | Named workspaces with optional separate login containers inside one window | [Brave's product-team feedback thread](https://community.brave.app/t/worskpaces-containers-feature-feedback/598107) |
| High | Losing project context when changing devices or restarting | Restore workspace tabs and layout; export/import backups; optional device sync | [Workspace feedback](https://community.brave.app/t/worskpaces-containers-feature-feedback/598107), [split view and sync request](https://community.brave.com/t/about-split-views-and-synchronization/619815) |
| High | Read-later lists do not follow users consistently between devices | Offline reading library with read/unread state and portable export | [Firefox desktop reading-list request](https://connect.mozilla.org/t5/ideas/reading-list-for-firefox-desktop/idi-p/13565) |
| High | Users want to use their existing local model | A clear Local Only mode, connection checks and control over page sharing | [Mozilla AI experiment feedback](https://connect.mozilla.org/t5/firefox-labs/share-your-feedback-on-the-ai-services-experiment-in-nightly/m-p/70199/highlight/true), [Ollama request](https://connect.mozilla.org/t5/ideas/ollama-in-firefox/idi-p/137265) |
| Medium | Research notes are separated from the article | Persistent reader highlights and notes linked to source pages | [Reader highlighter request](https://connect.mozilla.org/t5/ideas/highlighter-in-on-the-reader-mode/idi-p/137249) |
| Medium | Closing a sidebar loses its state | Sidebar tools retain location and draft state when reopened | [Persistent sidebar request](https://connect.mozilla.org/t5/ideas/stateful-sidebar-windows-that-persists-after-closing-the-sidebar/idi-p/137017) |

The reading-list request showed 133 kudos and 56 comments when opened during research. The reader-highlight and persistent-sidebar requests are recent individual requests, so they carry less evidence of broad demand. Forum status and counts can change.

### Everyday browser checklist

- [ ] Vertical or horizontal tabs, named groups, pinned tabs, tab search and keyboard navigation.
- [ ] Workspaces with save/close/reopen, recovery after a crash and portable backups.
- [ ] Separate login containers with a visible account/profile indicator; default websites to the chosen container.
- [ ] Split view using existing tabs, adjustable panels and restored layout after restart.
- [ ] Bookmarks, history, download management, find in page and zoom controls.
- [ ] Offline reading library with highlights, notes, source URLs and export.
- [ ] Stateful sidebar panels; restore drafts without silently resubmitting forms.
- [ ] Sleeping inactive tabs with exceptions for media and running tasks; show resource use.
- [ ] Accessible focus states, screen-reader labels, adjustable text size and reduced motion.
- [ ] Import bookmarks/settings from another browser with a review of what will be imported.

Items beyond the evidence table are product recommendations and baseline browser requirements, not claims of measured community demand.

## Extension compatibility — Architecture first

**User requirement:** install useful Chrome extensions, including full uBlock Origin, with broad compatibility and minimal restrictions.

**Verified limitation:** Electron documents a partial Chrome Extensions API, unpacked-extension loading and persistent-session requirements. It does not promise arbitrary Chrome Web Store extension compatibility. [Electron extension support](https://www.electronjs.org/docs/latest/api/extensions/).

**uBlock distinction:** full uBlock Origin uses Manifest V2; uBlock Origin Lite is a separate, reduced Manifest V3 implementation. Chrome's documented timeline removes Manifest V2 support from Chrome 139 onward and lists removal of remaining Manifest V2 extensions from the Chrome Web Store on 31 August 2026. Installing from another source alone does not restore missing runtime APIs. [uBlock maintainer explanation](https://github.com/gorhill/uBlock/wiki/About-Google-Chrome%27s-%E2%80%9CThis-extension-may-soon-no-longer-be-supported%E2%80%9D/3ee565f3c7dc89e0f5b6e187e409e20bfdcfee5f), [Chrome timeline](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline).

- [ ] Compare the current Electron approach against a maintained browser foundation with a fuller extension system.
- [ ] Assess the cost of preserving required legacy APIs while continuing browser security updates. Do not depend on freezing an old Chromium release.
- [ ] Build a compatibility matrix for full uBlock Origin, uBlock Origin Lite, a password manager, a theme extension, a userscript manager and developer tools.
- [ ] Test installation, toolbar popup, options page, background execution, content scripts, storage, network filtering and restart persistence for each extension.
- [ ] Add an extension manager: install supported packages, enable/disable, remove, inspect permissions and report unsupported features.
- [ ] Investigate Chrome Web Store distribution separately from runtime compatibility; verify installation and update mechanisms before promising store support.
- [ ] Support a documented alternative source for compatible extensions where appropriate; evaluate other extension ecosystems separately.
- [ ] Test extensions per profile and confirm they cannot acquire Nyakitsu's privileged AI credentials or bypass its task approvals.
- [ ] Investigate built-in content blocking as an additional feature; do not label it full uBlock Origin or silently substitute Lite for the requested extension.

**Acceptance:** publish reproducible pass/fail results on supported platforms. “No limitations” is an ambition, not an acceptance claim; unsupported APIs and extensions must be stated plainly.

## Integration shortlist

| Priority | Integration | First useful result | Feasibility and boundary |
| --- | --- | --- | --- |
| High | GitHub | Read a repo, follow folders/files, explain code and summarize issues with links | Official [repository contents API](https://docs.github.com/en/rest/repos/contents) supports file/directory reading; public resources can be read without authentication. Private access needs scoped authorization. |
| High — requested | Epic Games Store | Discover giveaways, reuse login, claim eligible zero-cost games and verify ownership | [Epic lists weekly free games](https://store.epicgames.com/free-Games). This confirms offers, not an official automated-claim API; claiming needs browser-flow testing. |
| High — requested | VRChat | World-link collection plus local avatar/input controls | VRChat documents [OSC](https://docs.vrchat.com/docs/osc-overview). Social-account/friends features need a separate supported-access investigation; OSC does not establish those capabilities. |
| Medium | OBS Studio | Read scene/recording status and run chosen creator shortcuts | Official [remote-control support](https://obsproject.com/kb/remote-control-guide) provides an authenticated WebSocket route. |
| Medium | Discord | Opt-in activity presence and deliberate sharing of selected links | Official [Rich Presence documentation](https://docs.discord.com/developers/platform/rich-presence) supports activity display. Investigate the correct SDK/scopes for this app; keep personal browsing details private by default. |
| Later | Steam | Link an account and open relevant game pages | [Steam OpenID](https://partner.steamgames.com/doc/features/auth?l=english) establishes identity; it is not blanket permission to control purchases or read every private account field. |
| Later — validate demand | Calendar and task apps | Save a page as a task or draft an event | Candidate integration; select providers and verify scopes after user feedback. |

### VRChat and creator checklist

- [ ] Save world links and notes into a gaming workspace; investigate supported launch/join links.
- [ ] Add opt-in local OSC connection status, avatar-parameter inspection and explicitly selected controls.
- [ ] Stop/reset held inputs when a task stops or connection fails.
- [ ] Prototype an accessible desktop control panel before investigating a VR overlay.
- [ ] Investigate social features, login requirements and permitted access separately; do not assume a general official VRChat account API.
- [ ] Add OBS connection/status and scene switching; request clear user intent before starting a broadcast or recording.
- [ ] Add privacy-preserving Discord presence with a simple off switch.

### Browser task checklist

- [x] Add the main-document browser action foundation: navigate, inspect, click, type, select and scroll with a virtual pointer marker.
- [ ] Reuse logged-in sessions and detect account controls anywhere on the page. An avatar alone is insufficient proof.
- [x] Represent main-document sign-in evidence as signed-in, signed-out or uncertain for the planner.
- [ ] Pause for credentials, MFA, CAPTCHA or account choice, then resume without repeating completed submissions.
- [x] Bind each task to its tab and pause on tab changes/closure.
- [ ] Add profile selection and persisted task recovery.
- [ ] Provide progress, stop, reviewable sensitive actions and evidence of completion.
- [ ] For Epic, distinguish free-to-play listings from claimable giveaways, check eligibility and final zero total, then verify ownership.
- [ ] Treat page content as untrusted data and enforce permissions in the host application.

## CLI and online features

The CLI means terminal access to Nyakitsu's browser/task features. General shell execution is a separate capability to assess later.

- [ ] CLI: open URLs, search, list tabs and choose a profile.
- [ ] CLI: submit a browser task, inspect progress, stop it and resume after manual login.
- [ ] CLI: export results as readable text or structured JSON, with clear exit codes.
- [ ] CLI: sign in through the supported account flow, inspect connection status and list available providers/models.
- [ ] CLI: use the same task permissions and confirmations as the desktop app; a noninteractive run reports that user action is required.
- [ ] Online companion: view task status and send a task to the user's paired running desktop browser.
- [ ] Document whether the desktop must be running; investigate always-on hosted execution as a separate service, with its own sessions and costs.
- [ ] Optional encrypted sync for bookmarks, workspaces and reading lists, with recovery/export and conflict handling.
- [ ] Optional schedules for giveaway checks or repository updates; configurable notifications only on useful changes.
- [ ] Pair/revoke devices explicitly; never expose an unauthenticated browser-control endpoint to the internet.
- [ ] Add opt-in plugins/MCP only after defining installation trust, permissions and clear removal controls.

## Distinctive ideas to validate

These are recommendations inspired by the needs above, not verified “first-ever” features.

- [ ] A recoverable task workspace combining tabs, source notes, pending approvals and verified results.
- [ ] A per-task context preview showing exactly which pages/files the selected AI provider will receive.
- [ ] Local history search for remembered topics, with exclusions, retention controls and complete deletion.
- [ ] Reusable task recipes such as “research this repo” and “check this week's free games,” with an inspectable action history.
- [ ] Optional creator mode combining a VRChat workspace, OBS status and Discord presence controls.

## Validation before committing releases

- [ ] Ask prospective users to rank these concrete workflows; separate general browsing, developer and VR/creator needs.
- [ ] Collect named extensions users rely on, and test those before promising compatibility.
- [ ] Test the key login states: already signed in, signed out, uncertain, expired, multiple accounts and challenge screens.
- [ ] Verify stop behavior, duplicate-submit prevention, unexpected navigation and recovery after failure.
- [ ] Recheck linked platform documentation and forum status when work starts; record which requests are already solved elsewhere.
