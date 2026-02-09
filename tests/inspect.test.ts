import { describe, it, expect } from "vitest";
import { extractCorsResponseInfo } from "../src/inspect";
import { ServerResponse, IncomingMessage } from "http";
import { Socket } from "net";

function mockRes(headers: Record<string, string> = {}, status = 200): ServerResponse {
  const req = new IncomingMessage(new Socket());
  const res = new ServerResponse(req);
  res.statusCode = status;
  for (const [k, v] of Object.entries(headers)) {
    res.setHeader(k, v);
  }
  return res;
}

describe("extractCorsResponseInfo", () => {
  it("extracts all CORS headers", () => {
    const res = mockRes({
      "Access-Control-Allow-Origin": "https://app.test",
      "Access-Control-Allow-Methods": "GET, POST",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    });
    const info = extractCorsResponseInfo(res);
    expect(info.allowOrigin).toBe("https://app.test");
    expect(info.allowOriginCount).toBe(1);
    expect(info.allowMethods).toEqual(["get", "post"]);
    expect(info.allowHeaders).toEqual(["authorization", "content-type"]);
    expect(info.allowCredentials).toBe(true);
    expect(info.maxAge).toBe(86400);
    expect(info.vary).toEqual(["origin"]);
    expect(info.status).toBe(200);
  });

  it("returns null for missing headers", () => {
    const res = mockRes({});
    const info = extractCorsResponseInfo(res);
    expect(info.allowOrigin).toBeNull();
    expect(info.allowOriginCount).toBe(0);
    expect(info.allowMethods).toEqual([]);
    expect(info.allowHeaders).toEqual([]);
    expect(info.allowCredentials).toBe(false);
    expect(info.maxAge).toBeNull();
  });

  it("captures status code", () => {
    const res = mockRes({}, 404);
    const info = extractCorsResponseInfo(res);
    expect(info.status).toBe(404);
  });

  it("detects duplicate allow-origin headers", () => {
    const req = new IncomingMessage(new Socket());
    const res = new ServerResponse(req);
    res.statusCode = 200;
    // Simulate duplicate headers via appendHeader-like behavior
    res.setHeader("Access-Control-Allow-Origin", ["https://a.test", "https://b.test"]);
    const info = extractCorsResponseInfo(res);
    expect(info.allowOriginCount).toBe(2);
  });

  it("parses max-age correctly", () => {
    const res = mockRes({ "Access-Control-Max-Age": "3600" });
    const info = extractCorsResponseInfo(res);
    expect(info.maxAge).toBe(3600);
  });

  it("returns null max-age for invalid value", () => {
    const res = mockRes({ "Access-Control-Max-Age": "abc" });
    const info = extractCorsResponseInfo(res);
    expect(info.maxAge).toBeNull();
  });
});
