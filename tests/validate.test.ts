import { describe, it, expect } from "vitest";
import { validateCors } from "../src/validate";
import type { CorsRequestInfo, CorsResponseInfo } from "../src/types";

function makeReq(overrides: Partial<CorsRequestInfo> = {}): CorsRequestInfo {
  return {
    origin: "https://app.test",
    method: "GET",
    url: "/api/test",
    isPreflight: false,
    requestedMethod: null,
    requestedHeaders: [],
    hasCredentials: false,
    ...overrides,
  };
}

function makeRes(overrides: Partial<CorsResponseInfo> = {}): CorsResponseInfo {
  return {
    allowOrigin: "https://app.test",
    allowOriginCount: 1,
    allowMethods: [],
    allowHeaders: [],
    allowCredentials: false,
    maxAge: null,
    vary: ["origin"],
    status: 200,
    ...overrides,
  };
}

describe("validateCors", () => {
  it("returns no warnings for a correctly configured response", () => {
    const warnings = validateCors(makeReq(), makeRes());
    expect(warnings).toEqual([]);
  });

  it("returns multiple warnings for multiple issues", () => {
    const warnings = validateCors(
      makeReq({
        origin: "https://app.test",
        requestedHeaders: ["authorization"],
      }),
      makeRes({
        allowOrigin: "*",
        allowCredentials: true,
        allowHeaders: [],
      })
    );
    // Should fire: wildcardWithCredentials + missingAllowedHeaders
    expect(warnings.length).toBeGreaterThanOrEqual(2);
    const rules = warnings.map((w) => w.rule);
    expect(rules).toContain("wildcard-with-credentials");
    expect(rules).toContain("missing-allowed-headers");
  });

  it("accepts custom rules", () => {
    const customRule = () => ({
      rule: "custom",
      severity: "warn" as const,
      issue: "Custom issue",
      explanation: "Custom explanation",
      fix: "Custom fix",
    });
    const warnings = validateCors(makeReq(), makeRes(), [customRule]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].rule).toBe("custom");
  });
});
