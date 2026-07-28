# blackbox demo

A single self-contained HTML page. No build step, no dependencies, no network calls. It runs the real SHA-256 hash chain through the browser's own `crypto.subtle`, hashing the same fields as `hashRecord()` in the package, so when it says the chain broke, it broke.

- **Live:** [arabiananalyst.github.io/blackbox/demo](https://arabiananalyst.github.io/blackbox/demo/)
- **Or open it locally:** open [`index.html`](index.html) in any browser.

Record actions, then click any cost or action to alter it. The chain breaks at that record, everything after it goes untrusted, and `verify()` names the exact point. Click again to restore.
