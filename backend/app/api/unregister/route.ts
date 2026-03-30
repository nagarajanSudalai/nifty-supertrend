import { NextRequest, NextResponse } from "next/server";
import { unregisterToken } from "@/lib/redis";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    await unregisterToken(token);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[unregister]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
