import { revalidatePath } from "next/cache";

import { bootstrapStrategyPack } from "@/lib/yseo/strategy";
import type { StrategyBootstrapInput } from "@/lib/yseo/strategy-types";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<StrategyBootstrapInput>;

  if (!payload.customerId) {
    return Response.json({ message: "customerId is required." }, { status: 400 });
  }

  if (!payload.goalProfile || !payload.strategyProfile || !payload.researchSummary) {
    return Response.json(
      { message: "goalProfile, strategyProfile, and researchSummary are required." },
      { status: 400 },
    );
  }

  try {
    const result = await bootstrapStrategyPack({
      customerId: payload.customerId,
      masterCustomerId: payload.masterCustomerId,
      sourceType: payload.sourceType ?? "manual",
      goalProfile: payload.goalProfile,
      strategyProfile: payload.strategyProfile,
      researchSummary: payload.researchSummary,
    });

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath(`/customers/${payload.customerId}`);

    return Response.json({
      status: "ok",
      strategyPack: result.strategyPack,
      alertRules: result.alertRules,
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to bootstrap strategy pack.",
      },
      { status: 500 },
    );
  }
}
