import { describe, it, expect } from "vitest";
import {
  wildcardWithCredentials,
  missingAllowedHeaders,
  missingPreflightHandling,
  originMismatch,
  postmanVsBrowser,
  missingVaryOrigin,
  missingMaxAge,
  duplicateOriginHeader,
} from "../src/rules";
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
    vary: [],
    status: 200,
    ...overrides,
  };
}

describe("wildcardWithCredentials", () => {
  it("warns when origin is * and credentials are true", () => {
    const result = wildcardWithCredentials(
      makeReq(),
      makeRes({ allowOrigin: "*", allowCredentials: true })
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("wildcard-with-credentials");
    expect(result!.severity).toBe("error");
  });

  it("returns null when origin is * but no credentials", () => {
    const result = wildcardWithCredentials(
      makeReq(),
      makeRes({ allowOrigin: "*", allowCredentials: false })
    );
    expect(result).toBeNull();
  });

  it("returns null when credentials are true but origin is specific", () => {
    const result = wildcardWithCredentials(
      makeReq(),
      makeRes({ allowOrigin: "https://app.test", allowCredentials: true })
    );
    expect(result).toBeNull();
  });
});

describe("missingAllowedHeaders", () => {
  it("warns when requested headers are not allowed", () => {
    const result = missingAllowedHeaders(
      makeReq({ requestedHeaders: ["authorization", "content-type"] }),
      makeRes({ allowHeaders: ["content-type"] })
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("missing-allowed-headers");
    expect(result!.explanation).toContain("authorization");
  });

  it("returns null when all headers are allowed", () => {
    const result = missingAllowedHeaders(
      makeReq({ requestedHeaders: ["authorization"] }),
      makeRes({ allowHeaders: ["authorization"] })
    );
    expect(result).toBeNull();
  });

  it("returns null when no headers are requested", () => {
    const result = missingAllowedHeaders(
      makeReq({ requestedHeaders: [] }),
      makeRes()
    );
    expect(result).toBeNull();
  });

  it("returns null when server allows wildcard *", () => {
    const result = missingAllowedHeaders(
      makeReq({ requestedHeaders: ["authorization", "x-custom"] }),
      makeRes({ allowHeaders: ["*"] })
    );
    expect(result).toBeNull();
  });
});

describe("missingPreflightHandling", () => {
  it("warns when preflight returns non-2xx status", () => {
    const result = missingPreflightHandling(
      makeReq({ isPreflight: true, requestedMethod: "PUT" }),
      makeRes({ status: 404 })
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("missing-preflight-handling");
  });

  it("warns when preflight has no allow-origin", () => {
    const result = missingPreflightHandling(
      makeReq({ isPreflight: true, requestedMethod: "PUT" }),
      makeRes({ allowOrigin: null })
    );
    expect(result).not.toBeNull();
  });

  it("returns null for successful preflight", () => {
    const result = missingPreflightHandling(
      makeReq({ isPreflight: true, requestedMethod: "PUT" }),
      makeRes({ status: 204, allowOrigin: "https://app.test" })
    );
    expect(result).toBeNull();
  });

  it("returns null for non-preflight requests", () => {
    const result = missingPreflightHandling(
      makeReq({ isPreflight: false }),
      makeRes({ status: 404, allowOrigin: null })
    );
    expect(result).toBeNull();
  });
});

describe("originMismatch", () => {
  it("warns when origin does not match allow-origin", () => {
    const result = originMismatch(
      makeReq({ origin: "https://app.test" }),
      makeRes({ allowOrigin: "https://other.test" })
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("origin-mismatch");
  });

  it("returns null when origins match", () => {
    const result = originMismatch(
      makeReq({ origin: "https://app.test" }),
      makeRes({ allowOrigin: "https://app.test" })
    );
    expect(result).toBeNull();
  });

  it("returns null when allow-origin is wildcard", () => {
    const result = originMismatch(
      makeReq({ origin: "https://app.test" }),
      makeRes({ allowOrigin: "*" })
    );
    expect(result).toBeNull();
  });

  it("returns null when no origin in request", () => {
    const result = originMismatch(
      makeReq({ origin: null }),
      makeRes({ allowOrigin: "https://app.test" })
    );
    expect(result).toBeNull();
  });
});

describe("postmanVsBrowser", () => {
  it("warns when cross-origin request has no allow-origin", () => {
    const result = postmanVsBrowser(
      makeReq({ origin: "https://app.test" }),
      makeRes({ allowOrigin: null })
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("postman-vs-browser");
    expect(result!.severity).toBe("info");
  });

  it("returns null when allow-origin is present", () => {
    const result = postmanVsBrowser(
      makeReq({ origin: "https://app.test" }),
      makeRes({ allowOrigin: "https://app.test" })
    );
    expect(result).toBeNull();
  });

  it("returns null when no origin (same-origin request)", () => {
    const result = postmanVsBrowser(
      makeReq({ origin: null }),
      makeRes({ allowOrigin: null })
    );
    expect(result).toBeNull();
  });

  it("returns null for preflight requests", () => {
    const result = postmanVsBrowser(
      makeReq({ origin: "https://app.test", isPreflight: true }),
      makeRes({ allowOrigin: null })
    );
    expect(result).toBeNull();
  });
});

describe("missingVaryOrigin", () => {
  it("warns when dynamic origin is set without Vary: Origin", () => {
    const result = missingVaryOrigin(
      makeReq(),
      makeRes({ allowOrigin: "https://app.test", vary: [] })
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("missing-vary-origin");
    expect(result!.severity).toBe("warn");
  });

  it("returns null when Vary includes Origin", () => {
    const result = missingVaryOrigin(
      makeReq(),
      makeRes({ allowOrigin: "https://app.test", vary: ["origin"] })
    );
    expect(result).toBeNull();
  });

  it("returns null when allow-origin is wildcard", () => {
    const result = missingVaryOrigin(
      makeReq(),
      makeRes({ allowOrigin: "*", vary: [] })
    );
    expect(result).toBeNull();
  });

  it("returns null when no allow-origin is set", () => {
    const result = missingVaryOrigin(
      makeReq(),
      makeRes({ allowOrigin: null, vary: [] })
    );
    expect(result).toBeNull();
  });
});

describe("missingMaxAge", () => {
  it("warns when preflight has no max-age", () => {
    const result = missingMaxAge(
      makeReq({ isPreflight: true, requestedMethod: "PUT" }),
      makeRes({ maxAge: null })
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("missing-max-age");
    expect(result!.severity).toBe("warn");
  });

  it("warns when max-age is 0", () => {
    const result = missingMaxAge(
      makeReq({ isPreflight: true, requestedMethod: "PUT" }),
      makeRes({ maxAge: 0 })
    );
    expect(result).not.toBeNull();
    expect(result!.issue).toContain("set to 0");
  });

  it("returns null when max-age is positive", () => {
    const result = missingMaxAge(
      makeReq({ isPreflight: true, requestedMethod: "PUT" }),
      makeRes({ maxAge: 86400 })
    );
    expect(result).toBeNull();
  });

  it("returns null for non-preflight requests", () => {
    const result = missingMaxAge(
      makeReq({ isPreflight: false }),
      makeRes({ maxAge: null })
    );
    expect(result).toBeNull();
  });
});

describe("duplicateOriginHeader", () => {
  it("warns when allow-origin is set multiple times", () => {
    const result = duplicateOriginHeader(
      makeReq(),
      makeRes({ allowOriginCount: 2 })
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("duplicate-origin-header");
    expect(result!.severity).toBe("error");
    expect(result!.issue).toContain("2 times");
  });

  it("returns null when allow-origin is set once", () => {
    const result = duplicateOriginHeader(
      makeReq(),
      makeRes({ allowOriginCount: 1 })
    );
    expect(result).toBeNull();
  });

  it("returns null when allow-origin is not set", () => {
    const result = duplicateOriginHeader(
      makeReq(),
      makeRes({ allowOriginCount: 0 })
    );
    expect(result).toBeNull();
  });
});
