import type { IncomingMessage, ServerResponse } from "node:http";
import { app } from "../server/index";

// Catch-all serverless entry: every /api/* request is handed to the existing
// Fastify instance (which registers routes under the same /api prefix), so the
// one app serves both the local long-running server and Vercel functions.

// Allow long-lived SSE streams up to the Hobby ceiling (60s).
export const maxDuration = 60;

let ready: Promise<unknown> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Fastify must finish plugin/route registration once before serving.
  if (!ready) ready = app.ready();
  await ready;
  app.server.emit("request", req, res);
}
