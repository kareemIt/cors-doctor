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

export function extractCorsResponseInfo(res: ServerResponse): CorsResponseInfo {
  const allowOrigin = getHeader(res, "access-control-allow-origin");
  const allowMethods = parseList(
    getHeader(res, "access-control-allow-methods")
  );
  const allowHeaders = parseList(
    getHeader(res, "access-control-allow-headers")
  );
  const allowCredentials =
    getHeader(res, "access-control-allow-credentials") === "true";
  const vary = parseList(getHeader(res, "vary"));
  const status = res.statusCode;

  return {
    allowOrigin,
    allowMethods,
    allowHeaders,
    allowCredentials,
    vary,
    status,
  };
}
