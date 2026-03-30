import type { Candle } from "./supertrend";

const YAHOO_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1h&range=10d";

interface YahooChartQuote {
  open: (number | null)[];
  high: (number | null)[];
  low: (number | null)[];
  close: (number | null)[];
}

interface YahooResponse {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: YahooChartQuote[];
      };
    }> | null;
    error: { message: string } | null;
  };
}

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
        next: { revalidate: 0 },
      });
      if (res.ok) return res;
      if (res.status === 429 && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw new Error(`Yahoo Finance returned HTTP ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError ?? new Error("Failed to fetch Yahoo Finance data");
}

export async function fetchNiftyCandles(): Promise<Candle[]> {
  const res = await fetchWithRetry(YAHOO_URL);
  const data: YahooResponse = await res.json();

  if (data.chart.error) {
    throw new Error(`Yahoo Finance error: ${data.chart.error.message}`);
  }

  const result = data.chart.result?.[0];
  if (!result) throw new Error("No chart data in Yahoo Finance response");

  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];

  // Guard: drop incomplete current candle (timestamp falls within current hour)
  const currentHourStart = Math.floor(Date.now() / 1000 / 3600) * 3600;

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    const o = quote.open[i];
    const h = quote.high[i];
    const l = quote.low[i];
    const c = quote.close[i];

    // Skip incomplete candle or any candle with null OHLC (holiday/pre-market)
    if (t >= currentHourStart) continue;
    if (o === null || h === null || l === null || c === null) continue;

    candles.push({ timestamp: t, open: o, high: h, low: l, close: c });
  }

  // Sort ascending (Yahoo usually returns them sorted but be safe)
  candles.sort((a, b) => a.timestamp - b.timestamp);

  return candles;
}
