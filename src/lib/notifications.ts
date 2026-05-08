import OneSignal from 'react-onesignal';

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};

const ONESIGNAL_APP_ID = "25bd7404-9856-4021-bbb4-3260a00197f4";
const ONESIGNAL_REST_API_KEY = "os_v2_app_ew6xibeykzacdo5ugjqkaamx6rvsmkmmhife7ofwi5vrichzrzi5v2sep4hpjjummr2htpbqnykp3jv5yxxoti4wzw7qtka4kvh655y";

/**
 * Registers this device in OneSignal:
 * - Sets external_id via OneSignal.login(username)
 * - Sets tags: { username, role }
 */
export const registerDeviceTag = async (username: string, role: string) => {
  try {
    await OneSignal.login(username);
    OneSignal.User.addTags({ username, role });
    console.log(`[OneSignal] ✅ Device registered: username="${username}", role="${role}"`);
  } catch (e) {
    console.warn("[OneSignal] ⚠️ registerDeviceTag failed:", e);
  }
};

/**
 * Sends push notification via OneSignal REST API.
 * 
 * ALWAYS broadcasts to ALL subscribers (Total Subscriptions).
 * The targetUsers parameter is kept for API compatibility but is logged-only.
 * This ensures reliable delivery on iOS PWA where tag/external_id binding is unreliable.
 */
export const pushNotify = async (title: string, body: string, targetUsers?: string[]) => {
  try {
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["Total Subscriptions"],
      headings: { en: title, pt: title },
      contents: { en: body, pt: body },
    };

    console.log(`[OneSignal] 📤 Enviando push broadcast: "${title}"${targetUsers?.length ? ` (contexto: ${targetUsers.join(', ')})` : ''}`);

    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (res.ok) {
      console.log(`[OneSignal] ✅ Push enviado! ID: ${json.id} | Destinatários: ${json.recipients}`);
    } else {
      console.error(`[OneSignal] ❌ Erro da API (${res.status}):`, json);
    }
  } catch (error) {
    console.error("[OneSignal] ❌ Falha no Push:", error);
  }
};

/**
 * Test push delivery — sends a test notification via broadcast.
 */
export const testPushToAdmin = async (adminUsername: string) => {
  console.log(`[OneSignal] 🧪 Testando push para: "${adminUsername}"...`);
  await pushNotify(
    '🧪 Teste de Notificação',
    `Se você recebeu esta mensagem no iPhone, as notificações estão funcionando!`
  );
};
