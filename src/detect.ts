import type { IncomingMessage } from "http";
import type { CorsRequestInfo } from "./types";

export function detectPreflight(req: IncomingMessage): boolean {
  return (
    req.method?.toUpperCase() === "OPTIONS" &&
    !!req.headers["access-control-request-method"]
  );
}

export function extractCorsRequestInfo(req: IncomingMessage): CorsRequestInfo {
  const origin = (req.headers["origin"] as string) || null;
  const method = req.method?.toUpperCase() || "GET";
  const url = req.url || "/";
  const isPreflight = detectPreflight(req);

  const requestedMethod =
    (req.headers["access-control-request-method"] as string) || null;

  const rawRequestedHeaders =
    (req.headers["access-control-request-headers"] as string) || "";
  const requestedHeaders = rawRequestedHeaders
    ? rawRequestedHeaders.split(",").map((h) => h.trim().toLowerCase())
    : [];

  const hasCredentials =
    !!req.headers["cookie"] || !!req.headers["authorization"];

  return {
    origin,
    method,
    url,
    isPreflight,
    requestedMethod,
    requestedHeaders,
    hasCredentials,
  };
}
