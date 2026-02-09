# cors-doctor

[![npm version](https://img.shields.io/npm/v/cors-doctor.svg)](https://www.npmjs.com/package/cors-doctor)
[![license](https://img.shields.io/npm/l/cors-doctor.svg)](https://github.com/your-username/cors-doctor/blob/main/LICENSE)

**Dev-only CORS diagnostic middleware for Node.js.** It observes your CORS request/response pairs and emits human-readable warnings explaining **why** browser CORS requests fail and **how** to fix them.

> "It works in Postman but not the browser" — cors-doctor explains exactly why.

**cors-doctor does not replace CORS middleware.** It works alongside your existing setup (e.g. the `cors` package) and never modifies headers or enforces policies.

## Why?

Browsers enforce CORS, but:

- Error messages are cryptic and hard to understand
- CORS configs can be silently invalid
- Postman works but browsers fail, and developers don't know why
- Developers guess headers blindly hoping something sticks

**cors-doctor** turns CORS failures into actionable, human-readable explanations with suggested fixes.

## Install

```bash
npm install cors-doctor --save-dev
```

## Quick Start

```js
import { corsDoctor } from "cors-doctor";
import cors from "cors";
import express from "express";

const app = express();

// Add cors-doctor BEFORE your CORS middleware
app.use(corsDoctor({ logLevel: "warn" }));
app.use(cors({ origin: "*" }));

app.get("/api/data", (req, res) => {
  res.json({ hello: "world" });
});

app.listen(3000);
```

That's it. cors-doctor will log warnings to the console whenever it detects a CORS misconfiguration.

## Options

| Option     | Type                                       | Default  | Description                       |
|------------|--------------------------------------------|----------|-----------------------------------|
| `mode`     | `"dev"`                                    | `"dev"`  | Reserved for future use           |
| `logLevel` | `"error" \| "warn" \| "info" \| "silent"` | `"warn"` | Minimum severity level to display |

## What It Detects

cors-doctor runs **8 diagnostic rules** against every cross-origin request:

| # | Rule | Severity | What it catches |
|---|------|----------|-----------------|
| 1 | `wildcard-with-credentials` | error | `Access-Control-Allow-Origin: *` combined with `Access-Control-Allow-Credentials: true` — browsers reject this |
| 2 | `missing-allowed-headers` | error | Browser requests headers (e.g. `Authorization`) that the server doesn't include in `Access-Control-Allow-Headers` |
| 3 | `missing-preflight-handling` | error | Server returns non-2xx or no CORS headers for OPTIONS preflight requests |
| 4 | `origin-mismatch` | error | Request `Origin` doesn't match `Access-Control-Allow-Origin` |
| 5 | `postman-vs-browser` | info | Response has no `Access-Control-Allow-Origin` at all — works in Postman/cURL but fails in browsers |
| 6 | `missing-vary-origin` | warn | Dynamic origin set without `Vary: Origin` — causes cache poisoning with CDNs/proxies |
| 7 | `missing-max-age` | warn | Preflight response lacks `Access-Control-Max-Age`, causing double round-trips on every request |
| 8 | `duplicate-origin-header` | error | `Access-Control-Allow-Origin` set multiple times (e.g. nginx + app both adding it) — browsers reject this |

## Example Output

Each warning includes the request method and URL so you know exactly which endpoint triggered it:

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

```
⚠️  CORS Doctor [missing-vary-origin] on GET /api/data

  Issue:
    Server sets a dynamic Access-Control-Allow-Origin but does not include Vary: Origin.

  Why this fails:
    Without Vary: Origin, intermediate caches (CDNs, proxies) may serve a
    response cached for one origin to a different origin, causing CORS failures.

  Fix:
    Add "Vary: Origin" to the response headers.
```

## Shutdown Summary

When the process exits, cors-doctor prints a summary of everything it observed:

```
============================================================
  CORS Doctor Summary
============================================================

  Requests analyzed: 42
  Requests with issues: 7

  Issues by rule:
    wildcard-with-credentials: 4
    missing-vary-origin: 2
    origin-mismatch: 1

============================================================
```

## Common CORS Mistakes

### "It works in Postman but not the browser"

Postman and cURL don't enforce CORS — they ignore `Access-Control-*` headers entirely. Browsers enforce CORS on every cross-origin request. If your API works in Postman but fails in the browser, you're missing CORS headers. cors-doctor's `postman-vs-browser` rule catches this.

### Wildcard origin with credentials

Setting `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` is explicitly forbidden by the CORS spec. You must respond with the exact requesting origin instead of `*` when credentials are involved.

### Forgetting to handle OPTIONS

Browsers send a preflight `OPTIONS` request before non-simple cross-origin requests. If your server doesn't handle `OPTIONS` (returns 404 or no CORS headers), the actual request never fires. This is the most common cause of "CORS blocked" errors in development.

### Duplicate CORS headers from proxy + app

When nginx (or another reverse proxy) and your application both add `Access-Control-Allow-Origin`, the header appears twice. Browsers reject responses with multiple values for this header. Only one layer should set CORS headers.

### Missing `Vary: Origin`

If you dynamically set `Access-Control-Allow-Origin` based on the request origin, you **must** also set `Vary: Origin`. Otherwise, CDNs and browser caches may serve a response cached for `https://a.com` to `https://b.com`, breaking CORS.

## API

### `corsDoctor(options?)`

Returns Express/Fastify-compatible middleware `(req, res, next)`.

### `extractCorsRequestInfo(req)`

Extracts CORS-relevant info from an `IncomingMessage`. Returns `CorsRequestInfo`.

### `extractCorsResponseInfo(res)`

Extracts CORS response headers from a `ServerResponse`. Returns `CorsResponseInfo`.

### `validateCors(reqInfo, resInfo, rules?)`

Runs all rules (or a custom array of rules) against request/response info. Returns `CorsWarning[]`.

### `allRules`

The default array of 8 rule functions. Each rule has the signature:

```ts
(req: CorsRequestInfo, res: CorsResponseInfo) => CorsWarning | null
```

### `formatWarnings(warnings, requestLabel?)`

Formats an array of `CorsWarning` objects into styled console output.

### `formatSummary(stats)`

Formats a `SummaryStats` object into a summary report string.

## Compatibility

- **Node.js** >= 18
- **Express** 4.x / 5.x
- **Fastify** (via `.use()` with `@fastify/middie` or `@fastify/express`)
- **Any framework** using standard `(req, res, next)` middleware

## License

MIT
