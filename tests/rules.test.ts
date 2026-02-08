import { describe, it, expect } from "vitest";
import {
  wildcardWithCredentials,
  missingAllowedHeaders,
  missingPreflightHandling,
  originMismatch,
  postmanVsBrowser,
} from "../src/rules";
import type { CorsRequestInfo, CorsResponseInfo } from "../src/types";

function makeReq(overrides: Partial<CorsRequestInfo> = {}): CorsRequestInfo {
  return {
    origin: "https://app.test",
    method: "GET",
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
    allowMethods: [],
    allowHeaders: [],
    allowCredentials: false,
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
