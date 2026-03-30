import { FlatList, View, Text, StyleSheet } from "react-native";
import { useSupertrendStatus, type SignalEvent } from "@/hooks/useSupertrendStatus";

function formatIST(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SignalRow({ item }: { item: SignalEvent }) {
  const isBullish = item.direction === "BULLISH";
  return (
    <View style={styles.row}>
      <View style={[styles.dot, isBullish ? styles.dotBullish : styles.dotBearish]} />
      <View style={styles.rowContent}>
        <Text style={[styles.direction, isBullish ? styles.bullishText : styles.bearishText]}>
          {item.direction}
        </Text>
        <Text style={styles.price}>₹{item.close.toFixed(2)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.band}>Band: ₹{item.band.toFixed(2)}</Text>
        <Text style={styles.time}>{formatIST(item.timestamp)}</Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { data, loading } = useSupertrendStatus();
  const history = data?.history ?? [];

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Loading…</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>No Signals Yet</Text>
        <Text style={styles.emptyText}>
          Signals appear here when Supertrend flips direction.{"\n"}
          Cron runs hourly Mon–Fri during NSE market hours.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(_, i) => String(i)}
      renderItem={({ item }) => <SignalRow item={item} />}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  dotBullish: { backgroundColor: "#22c55e" },
  dotBearish: { backgroundColor: "#ef4444" },
  rowContent: { flex: 1 },
  direction: { fontSize: 15, fontWeight: "700" },
  bullishText: { color: "#15803d" },
  bearishText: { color: "#b91c1c" },
  price: { fontSize: 13, color: "#374151", marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  band: { fontSize: 12, color: "#6b7280" },
  time: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  separator: { height: 1, backgroundColor: "#f3f4f6" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151", marginBottom: 8 },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 18 },
});
