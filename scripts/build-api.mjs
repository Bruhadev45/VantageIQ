// Bundle the Fastify server (and all its local TS imports) into one ESM file
// so the Vercel serverless function can import it cleanly. Without this, Vercel
// transpiles each server/ + src/ file separately and Node's native ESM loader
// rejects the extensionless relative imports (ERR_MODULE_NOT_FOUND).
//
// npm packages are kept external (packages: "external") so native deps like
// @prisma/client resolve from node_modules and Vercel's tracer includes them.
import { build } from "esbuild";

await build({
  entryPoints: ["server/index.ts"],
  outfile: "server/_bundle/app.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external",
  logLevel: "info",
});

console.log("API bundle written to server/_bundle/app.mjs");
