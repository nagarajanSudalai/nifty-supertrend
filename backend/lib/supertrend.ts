export interface Candle {
  timestamp: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SupertrendResult {
  direction: "BULLISH" | "BEARISH";
  band: number; // active band value (lower if bullish, upper if bearish)
  upperBand: number;
  lowerBand: number;
  close: number;
  timestamp: number;
}

const PERIOD = 10;
const MULTIPLIER = 3;

/**
 * Calculates Supertrend(10, 3) using Wilder's RMA for ATR.
 * Matches TradingView's ta.supertrend() output exactly.
 * Requires at least PERIOD + 1 candles (11).
 */
export function calculateSupertrend(candles: Candle[]): SupertrendResult | null {
  if (candles.length < PERIOD + 1) return null;

  // Step 1: True Range
  const tr: number[] = [];
  tr.push(candles[0].high - candles[0].low);
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }

  // Step 2: Wilder's RMA (ATR)
  const atr: number[] = new Array(candles.length).fill(0);
  // Seed: simple average of first PERIOD values
  let sum = 0;
  for (let i = 0; i < PERIOD; i++) sum += tr[i];
  atr[PERIOD - 1] = sum / PERIOD;
  for (let i = PERIOD; i < candles.length; i++) {
    atr[i] = (atr[i - 1] * (PERIOD - 1) + tr[i]) / PERIOD;
  }

  // Steps 3–5: Bands + Direction (valid only from index PERIOD onwards)
  const finalUpper: number[] = new Array(candles.length).fill(0);
  const finalLower: number[] = new Array(candles.length).fill(0);
  const direction: ("BULLISH" | "BEARISH")[] = new Array(candles.length);

  for (let i = PERIOD; i < candles.length; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const rawUpper = hl2 + MULTIPLIER * atr[i];
    const rawLower = hl2 - MULTIPLIER * atr[i];

    if (i === PERIOD) {
      // Seed bands
      finalUpper[i] = rawUpper;
      finalLower[i] = rawLower;
      direction[i] = candles[i].close > rawUpper ? "BULLISH" : "BEARISH";
    } else {
      // Band adjustment: bands only tighten, never widen
      finalUpper[i] =
        rawUpper < finalUpper[i - 1] || candles[i - 1].close > finalUpper[i - 1]
          ? rawUpper
          : finalUpper[i - 1];

      finalLower[i] =
        rawLower > finalLower[i - 1] || candles[i - 1].close < finalLower[i - 1]
          ? rawLower
          : finalLower[i - 1];

      if (direction[i - 1] === "BEARISH") {
        direction[i] = candles[i].close > finalUpper[i] ? "BULLISH" : "BEARISH";
      } else {
        direction[i] = candles[i].close < finalLower[i] ? "BEARISH" : "BULLISH";
      }
    }
  }

  const last = candles.length - 1;
  return {
    direction: direction[last],
    band: direction[last] === "BULLISH" ? finalLower[last] : finalUpper[last],
    upperBand: finalUpper[last],
    lowerBand: finalLower[last],
    close: candles[last].close,
    timestamp: candles[last].timestamp,
  };
}
