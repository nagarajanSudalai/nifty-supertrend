import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import type { SupertrendState } from "@/hooks/useSupertrendStatus";

interface Props {
  state: SupertrendState | null;
  loading: boolean;
}

function formatIST(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SupertrendCard({ state, loading }: Props) {
  if (loading) {
    return (
      <View style={[styles.card, styles.cardNeutral]}>
        <ActivityIndicator size="large" color="#6b7280" />
        <Text style={styles.loadingText}>Fetching Nifty 50 data…</Text>
      </View>
    );
  }

  if (!state) {
    return (
      <View style={[styles.card, styles.cardNeutral]}>
        <Text style={styles.noDataEmoji}>⏳</Text>
        <Text style={styles.noDataTitle}>Awaiting First Signal</Text>
        <Text style={styles.noDataSub}>
          The cron runs hourly during NSE trading hours (Mon–Fri).
        </Text>
      </View>
    );
  }

  const isBullish = state.direction === "BULLISH";
  const cardStyle = isBullish ? styles.cardBullish : styles.cardBearish;
  const textColor = isBullish ? "#15803d" : "#b91c1c";

  return (
    <View style={[styles.card, cardStyle]}>
      <Text style={[styles.directionEmoji]}>{isBullish ? "🟢" : "🔴"}</Text>
      <Text style={[styles.direction, { color: textColor }]}>
        {state.direction}
      </Text>
      <Text style={styles.price}>₹{state.close.toFixed(2)}</Text>
      <Text style={styles.band}>Band: ₹{state.band.toFixed(2)}</Text>
      <Text style={styles.timestamp}>
        {formatIST(state.timestamp)} IST
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    borderWidth: 2,
    marginBottom: 8,
  },
  cardNeutral: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },
  cardBullish: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  cardBearish: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  directionEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  direction: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 12,
  },
  price: {
    fontSize: 22,
    color: "#1f2937",
    fontWeight: "600",
  },
  band: {
    fontSize: 15,
    color: "#6b7280",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 8,
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 15,
  },
  noDataEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
  },
  noDataSub: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
});
