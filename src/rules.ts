import type { CorsRule, CorsWarning, CorsRequestInfo, CorsResponseInfo } from "./types";

export const wildcardWithCredentials: CorsRule = (req, res) => {
  if (res.allowOrigin === "*" && res.allowCredentials) {
    return {
      rule: "wildcard-with-credentials",
      severity: "error",
      issue:
        "Browser sent credentials but server responded with wildcard origin \"*\".",
      explanation:
        "Browsers forbid credentials (cookies, Authorization header) when " +
        "Access-Control-Allow-Origin is \"*\". The request will be blocked.",
      fix: req.origin
        ? `Replace \"*\" with the exact origin: \"${req.origin}\".`
        : "Replace \"*\" with the requesting origin dynamically.",
    };
  }
  return null;
};

export const missingAllowedHeaders: CorsRule = (req, res) => {
  if (req.requestedHeaders.length === 0) return null;

  const allowed = new Set(res.allowHeaders.map((h) => h.toLowerCase()));
  // If server allows *, all headers are permitted
  if (allowed.has("*")) return null;

  const missing = req.requestedHeaders.filter((h) => !allowed.has(h));
  if (missing.length === 0) return null;

  return {
    rule: "missing-allowed-headers",
    severity: "error",
    issue: `Browser requested headers [${req.requestedHeaders.join(", ")}] but server only allows [${res.allowHeaders.join(", ") || "none"}].`,
    explanation:
      `The following headers are missing from Access-Control-Allow-Headers: ${missing.join(", ")}. ` +
      "The browser will block the request.",
    fix: `Add the missing headers to Access-Control-Allow-Headers: "${[...res.allowHeaders, ...missing].join(", ")}".`,
  };
};

export const missingPreflightHandling: CorsRule = (req, res) => {
  if (!req.isPreflight) return null;

  const statusOk = res.status >= 200 && res.status < 300;
  if (statusOk && res.allowOrigin) return null;

  const issues: string[] = [];
  if (!statusOk) {
    issues.push(`Preflight returned status ${res.status} (expected 2xx).`);
  }
  if (!res.allowOrigin) {
    issues.push("No Access-Control-Allow-Origin header in preflight response.");
  }

  return {
    rule: "missing-preflight-handling",
    severity: "error",
    issue: issues.join(" "),
    explanation:
      "The server is not handling the OPTIONS preflight request correctly. " +
      "Browsers send a preflight before the actual request and will block if it fails.",
    fix:
      "Ensure your server responds to OPTIONS requests with status 204 and the appropriate " +
      "CORS headers (Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers).",
  };
};

export const originMismatch: CorsRule = (req, res) => {
  if (!req.origin || !res.allowOrigin) return null;
  if (res.allowOrigin === "*") return null;
  if (req.origin === res.allowOrigin) return null;

  return {
    rule: "origin-mismatch",
    severity: "error",
    issue: `Request origin \"${req.origin}\" does not match Access-Control-Allow-Origin \"${res.allowOrigin}\".`,
    explanation:
      "The browser compares the request's Origin header to the server's " +
      "Access-Control-Allow-Origin value. If they don't match, the response is blocked.",
    fix:
      "Dynamically set Access-Control-Allow-Origin to the requesting origin after " +
      "validating it against an allowlist. Remember to also set Vary: Origin.",
  };
};

export const postmanVsBrowser: CorsRule = (req, res) => {
  if (!req.origin) return null;
  if (req.isPreflight) return null;
  if (res.allowOrigin) return null;

  return {
    rule: "postman-vs-browser",
    severity: "info",
    issue:
      "Response has no Access-Control-Allow-Origin header on a cross-origin request.",
    explanation:
      "Tools like Postman and cURL ignore CORS entirely, so they work fine. " +
      "Browsers enforce CORS and will block this response because it lacks " +
      "the Access-Control-Allow-Origin header.",
    fix:
      "Add CORS headers to the response. Use a CORS middleware (e.g. the \"cors\" npm package) " +
      "to set Access-Control-Allow-Origin and related headers.",
  };
};

export const missingVaryOrigin: CorsRule = (req, res) => {
  if (!res.allowOrigin || res.allowOrigin === "*") return null;
  if (res.vary.includes("origin")) return null;

  return {
    rule: "missing-vary-origin",
    severity: "warn",
    issue:
      "Server sets a dynamic Access-Control-Allow-Origin but does not include Vary: Origin.",
    explanation:
      "Without Vary: Origin, intermediate caches (CDNs, proxies) may serve a response " +
      "cached for one origin to a different origin, causing CORS failures for some users.",
    fix: "Add \"Vary: Origin\" to the response headers.",
  };
};

export const missingMaxAge: CorsRule = (req, res) => {
  if (!req.isPreflight) return null;
  if (res.maxAge != null && res.maxAge > 0) return null;

  return {
    rule: "missing-max-age",
    severity: "warn",
    issue:
      res.maxAge === 0
        ? "Access-Control-Max-Age is set to 0. Preflight results will not be cached."
        : "No Access-Control-Max-Age header on preflight response.",
    explanation:
      "Without preflight caching, the browser sends an extra OPTIONS request before every " +
      "cross-origin request, doubling network round-trips and adding latency.",
    fix:
      "Add \"Access-Control-Max-Age: 86400\" (or another suitable duration in seconds) " +
      "to preflight responses to let browsers cache the result.",
  };
};

export const duplicateOriginHeader: CorsRule = (_req, res) => {
  if (res.allowOriginCount <= 1) return null;

  return {
    rule: "duplicate-origin-header",
    severity: "error",
    issue:
      `Access-Control-Allow-Origin header is set ${res.allowOriginCount} times.`,
    explanation:
      "This usually happens when both a reverse proxy (e.g. nginx) and the application " +
      "set CORS headers independently. Browsers reject responses with multiple " +
      "Access-Control-Allow-Origin values.",
    fix:
      "Ensure only one layer sets CORS headers. Remove the duplicate from either " +
      "the proxy config or the application middleware.",
  };
};

export const allRules: CorsRule[] = [
  wildcardWithCredentials,
  missingAllowedHeaders,
  missingPreflightHandling,
  originMismatch,
  postmanVsBrowser,
  missingVaryOrigin,
  missingMaxAge,
  duplicateOriginHeader,
];
