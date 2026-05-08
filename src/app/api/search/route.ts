import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { unifiedSearch } from "@/lib/unifiedSearch";

const querySchema = z.object({
  q: z.string().trim().min(1).max(80)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { q } = querySchema.parse({ q: searchParams.get("q") ?? "" });
    const hits = await unifiedSearch(q);
    return NextResponse.json({ hits }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid search",
          details: error.issues.map((issue) => issue.message)
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Search failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
