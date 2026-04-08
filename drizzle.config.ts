import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      process.env.NEON_DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/yseo",
  },
});
