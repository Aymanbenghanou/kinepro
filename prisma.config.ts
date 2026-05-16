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
    // Used by Prisma Migrate and seed — reads real URL from .env.development.local locally,
    // or from Vercel env vars in production.
    url: process.env.DATABASE_URL,
  },
});
