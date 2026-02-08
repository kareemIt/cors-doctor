import type { CorsRequestInfo, CorsResponseInfo, CorsWarning, CorsRule } from "./types";
import { allRules } from "./rules";

export function validateCors(
  reqInfo: CorsRequestInfo,
  resInfo: CorsResponseInfo,
  rules: CorsRule[] = allRules
): CorsWarning[] {
  const warnings: CorsWarning[] = [];
  for (const rule of rules) {
    const warning = rule(reqInfo, resInfo);
    if (warning) {
      warnings.push(warning);
    }
  }
  return warnings;
}
