import OneSignal from 'react-onesignal';

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("Este navegador não suporta notificações de sistema.");
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};

const ONESIGNAL_APP_ID = "25bd7404-9856-4021-bbb4-3260a00197f4";
const ONESIGNAL_REST_API_KEY = "os_v2_app_ew6xibeykzacdo5ugjqkaamx6tflhbtdmiqeawna7pflspp6sbxv6noy7nucgqg5wiwptwtodrupv7thdomautic4e7qrh4vwfzvg3y";

/**
 * Registers the current device in OneSignal with username and role tags.
 * This enables reliable targeted push notifications via tag filters.
 * Call this after the user logs in AND after OneSignal is initialized.
 */
export const registerDeviceTag = async (username: string, role: string) => {
  try {
    // Link subscription to this user's account via external_id
    await OneSignal.login(username);
    // Set searchable tags for reliable filtering
    OneSignal.User.addTags({ username, role });
    console.log(`[OneSignal] ✅ Device tagged: username="${username}", role="${role}"`);
  } catch (e) {
    console.warn("[OneSignal] ⚠️ registerDeviceTag error:", e);
  }
};

/**
 * Sends a push notification via OneSignal REST API.
 * - targetUsers: array of usernames to notify (uses tag filter on "username" tag)
 * - If targetUsers is empty or undefined, broadcasts to ALL subscribers.
 */
export const pushNotify = async (title: string, body: string, targetUsers?: string[]) => {
  const hasTargets = targetUsers && targetUsers.length > 0;

  // Local HTML5 fallback (browser only, when no specific targets)
  if (!hasTargets && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: '/favicon.png', badge: '/favicon.png' });
  }

  try {
    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, pt: title },
      contents: { en: body, pt: body },
    };

    if (hasTargets) {
      // Strategy 1: Tag-based filter (most reliable — works even if external_id isn't linked)
      // Builds OR filter for multiple target users: username=user1 OR username=user2
      const filters: object[] = [];
      targetUsers!.forEach((u, i) => {
        if (i > 0) filters.push({ operator: "OR" });
        filters.push({ field: "tag", key: "username", relation: "=", value: u });
      });
      payload.filters = filters;

      // Strategy 2 (fallback inside same request): also include external_id aliases
      payload.include_aliases = { external_id: targetUsers };
      payload.target_channel = "push";

      console.log(`[OneSignal] Enviando push para: ${targetUsers.join(', ')} | "${title}"`);
    } else {
      // Broadcast to all subscribers
      payload.included_segments = ["Total Subscriptions"];
      console.log(`[OneSignal] Broadcast para todos: "${title}"`);
    }

    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (res.ok) {
      console.log(`[OneSignal] ✅ Push enviado! ID: ${json.id} | Destinatários: ${json.recipients}`);
      if (json.recipients === 0) {
        console.warn(`[OneSignal] ⚠️ 0 destinatários. O device ainda não tem a tag "username" registrada.`);
      }
    } else {
      console.error(`[OneSignal] ❌ Erro API (${res.status}):`, json.errors || json);
    }
  } catch (error) {
    console.error("[OneSignal] ❌ Falha no Push:", error);
  }
};
