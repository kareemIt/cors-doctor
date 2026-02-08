import type { CorsWarning } from "./types";

const SEVERITY_ICON: Record<CorsWarning["severity"], string> = {
  error: "\u274C",
  warn: "\u26A0\uFE0F",
  info: "\u2139\uFE0F",
};

function formatWarning(warning: CorsWarning): string {
  const icon = SEVERITY_ICON[warning.severity];
  const lines = [
    "",
    `${icon}  CORS Doctor [${warning.rule}]`,
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

export function formatWarnings(warnings: CorsWarning[]): string {
  if (warnings.length === 0) return "";
  return warnings.map(formatWarning).join("\n" + "-".repeat(60) + "\n");
}
