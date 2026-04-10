import "server-only";

import { runNaverSearchAdSync } from "@/lib/yseo/naver-sync";
import { runSearchConsoleAutoSync } from "@/lib/yseo/search-console-sync";

export async function runUnifiedSync(input?: {
  customerId?: string;
  channel?: "naver-searchad" | "search-console" | "all";
}) {
  const channel = input?.channel ?? "all";
  const results: Array<Record<string, unknown>> = [];

  if (channel === "all" || channel === "naver-searchad") {
    results.push({
      channel: "naver-searchad",
      ...(await runNaverSearchAdSync()),
    });
  }

  if (channel === "all" || channel === "search-console") {
    results.push({
      channel: "search-console",
      ...(await runSearchConsoleAutoSync({ customerId: input?.customerId })),
    });
  }

  return {
    ok: results.every((result) => result.ok !== false),
    results,
  };
}
