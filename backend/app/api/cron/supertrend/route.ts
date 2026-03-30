import { NextRequest, NextResponse } from "next/server";
import { fetchNiftyCandles } from "@/lib/yahoo-finance";
import { calculateSupertrend } from "@/lib/supertrend";
import {
  getSupertrendState,
  setSupertrendState,
  getAllTokens,
  pushSignalHistory,
  type SupertrendState,
  type SignalEvent,
} from "@/lib/redis";
import { sendSupertrendFlip } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Validate Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch OHLC data from Yahoo Finance
    const candles = await fetchNiftyCandles();
    if (candles.length < 11) {
      return NextResponse.json({
        status: "skipped",
        reason: `Not enough candles: ${candles.length}`,
      });
    }

    // 2. Calculate Supertrend
    const result = calculateSupertrend(candles);
    if (!result) {
      return NextResponse.json({ status: "skipped", reason: "Calculation returned null" });
    }

    // 3. Get previous state from Redis
    const prevState = await getSupertrendState();

    // 4. Detect flip
    const isFlip = prevState !== null && prevState.direction !== result.direction;
    const isFirstRun = prevState === null;

    let tokensNotified = 0;

    if (isFlip) {
      // 5a. Build signal event
      const signal: SignalEvent = {
        direction: result.direction,
        band: result.band,
        close: result.close,
        timestamp: new Date(result.timestamp * 1000).toISOString(),
      };

      // 5b. Send push notifications
      const tokens = await getAllTokens();
      if (tokens.length > 0) {
        const { sent } = await sendSupertrendFlip(
          tokens,
          result.direction,
          result.close,
          result.band
        );
        tokensNotified = sent;
      }

      // 5c. Store signal in history
      await pushSignalHistory(signal);
    }

    // 6. Always update current state
    const newState: SupertrendState = {
      direction: result.direction,
      band: result.band,
      close: result.close,
      timestamp: new Date(result.timestamp * 1000).toISOString(),
    };
    await setSupertrendState(newState);

    return NextResponse.json({
      status: "ok",
      isFirstRun,
      isFlip,
      direction: result.direction,
      band: result.band,
      close: result.close,
      candlesProcessed: candles.length,
      tokensNotified,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/supertrend]", message);
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}
