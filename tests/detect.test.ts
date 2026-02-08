import { describe, it, expect } from "vitest";
import { detectPreflight, extractCorsRequestInfo } from "../src/detect";
import { IncomingMessage } from "http";
import { Socket } from "net";

function mockReq(method: string, headers: Record<string, string> = {}): IncomingMessage {
  const req = new IncomingMessage(new Socket());
  req.method = method;
  for (const [k, v] of Object.entries(headers)) {
    req.headers[k.toLowerCase()] = v;
  }
  return req;
}

describe("detectPreflight", () => {
  it("returns true for OPTIONS with Access-Control-Request-Method", () => {
    const req = mockReq("OPTIONS", { "Access-Control-Request-Method": "POST" });
    expect(detectPreflight(req)).toBe(true);
  });

  it("returns false for OPTIONS without Access-Control-Request-Method", () => {
    const req = mockReq("OPTIONS", {});
    expect(detectPreflight(req)).toBe(false);
  });

  it("returns false for non-OPTIONS requests", () => {
    const req = mockReq("POST", { "Access-Control-Request-Method": "POST" });
    expect(detectPreflight(req)).toBe(false);
  });
});

describe("extractCorsRequestInfo", () => {
  it("extracts origin and method", () => {
    const req = mockReq("GET", { Origin: "https://example.com" });
    const info = extractCorsRequestInfo(req);
    expect(info.origin).toBe("https://example.com");
    expect(info.method).toBe("GET");
    expect(info.isPreflight).toBe(false);
  });

  it("extracts preflight headers", () => {
    const req = mockReq("OPTIONS", {
      Origin: "https://app.test",
      "Access-Control-Request-Method": "PUT",
      "Access-Control-Request-Headers": "Authorization, Content-Type",
    });
    const info = extractCorsRequestInfo(req);
    expect(info.isPreflight).toBe(true);
    expect(info.requestedMethod).toBe("PUT");
    expect(info.requestedHeaders).toEqual(["authorization", "content-type"]);
  });

  it("detects credentials from cookie header", () => {
    const req = mockReq("GET", {
      Origin: "https://app.test",
      Cookie: "session=abc",
    });
    const info = extractCorsRequestInfo(req);
    expect(info.hasCredentials).toBe(true);
  });

  it("detects credentials from authorization header", () => {
    const req = mockReq("GET", {
      Origin: "https://app.test",
      Authorization: "Bearer token123",
    });
    const info = extractCorsRequestInfo(req);
    expect(info.hasCredentials).toBe(true);
  });

  it("returns null origin when missing", () => {
    const req = mockReq("GET", {});
    const info = extractCorsRequestInfo(req);
    expect(info.origin).toBeNull();
  });
});
