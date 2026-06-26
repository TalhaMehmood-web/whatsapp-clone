import webpush from "web-push";
import { prisma } from "./prisma.js";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@example.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

// Persists the browser's PushSubscription on the user row.
export async function savePushSubscription({ userId, subscription }) {
  await prisma.user.update({
    where: { id: userId },
    data: { pushSubscription: subscription },
  });
}

export async function clearPushSubscription({ userId }) {
  await prisma.user.update({
    where: { id: userId },
    data: { pushSubscription: null },
  });
}

// Sends a payload to the subscriber. Drops the subscription on 404/410.
export async function sendPushTo({ userId, payload }) {
  if (!ensureConfigured()) return;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushSubscription: true },
  });
  if (!user?.pushSubscription) return;
  try {
    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify(payload),
    );
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      await clearPushSubscription({ userId });
    } else {
      console.error("push send failed", err.statusCode, err.body);
    }
  }
}
