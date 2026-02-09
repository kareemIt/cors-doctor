import type { CorsWarning } from "./types";

const SEVERITY_ICON: Record<CorsWarning["severity"], string> = {
  error: "\u274C",
  warn: "\u26A0\uFE0F",
  info: "\u2139\uFE0F",
};

function formatWarning(warning: CorsWarning, request?: string): string {
  const icon = SEVERITY_ICON[warning.severity];
  const header = request
    ? `${icon}  CORS Doctor [${warning.rule}] on ${request}`
    : `${icon}  CORS Doctor [${warning.rule}]`;
  const lines = [
    "",
    header,
    "",
    `  Issue:`,
    `    ${warning.issue}`,
    "",
    `  Why this fails:`,
    `    ${warning.explanation}`,
    "",
    `  Fix:`,
    `    ${warning.fix}`,
    "",
  ];
  return lines.join("\n");
}

export function formatWarnings(
  warnings: CorsWarning[],
  request?: string
): string {
  if (warnings.length === 0) return "";
  return warnings
    .map((w) => formatWarning(w, request))
    .join("\n" + "-".repeat(60) + "\n");
}

export interface SummaryStats {
  totalRequests: number;
  issueCount: number;
  ruleHits: Record<string, number>;
}

export function formatSummary(stats: SummaryStats): string {
  const lines = [
    "",
    "=".repeat(60),
    "  CORS Doctor Summary",
    "=".repeat(60),
    "",
    `  Requests analyzed: ${stats.totalRequests}`,
    `  Requests with issues: ${stats.issueCount}`,
  ];

  const entries = Object.entries(stats.ruleHits);
  if (entries.length > 0) {
    lines.push("");
    lines.push("  Issues by rule:");
    for (const [rule, count] of entries.sort((a, b) => b[1] - a[1])) {
      lines.push(`    ${rule}: ${count}`);
    }
  } else {
    lines.push("");
    lines.push("  No CORS issues detected.");
  }

  lines.push("");
  lines.push("=".repeat(60));
  lines.push("");
  return lines.join("\n");
}
