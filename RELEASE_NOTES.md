# v0.1.0 — Initial Release

**cors-doctor** is a dev-only CORS diagnostic middleware for Node.js. It sits alongside your existing CORS middleware and explains *why* browser CORS requests fail and *how* to fix them — without modifying any headers.

> "It works in Postman but not the browser" — cors-doctor tells you exactly why.

## Highlights

- **Zero runtime dependencies** — only uses Node.js built-ins
- **Drop-in middleware** — works with Express, Fastify, and any `(req, res, next)` framework
- **8 diagnostic rules** covering the most common CORS misconfigurations
- **Human-readable warnings** with issue, explanation, and suggested fix for every problem
- **Shutdown summary** showing total requests analyzed and issues by rule

## Diagnostic Rules

| Rule | Severity | What it catches |
|------|----------|-----------------|
| `wildcard-with-credentials` | error | `Allow-Origin: *` with `Allow-Credentials: true` — browsers reject this combo |
| `missing-allowed-headers` | error | Browser requests headers the server doesn't whitelist |
| `missing-preflight-handling` | error | Server doesn't handle OPTIONS preflight correctly |
| `origin-mismatch` | error | Request origin doesn't match the allowed origin |
| `postman-vs-browser` | info | No CORS headers at all — explains the Postman vs browser confusion |
| `missing-vary-origin` | warn | Dynamic origin without `Vary: Origin` — causes cache poisoning |
| `missing-max-age` | warn | No preflight caching — doubles round-trips on every request |
| `duplicate-origin-header` | error | `Allow-Origin` set multiple times (e.g. nginx + app) |

## Quick Start

```bash
npm install cors-doctor --save-dev
```

```js
import { corsDoctor } from "cors-doctor";

app.use(corsDoctor({ logLevel: "warn" }));
app.use(cors({ origin: "*" }));
```

## Example Output

```
❌  CORS Doctor [wildcard-with-credentials] on GET /api/users

  Issue:
    Browser sent credentials but server responded with wildcard origin "*".

  Why this fails:
    Browsers forbid credentials (cookies, Authorization header) when
    Access-Control-Allow-Origin is "*". The request will be blocked.

  Fix:
    Replace "*" with the exact origin: "https://app.example.com".
```

## Requirements

- Node.js >= 18
- Works with Express 4.x/5.x, Fastify (via `@fastify/middie`), or any standard middleware framework
