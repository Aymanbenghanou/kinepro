import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.development.local first (highest priority for local dev),
// then fall back to .env for CI/production where env vars are injected directly.
config({ path: ".env.development.local", override: true });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma Migrate (db push / migrate deploy) must use the DIRECT connection
    // (port 5432, no PgBouncer) — PgBouncer transaction mode doesn't support
    // the DDL statements that migrations issue.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
