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
const ONESIGNAL_REST_API_KEY = "os_v2_app_ew6xibeykzacdo5ugjqkaamx6tflhbtdmiqeawna7pflspp6sbxv6noy7nucgqg5wiwptwtodrupv7thdomautic4e7qrh4vwfzvg3y";

/**
 * Registers this device in OneSignal:
 * - Sets external_id via OneSignal.login(username)
 * - Sets tags: { username, role } for filter-based targeting
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
 * Targeting logic:
 *  - If targetUsers provided → sends ONLY to devices tagged with username IN targetUsers (tag filter)
 *  - If no targetUsers → broadcasts to ALL subscribers (Total Subscriptions)
 *
 * NOTE: DO NOT mix 'filters' with 'include_aliases' — they are mutually exclusive in the OneSignal API.
 */
export const pushNotify = async (title: string, body: string, targetUsers?: string[]) => {
  const hasTargets = targetUsers && targetUsers.length > 0;

  try {
    let payload: Record<string, unknown>;

    if (hasTargets) {
      // Build OR filter for each target username using tags
      // e.g. [{ field: "tag", key: "username", relation: "=", value: "nytzer" }]
      const filters: object[] = [];
      targetUsers!.forEach((u, i) => {
        if (i > 0) filters.push({ operator: "OR" });
        filters.push({ field: "tag", key: "username", relation: "=", value: u });
      });

      payload = {
        app_id: ONESIGNAL_APP_ID,
        filters,                          // ← ONLY use filters (not include_aliases)
        headings: { en: title, pt: title },
        contents: { en: body, pt: body },
      };
      console.log(`[OneSignal] Enviando push para: [${targetUsers.join(', ')}] → "${title}"`);
    } else {
      // Broadcast to everyone subscribed
      payload = {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["Total Subscriptions"],
        headings: { en: title, pt: title },
        contents: { en: body, pt: body },
      };
      console.log(`[OneSignal] Broadcast para todos: "${title}"`);
    }

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
      if (json.recipients === 0) {
        console.warn(`[OneSignal] ⚠️ ATENÇÃO: 0 destinatários encontrados!`);
        console.warn(`  → O dispositivo não está inscrito OU a tag "username" não foi registrada.`);
        console.warn(`  → Solução: Abra o app PWA no celular e clique em "🔔 Ativar Alertas".`);
      }
    } else {
      console.error(`[OneSignal] ❌ Erro da API (${res.status}):`, json);
    }
  } catch (error) {
    console.error("[OneSignal] ❌ Falha no Push:", error);
  }
};

/**
 * TEST FUNCTION — Call from browser console to verify push delivery:
 * import { testPushToAdmin } from './lib/notifications';
 * testPushToAdmin('nytzer');
 */
export const testPushToAdmin = async (adminUsername: string) => {
  console.log(`[OneSignal] 🧪 Testando push para admin: "${adminUsername}"...`);
  await pushNotify(
    '🧪 Teste de Notificação',
    `Se você recebeu esta mensagem no iPhone, as notificações estão funcionando!`,
    [adminUsername]
  );
};
