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
const ONESIGNAL_APP_ID = "25bd74d4-9b56-4021-bbb4-3260a00197f4";
const ONESIGNAL_REST_API_KEY = "os_v2_app_ew6xibeykzacdo5ugjqkaamx6qebrcmofnfu2cus3n3a7o2xmzdxs2gz5ugywhac573yzcvzj5ccwqb4xu5ox6jwfoebizoytmn75pa";

export const pushNotify = async (title: string, body: string, targetUsers?: string[]) => {
  // 1. Local HTML5 Notification fallback (for the operator if they have permissions)
  if ("Notification" in window && Notification.permission === "granted" && (!targetUsers || targetUsers.length === 0)) {
    new Notification(title, {
      body,
      icon: '/vite.svg',
      badge: '/vite.svg'
    });
  }

  // 2. Trigger OneSignal REST API to push to all subscribed devices (including your cellphone)
  if (ONESIGNAL_REST_API_KEY === "SUA_REST_API_KEY_AQUI") {
    console.warn("OneSignal REST API Key was not set. Skipping external push.");
    return;
  }

  try {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        ...(targetUsers && targetUsers.length > 0 
           ? { target_channel: "push", include_aliases: { external_id: targetUsers } } 
           : { included_segments: ["Total Subscriptions"] }),
        headings: { en: title, pt: title },
        contents: { en: body, pt: body },
      })
    });
    console.log("Push disparado para o celular via OneSignal.");
  } catch (error) {
    console.error("Falha ao enviar Push da OneSignal:", error);
  }
};
