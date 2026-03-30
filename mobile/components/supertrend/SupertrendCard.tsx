import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import type { SupertrendState } from "@/hooks/useSupertrendStatus";

interface Props {
  state: SupertrendState | null;
  loading: boolean;
}

function formatIST(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatINR(value: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
  const accentColor = isBullish ? "#15803d" : "#b91c1c";
  const badgeBg = isBullish ? "#16a34a" : "#dc2626";

  return (
    <View style={[styles.card, isBullish ? styles.cardBullish : styles.cardBearish]}>
      <Text style={styles.index}>NIFTY 50</Text>
      <Text style={styles.subtitle}>Supertrend (10, 3) · 1H</Text>

      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={styles.badgeText}>
          {isBullish ? "▲  BULLISH" : "▼  BEARISH"}
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Last Close</Text>
          <Text style={[styles.cellValue, { color: accentColor }]}>
            ₹{formatINR(state.close)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Supertrend Band</Text>
          <Text style={[styles.cellValue, { color: accentColor }]}>
            ₹{formatINR(state.band)}
          </Text>
        </View>
      </View>

      <Text style={styles.timestamp}>🕐 {formatIST(state.timestamp)} IST</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 24,
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
  index: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#6b7280",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 20,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 16,
  },
  cell: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    backgroundColor: "#d1d5db",
    marginHorizontal: 8,
  },
  cellLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cellValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  timestamp: {
    fontSize: 12,
    color: "#6b7280",
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
