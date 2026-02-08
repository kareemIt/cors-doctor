import type { IncomingMessage, ServerResponse } from "http";

export interface CorsDoctorOptions {
  mode?: "dev";
  logLevel?: "warn" | "info" | "error" | "silent";
}

export interface CorsRequestInfo {
  origin: string | null;
  method: string;
  url: string;
  isPreflight: boolean;
  requestedMethod: string | null;
  requestedHeaders: string[];
  hasCredentials: boolean;
}

export interface CorsResponseInfo {
  allowOrigin: string | null;
  allowOriginCount: number;
  allowMethods: string[];
  allowHeaders: string[];
  allowCredentials: boolean;
  maxAge: number | null;
  vary: string[];
  status: number;
}

export interface CorsWarning {
  rule: string;
  severity: "warn" | "info" | "error";
  issue: string;
  explanation: string;
  fix: string;
}

export type CorsRule = (
  req: CorsRequestInfo,
  res: CorsResponseInfo
) => CorsWarning | null;

export type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void
) => void;
