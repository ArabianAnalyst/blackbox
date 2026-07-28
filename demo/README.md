# blackbox demo

A single self-contained HTML page. No build step, no dependencies, no network calls. It runs the real SHA-256 hash chain through the browser's own `crypto.subtle`, hashing the same fields as `hashRecord()` in the package, so when it says the chain broke, it broke.

- **Live:** [arabiananalyst.github.io/blackbox/demo](https://arabiananalyst.github.io/blackbox/demo/)
- **Or open it locally:** open [`index.html`](index.html) in any browser.

Record actions, click any cost or action to alter one, then press Verify chain. The edit stays hidden until you run the check, exactly like a real log. `verify()` then breaks at that record, dims everything after it, and names the exact point. Click the value again to restore.
