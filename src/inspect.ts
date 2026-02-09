import type { ServerResponse } from "http";
import type { CorsResponseInfo } from "./types";

function getHeader(res: ServerResponse, name: string): string | null {
  const val = res.getHeader(name);
  if (val == null) return null;
  return String(val);
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((s) => s.trim().toLowerCase());
}

function countHeaderValues(res: ServerResponse, name: string): number {
  const raw = res.getHeader(name);
  if (raw == null) return 0;
  if (Array.isArray(raw)) return raw.length;
  return 1;
}

export function extractCorsResponseInfo(res: ServerResponse): CorsResponseInfo {
  const allowOrigin = getHeader(res, "access-control-allow-origin");
  const allowOriginCount = countHeaderValues(res, "access-control-allow-origin");
  const allowMethods = parseList(
    getHeader(res, "access-control-allow-methods")
  );
  const allowHeaders = parseList(
    getHeader(res, "access-control-allow-headers")
  );
  const allowCredentials =
    getHeader(res, "access-control-allow-credentials") === "true";
  const rawMaxAge = getHeader(res, "access-control-max-age");
  const maxAge = rawMaxAge != null ? parseInt(rawMaxAge, 10) : null;
  const vary = parseList(getHeader(res, "vary"));
  const status = res.statusCode;

  return {
    allowOrigin,
    allowOriginCount,
    allowMethods,
    allowHeaders,
    allowCredentials,
    maxAge: maxAge != null && !isNaN(maxAge) ? maxAge : null,
    vary,
    status,
  };
}
