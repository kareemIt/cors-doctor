import { describe, it, expect } from "vitest";
import { formatWarnings, formatSummary } from "../src/format";
import type { CorsWarning } from "../src/types";

const sampleWarning: CorsWarning = {
  rule: "test-rule",
  severity: "error",
  issue: "Test issue",
  explanation: "Test explanation",
  fix: "Test fix",
};

describe("formatWarnings", () => {
  it("returns empty string for no warnings", () => {
    expect(formatWarnings([])).toBe("");
  });

  it("includes rule name in output", () => {
    const output = formatWarnings([sampleWarning]);
    expect(output).toContain("test-rule");
  });

  it("includes request label when provided", () => {
    const output = formatWarnings([sampleWarning], "GET /api/users");
    expect(output).toContain("GET /api/users");
  });

  it("omits request label when not provided", () => {
    const output = formatWarnings([sampleWarning]);
    expect(output).not.toContain(" on ");
  });
});

describe("formatSummary", () => {
  it("formats summary with issues", () => {
    const output = formatSummary({
      totalRequests: 10,
      issueCount: 3,
      ruleHits: {
        "wildcard-with-credentials": 2,
        "origin-mismatch": 1,
      },
    });
    expect(output).toContain("Requests analyzed: 10");
    expect(output).toContain("Requests with issues: 3");
    expect(output).toContain("wildcard-with-credentials: 2");
    expect(output).toContain("origin-mismatch: 1");
  });

  it("formats summary with no issues", () => {
    const output = formatSummary({
      totalRequests: 5,
      issueCount: 0,
      ruleHits: {},
    });
    expect(output).toContain("Requests analyzed: 5");
    expect(output).toContain("No CORS issues detected");
  });

  it("sorts rules by count descending", () => {
    const output = formatSummary({
      totalRequests: 10,
      issueCount: 5,
      ruleHits: {
        "rule-a": 1,
        "rule-b": 3,
        "rule-c": 2,
      },
    });
    const bIndex = output.indexOf("rule-b");
    const cIndex = output.indexOf("rule-c");
    const aIndex = output.indexOf("rule-a");
    expect(bIndex).toBeLessThan(cIndex);
    expect(cIndex).toBeLessThan(aIndex);
  });
});
