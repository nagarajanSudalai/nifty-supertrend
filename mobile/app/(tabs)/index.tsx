import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNotifications } from "@/hooks/useNotifications";
import { useSupertrendStatus } from "@/hooks/useSupertrendStatus";
import { SupertrendCard } from "@/components/supertrend/SupertrendCard";

export default function StatusScreen() {
  // Side effect: registers push token on mount
  const { status: notifStatus } = useNotifications();
  const { data, loading, error, refresh } = useSupertrendStatus();

  const notifLabel =
    notifStatus === "granted"
      ? "🔔 Notifications Enabled"
      : notifStatus === "denied"
      ? "🔕 Notifications Denied"
      : notifStatus === "unavailable"
      ? "📵 Simulator — No Push"
      : "…";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <SupertrendCard state={data?.state ?? null} loading={loading} />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.deviceCount ?? "—"}</Text>
          <Text style={styles.statLabel}>Registered Devices</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.history.length ?? "—"}</Text>
          <Text style={styles.statLabel}>Total Signals</Text>
        </View>
      </View>

      <View style={styles.notifBadge}>
        <Text style={styles.notifText}>{notifLabel}</Text>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
        <Text style={styles.refreshText}>↻ Refresh</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Supertrend(10, 3) · Hourly · NSE Nifty 50{"\n"}
        Cron runs Mon–Fri, 9:45 AM – 3:15 PM IST
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
    textAlign: "center",
  },
  notifBadge: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  notifText: {
    fontSize: 13,
    color: "#15803d",
    fontWeight: "600",
  },
  refreshBtn: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  refreshText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  footer: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 16,
  },
});
