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

/**
 * Registers this device in OneSignal with username and role tags.
 * Called on login, registration and app open to ensure the device
 * is always properly identified.
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
 * Sends a push notification via the /api/notify Vercel serverless function.
 *
 * This avoids CORS issues (the API key lives server-side) and ensures
 * the notification fires correctly from ANY device — operator phone,
 * desktop, tablet — regardless of browser restrictions.
 *
 * The notification is always broadcast to "Total Subscriptions" so
 * every subscriber (including the admin iPhone PWA) receives it.
 */
export const pushNotify = async (
  title: string,
  body: string,
  operator?: string | string[]
) => {
  const operatorLabel = Array.isArray(operator)
    ? operator.join(', ')
    : (operator || 'desconhecido');

  console.log(`[Push] 📤 Enviando: "${title}" | Operador: ${operatorLabel}`);

  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, operator: operatorLabel }),
    });

    const json = await res.json();

    if (res.ok) {
      console.log(`[Push] ✅ Enviado! ID: ${json.id} | Destinatários: ${json.recipients}`);
    } else {
      console.error(`[Push] ❌ Erro da API (${res.status}):`, json);
    }
  } catch (error) {
    console.error("[Push] ❌ Falha ao chamar /api/notify:", error);
  }
};

/**
 * Test push — sends a test notification broadcast to verify the pipeline.
 */
export const testPushToAdmin = async (adminUsername: string) => {
  console.log(`[Push] 🧪 Enviando push de teste para: "${adminUsername}"...`);
  await pushNotify(
    '🧪 Teste de Notificação',
    `Se você recebeu esta mensagem no iPhone, as notificações estão funcionando! ✅`,
    adminUsername
  );
};
