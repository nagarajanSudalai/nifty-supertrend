import { NextResponse } from "next/server";
import { getSupertrendState, getSignalHistory, getDeviceCount } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [state, history, deviceCount] = await Promise.all([
      getSupertrendState(),
      getSignalHistory(20),
      getDeviceCount(),
    ]);

    return NextResponse.json(
      { state, history, deviceCount },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (err) {
    console.error("[status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
