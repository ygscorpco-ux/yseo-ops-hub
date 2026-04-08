import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL이 설정되지 않았습니다. Neon 연결 전에 .env.local을 채워주세요.",
    );
  }

  cachedDb = drizzle(neon(databaseUrl));
  return cachedDb;
}
