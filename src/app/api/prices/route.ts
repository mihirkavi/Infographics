import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPriceSeries } from "@/lib/marketData";

const querySchema = z.object({
  symbol: z.string().trim().min(1).max(36),
  assetType: z.enum(["stock", "forex", "crypto", "commodity"]),
  range: z.enum(["1m", "5m", "15m", "1h", "1d"]).default("1h"),
  displayName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  footnote: z
    .string()
    .trim()
    .max(400)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      symbol: searchParams.get("symbol"),
      assetType: searchParams.get("assetType"),
      range: searchParams.get("range") ?? "1h",
      displayName: searchParams.get("displayName") ?? undefined,
      footnote: searchParams.get("footnote") ?? undefined
    });

    const series = await getPriceSeries(parsed);
    return NextResponse.json(series, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: error.issues.map((issue) => issue.message)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to load market data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
