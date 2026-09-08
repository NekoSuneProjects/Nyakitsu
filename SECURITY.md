# Nyakitsu Security

Nyakitsu is an early alpha and its AI agent capabilities are intentionally restricted.

## Current protections

- Remote pages use sandboxed `WebContentsView` instances.
- `nodeIntegration` is disabled for both browser chrome and remote pages.
- `contextIsolation` is enabled.
- Provider API calls execute in Electron's main process.
- Provider keys are never injected into remote page JavaScript.
- Saved API keys use Electron `safeStorage` when encryption is available.
- Permission requests from websites are denied by default in the alpha.
- Unknown non-HTTP navigation schemes are blocked from web tabs.

## Browser task boundaries

- All privileged requests validate the trusted browser chrome and its main frame.
- Task access is granted per site for the current task. Buttons and form changes require a concrete approval; normal links may proceed within authorized sites.
- Actions use an isolated-world observation, verify target identity and reject covered/stale controls. Model output cannot supply arbitrary JavaScript or shell commands.
- Password, security-code and file fields require manual entry; do not expose cookie stores or field values to the planner.
- Each run is bounded to 30 steps. Stop aborts planning and loading; changing/closing the bound tab pauses the task.
- Page content is supplied as untrusted data. These controls reduce risk but do not prove that model judgments about login, prices or transaction completion are correct.
- Codex runs in a dedicated account directory with browser/computer/shell tools disabled for model planning. Credentials are handled by its official authentication flow, not by website code.
- The current implementation does not offer an unattended purchase/claim guarantee or general upload/download automation. Live transactional workflows need further validation.

## Remaining work

Persistent Read / Control / Block site policies, stronger defenses against malicious page content, comprehensive transaction verification, richer field classification and safe download/upload handling remain on the roadmap.

## Reporting

Please open a GitHub security advisory rather than a public issue when a vulnerability could expose credentials, browsing data or user accounts.
