import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? null;
}

export function hasDatabaseUrl() {
  return Boolean(getDatabaseUrl());
}

export function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL 또는 NEON_DATABASE_URL이 설정되지 않았습니다.",
    );
  }

  cachedDb = drizzle(neon(databaseUrl));
  return cachedDb;
}

export async function getDatabaseHealth() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return {
      configured: false,
      connected: false,
      provider: "neon",
    } as const;
  }

  try {
    const db = getDb();
    await db.execute(sql`select 1 as ok`);

    return {
      configured: true,
      connected: true,
      provider: "neon",
    } as const;
  } catch (error) {
    return {
      configured: true,
      connected: false,
      provider: "neon",
      error:
        error instanceof Error ? error.message : "알 수 없는 데이터베이스 오류",
    } as const;
  }
}
