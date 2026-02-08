# cors-doctor

Dev-only CORS diagnostic middleware for Node.js. It observes your CORS request/response pairs and emits human-readable warnings explaining **why** browser CORS requests fail and **how** to fix them.

**cors-doctor does not replace CORS middleware.** It works alongside your existing setup (e.g. the `cors` package) and never modifies headers or enforces policies.

## Install

```bash
npm install cors-doctor --save-dev
```

## Usage

```js
import { corsDoctor } from "cors-doctor";

// Add before your CORS middleware
app.use(corsDoctor({ logLevel: "warn" }));
app.use(cors({ origin: "*" }));
```

### Options

| Option     | Type                                    | Default  | Description                       |
|------------|-----------------------------------------|----------|-----------------------------------|
| `mode`     | `"dev"`                                 | `"dev"`  | Reserved for future use           |
| `logLevel` | `"error" \| "warn" \| "info" \| "silent"` | `"warn"` | Minimum severity level to display |

## What It Detects

### 1. Wildcard Origin + Credentials

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```

Browsers block credentials (cookies, Authorization) when the origin is `*`. Fix: respond with the exact requesting origin.

### 2. Missing Allowed Headers

The browser's preflight requests specific headers (e.g. `Authorization`), but the server's `Access-Control-Allow-Headers` doesn't include them. cors-doctor tells you exactly which headers are missing.

### 3. Missing Preflight (OPTIONS) Handling

The server returns a non-2xx status or no CORS headers for OPTIONS requests. The browser sends a preflight before the actual request and blocks if it fails.

### 4. Origin Mismatch

The request `Origin` doesn't match `Access-Control-Allow-Origin`. Fix: dynamically set the allowed origin from a validated allowlist and set `Vary: Origin`.

### 5. Postman vs Browser

The response has no `Access-Control-Allow-Origin` at all. Tools like Postman ignore CORS, but browsers enforce it. This explains why "it works in Postman but not the browser."

## Example Output

```
❌  CORS Doctor [wildcard-with-credentials]

  Issue:
    Browser sent credentials but server responded with wildcard origin "*".

  Why this fails:
    Browsers forbid credentials (cookies, Authorization header) when
    Access-Control-Allow-Origin is "*". The request will be blocked.

  Fix:
    Replace "*" with the exact origin: "https://app.example.com".
```

## API

### `corsDoctor(options?)`

Returns Express/Fastify-compatible middleware `(req, res, next)`.

### `extractCorsRequestInfo(req)`

Extracts CORS-relevant info from an `IncomingMessage`.

### `extractCorsResponseInfo(res)`

Extracts CORS response headers from a `ServerResponse`.

### `validateCors(reqInfo, resInfo, rules?)`

Runs all rules (or custom rules) against request/response info. Returns `CorsWarning[]`.

### `allRules`

The default array of rule functions. Each rule has the signature:
`(req: CorsRequestInfo, res: CorsResponseInfo) => CorsWarning | null`

## License

MIT
