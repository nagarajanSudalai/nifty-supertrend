import { useState, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Alert } from "react-native";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const TOKEN_STORAGE_KEY = "expo_push_token";

export type NotifStatus = "undetermined" | "granted" | "denied" | "unavailable";

export function useNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<NotifStatus>("undetermined");
  const tokenListenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    register();
    return () => {
      tokenListenerRef.current?.remove();
    };
  }, []);

  async function register() {
    if (!Device.isDevice) {
      setStatus("unavailable");
      return;
    }

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Supertrend Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#22c55e",
      });
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      finalStatus = newStatus;
    }
    setStatus(finalStatus as NotifStatus);

    if (finalStatus !== "granted") return;

    // Check stored token
    const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

    // Get current Expo push token
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    let expoPushToken: string;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      expoPushToken = tokenData.data;
    } catch (err) {
      console.warn("[notifications] Failed to get push token:", err);
      return;
    }

    setToken(expoPushToken);

    // Register with backend if token is new or changed
    if (storedToken !== expoPushToken) {
      // Unregister old token if it changed
      if (storedToken) {
        await unregisterFromBackend(storedToken);
      }
      await registerWithBackend(expoPushToken);
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, expoPushToken);
    }

    // Listen for token refresh
    tokenListenerRef.current = Notifications.addPushTokenListener(
      async ({ data: newToken }) => {
        if (newToken !== expoPushToken) {
          await unregisterFromBackend(expoPushToken);
          await registerWithBackend(newToken);
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken);
          setToken(newToken);
        }
      }
    );
  }

  async function registerWithBackend(pushToken: string) {
    if (!BACKEND_URL) return;
    try {
      await fetch(`${BACKEND_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pushToken }),
      });
    } catch (err) {
      console.warn("[notifications] Register failed:", err);
    }
  }

  async function unregisterFromBackend(pushToken: string) {
    if (!BACKEND_URL) return;
    try {
      await fetch(`${BACKEND_URL}/api/unregister`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pushToken }),
      });
    } catch {
      // Non-critical
    }
  }

  return { token, status };
}
