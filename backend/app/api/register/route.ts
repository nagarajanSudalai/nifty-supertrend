import { NextRequest, NextResponse } from "next/server";
import Expo from "expo-server-sdk";
import { registerToken } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (!Expo.isExpoPushToken(token)) {
      return NextResponse.json(
        { error: "Invalid Expo push token" },
        { status: 400 }
      );
    }

    await registerToken(token);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
