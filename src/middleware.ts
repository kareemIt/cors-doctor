import type { IncomingMessage, ServerResponse } from "http";
import type { CorsDoctorOptions, Middleware } from "./types";
import { extractCorsRequestInfo } from "./detect";
import { extractCorsResponseInfo } from "./inspect";
import { validateCors } from "./validate";
import { formatWarnings } from "./format";

type LogFn = (message: string) => void;

function getLogger(
  logLevel: CorsDoctorOptions["logLevel"]
): LogFn | null {
  switch (logLevel) {
    case "silent":
      return null;
    case "error":
      return (msg) => console.error(msg);
    case "info":
      return (msg) => console.info(msg);
    case "warn":
    default:
      return (msg) => console.warn(msg);
  }
}

const SEVERITY_PRIORITY: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
};

const LOG_LEVEL_THRESHOLD: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  silent: -1,
};

export function corsDoctor(options: CorsDoctorOptions = {}): Middleware {
  const logLevel = options.logLevel || "warn";
  const log = getLogger(logLevel);

  return (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
    if (!log) {
      next();
      return;
    }

    const reqInfo = extractCorsRequestInfo(req);

    // Only analyze cross-origin requests
    if (!reqInfo.origin) {
      next();
      return;
    }

    // Hook into writeHead to capture headers before they're sent
    const originalWriteHead = res.writeHead;
    res.writeHead = function (...args: Parameters<typeof res.writeHead>) {
      const resInfo = extractCorsResponseInfo(res);
      const warnings = validateCors(reqInfo, resInfo);

      // Filter by log level threshold
      const threshold = LOG_LEVEL_THRESHOLD[logLevel];
      const filtered = warnings.filter(
        (w) => SEVERITY_PRIORITY[w.severity] <= threshold
      );

      if (filtered.length > 0) {
        const output = formatWarnings(filtered);
        log(output);
      }

      return originalWriteHead.apply(res, args);
    } as typeof res.writeHead;

    next();
  };
}
