import { getSupertrendState, getSignalHistory, getDeviceCount } from "@/lib/redis";

export const dynamic = "force-dynamic";

function formatIST(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function DashboardPage() {
  let state = null;
  let history: Awaited<ReturnType<typeof getSignalHistory>> = [];
  let deviceCount = 0;
  let error = "";

  try {
    [state, history, deviceCount] = await Promise.all([
      getSupertrendState(),
      getSignalHistory(10),
      getDeviceCount(),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const isBullish = state?.direction === "BULLISH";

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Nifty 50 Supertrend Monitor</h1>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <strong>Redis error:</strong> {error}
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#666" }}>
            Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.
          </p>
        </div>
      )}

      <div style={{
        background: state ? (isBullish ? "#dcfce7" : "#fee2e2") : "#f3f4f6",
        border: `2px solid ${state ? (isBullish ? "#22c55e" : "#ef4444") : "#d1d5db"}`,
        borderRadius: 12, padding: 24, marginBottom: 24, textAlign: "center",
      }}>
        {state ? (
          <>
            <div style={{ fontSize: 48, fontWeight: 800, color: isBullish ? "#16a34a" : "#dc2626" }}>
              {isBullish ? "🟢 BULLISH" : "🔴 BEARISH"}
            </div>
            <div style={{ marginTop: 8, fontSize: 18, color: "#374151" }}>
              Nifty 50: ₹{state.close.toFixed(2)}
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
              Band: ₹{state.band.toFixed(2)}
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
              Last updated: {formatIST(state.timestamp)} IST
            </div>
          </>
        ) : (
          <div style={{ color: "#6b7280", fontSize: 18 }}>No data yet — awaiting first cron run</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { value: deviceCount, label: "Registered Devices" },
          { value: history.length, label: "Recent Signals" },
        ].map(({ value, label }) => (
          <div key={label} style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Signal History</h2>
      {history.length === 0 ? (
        <p style={{ color: "#9ca3af", fontSize: 14 }}>No signals recorded yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Direction", "Price (₹)", "Band (₹)", "Time (IST)"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: h === "Direction" ? "left" : "right", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((s, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px 12px", color: s.direction === "BULLISH" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                  {s.direction === "BULLISH" ? "🟢" : "🔴"} {s.direction}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>{s.close.toFixed(2)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>{s.band.toFixed(2)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>{formatIST(s.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 32, fontSize: 12, color: "#9ca3af" }}>
        Cron runs hourly Mon–Fri during NSE trading hours. Supertrend: Period 10, Multiplier 3.
      </p>
    </main>
  );
}
