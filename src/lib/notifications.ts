export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("Este navegador não suporta notificações de sistema.");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

// NOTE: For sending pushes via REST API from the frontend, we need the REST API Key.
// This is not standard for public facing apps, but works for internal admin tools.
const ONESIGNAL_APP_ID = "25bd7404-9856-4021-bbb4-3260a00197f4";
const ONESIGNAL_REST_API_KEY = "os_v2_app_ew6xibeykzacdo5ugjqkaamx6tflhbtdmiqeawna7pflspp6sbxv6noy7nucgqg5wiwptwtodrupv7thdomautic4e7qrh4vwfzvg3y";

export const pushNotify = async (title: string, body: string, targetUsers?: string[]) => {
  // Determine if we have specific targets
  const hasTargets = targetUsers && targetUsers.length > 0;

  // 1. Local HTML5 Notification fallback (only when no specific target users)
  if (!hasTargets && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png'
    });
  }

  // 2. Trigger OneSignal REST API to push to subscribed devices (including your iPhone)
  try {
    // If we have specific external_id targets, use them; otherwise broadcast to ALL subscribers
    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, pt: title },
      contents: { en: body, pt: body },
    };

    if (hasTargets) {
      // Target specific users by their external_id (OneSignal.login username)
      payload.include_aliases = { external_id: targetUsers };
      payload.target_channel = "push";
    } else {
      // Broadcast to everyone subscribed (Total Subscriptions segment)
      payload.included_segments = ["Total Subscriptions"];
    }

    console.log(`[OneSignal] Enviando push: "${title}" | Targets: ${hasTargets ? targetUsers!.join(', ') : 'TODOS (Total Subscriptions)'}`);

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
      console.log(`[OneSignal] ✅ Push enviado com sucesso. ID: ${json.id} | Destinatários: ${json.recipients}`);
    } else {
      console.error(`[OneSignal] ❌ Erro na API (${res.status}):`, json.errors || json);
    }
  } catch (error) {
    console.error("[OneSignal] ❌ Falha ao enviar Push:", error);
  }
};
