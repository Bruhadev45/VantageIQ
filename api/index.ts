import type { IncomingMessage, ServerResponse } from "node:http";
// Import the pre-bundled server (built by scripts/build-api.mjs in postinstall):
// a single ESM file with all local imports inlined, so Node's ESM loader can
// resolve it without per-file extension issues.
// @ts-ignore - generated at build time by scripts/build-api.mjs; no static types.
import { app } from "../server/_bundle/app.mjs";

// Single serverless entry: vercel.json rewrites every /api/* request here, and
// each one is handed to the existing Fastify instance (which registers routes
// under the same /api prefix). req.url is preserved across the rewrite, so the
// one app serves both the local long-running server and Vercel functions.

// Allow long-lived SSE streams up to the Hobby ceiling (60s).
export const maxDuration = 60;

let ready: Promise<unknown> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Fastify must finish plugin/route registration once before serving.
  // .then() normalizes Fastify's PromiseLike into a real Promise.
  if (!ready) ready = app.ready().then(() => undefined);
  await ready;
  app.server.emit("request", req, res);
}
