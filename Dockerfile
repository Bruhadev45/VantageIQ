# Fly.io image for the VantageIQ API (Fastify + Prisma, run via tsx).
# Why a Dockerfile and not a buildpack: we need precise control over the
# Prisma client generation step and the puppeteer-without-Chromium trick below.
FROM node:20-slim

WORKDIR /app

# Install the puppeteer JS package WITHOUT its ~150MB bundled Chromium.
# pdfGenerator.ts imports puppeteer at module load, so the package must exist
# for the server to boot — but PDF export OOMs on small instances anyway, so we
# skip the browser binary and let that one route fail gracefully at runtime.
ENV PUPPETEER_SKIP_DOWNLOAD=1

# Install dependencies first for better layer caching. --include=dev because
# puppeteer (and the type packages) live in devDependencies.
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Generate the Prisma client before copying the rest of the source.
COPY prisma ./prisma
RUN npx prisma generate

# Application source (server/ imports from src/, so both are needed).
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["npx", "tsx", "server/index.ts"]
