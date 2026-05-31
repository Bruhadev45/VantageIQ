import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "./db/client";

const JWT_SECRET = process.env.AUTH_JWT_SECRET || "vantageiq-dev-secret-change-me";
const TOKEN_TTL = "7d";

const SignupSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  name: z.string().max(120).optional(),
});

const LoginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

type TokenPayload = { sub: string; email: string };

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

function publicUser(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name };
}

// Mutations require a valid bearer token. Reads (GET), health, auth routes and
// CORS preflight stay open so the shared demo data and SSE/PDF endpoints work.
export function registerAuthGuard(app: FastifyInstance): void {
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    const url = request.raw.url ?? "";
    if (request.method === "OPTIONS") return;
    if (request.method === "GET") return;
    if (url.startsWith("/api/auth") || url === "/api/health") return;

    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      reply.code(401).send({ error: "Authentication required. Please sign in." });
      return reply;
    }
    return undefined;
  });
}

export function registerAuthRoutes(app: FastifyInstance): void {
  app.post("/api/auth/signup", async (request, reply) => {
    const { email, password, name } = SignupSchema.parse(request.body ?? {});
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      reply.code(409);
      return { error: "An account with that email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash, name: name?.trim() || null },
    });

    reply.code(201);
    return { token: signToken({ sub: user.id, email: user.email }), user: publicUser(user) };
  });

  app.post("/api/auth/login", async (request, reply) => {
    const { email, password } = LoginSchema.parse(request.body ?? {});
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      reply.code(401);
      return { error: "Invalid email or password." };
    }

    return { token: signToken({ sub: user.id, email: user.email }), user: publicUser(user) };
  });

  app.get("/api/auth/me", async (request, reply) => {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      reply.code(401);
      return { error: "Not authenticated" };
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      reply.code(401);
      return { error: "Account not found" };
    }
    return { user: publicUser(user) };
  });
}
