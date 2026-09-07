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

## Planned before autonomous actions

Nyakitsu must add domain-scoped capabilities and an approval layer before AI can perform sensitive actions such as sending messages, uploading files, deleting data, changing passwords, purchasing items or entering payment information.

## Reporting

Please open a GitHub security advisory rather than a public issue when a vulnerability could expose credentials, browsing data or user accounts.
