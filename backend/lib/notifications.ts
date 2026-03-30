import Expo, { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { removeTokens } from "./redis";

const expo = new Expo();

export async function sendSupertrendFlip(
  tokens: string[],
  direction: "BULLISH" | "BEARISH",
  close: number,
  band: number
): Promise<{ sent: number; staleTokens: string[] }> {
  // Filter to valid Expo push tokens only
  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return { sent: 0, staleTokens: [] };

  const emoji = direction === "BULLISH" ? "🟢" : "🔴";
  const dirLabel = direction === "BULLISH" ? "Bullish" : "Bearish";

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title: `${emoji} Nifty 50 Turned ${dirLabel}`,
    body: `Supertrend flipped ${direction} at ₹${close.toFixed(2)} (band: ₹${band.toFixed(2)})`,
    data: { direction, close, band },
  }));

  // Send in batches of 100
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...chunkTickets);
  }

  // Collect stale (DeviceNotRegistered) tokens for cleanup
  const staleTokens: string[] = [];
  tickets.forEach((ticket, i) => {
    if (
      ticket.status === "error" &&
      ticket.details?.error === "DeviceNotRegistered"
    ) {
      staleTokens.push(validTokens[i]);
    }
  });

  // Remove stale tokens from Redis
  if (staleTokens.length > 0) {
    await removeTokens(staleTokens);
  }

  return { sent: validTokens.length - staleTokens.length, staleTokens };
}
