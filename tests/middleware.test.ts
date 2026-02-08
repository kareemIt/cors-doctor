import { describe, it, expect, vi } from "vitest";
import http from "http";
import { corsDoctor } from "../src/middleware";

function createTestServer(
  options = {},
  handler?: (req: http.IncomingMessage, res: http.ServerResponse) => void
) {
  const middleware = corsDoctor(options);
  const server = http.createServer((req, res) => {
    middleware(req, res, () => {
      if (handler) {
        handler(req, res);
      } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(200);
        res.end("ok");
      }
    });
  });
  return server;
}

function request(
  server: http.Server,
  options: { method?: string; headers?: Record<string, string> }
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      const req = http.request(
        { hostname: "127.0.0.1", port: addr.port, method: options.method || "GET", headers: options.headers || {} },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            server.close();
            resolve({ status: res.statusCode!, body });
          });
        }
      );
      req.on("error", reject);
      req.end();
    });
  });
}

describe("corsDoctor middleware", () => {
  it("passes through without origin header (no warnings)", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const server = createTestServer();
    await request(server, { method: "GET" });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("warns on wildcard origin + credentials", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const server = createTestServer({}, (_req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.writeHead(200);
      res.end("ok");
    });
    await request(server, {
      method: "GET",
      headers: { Origin: "https://app.test" },
    });
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain("wildcard-with-credentials");
    spy.mockRestore();
  });

  it("emits no warnings in silent mode", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const server = createTestServer({ logLevel: "silent" }, (_req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.writeHead(200);
      res.end("ok");
    });
    await request(server, {
      method: "GET",
      headers: { Origin: "https://app.test" },
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("warns on missing preflight handling", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const server = createTestServer({}, (_req, res) => {
      // No CORS headers, 404 status
      res.writeHead(404);
      res.end("not found");
    });
    await request(server, {
      method: "OPTIONS",
      headers: {
        Origin: "https://app.test",
        "Access-Control-Request-Method": "PUT",
      },
    });
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain("missing-preflight-handling");
    spy.mockRestore();
  });
});
