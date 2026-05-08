/**
 * Vercel Serverless Function — /api/notify
 *
 * Sends push notifications via OneSignal REST API server-side.
 * This eliminates CORS errors from operator devices and keeps
 * the API key secure in Vercel environment variables.
 *
 * Called by the frontend at POST /api/notify
 */

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "25bd7404-9856-4021-bbb4-3260a00197f4";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!ONESIGNAL_REST_API_KEY) {
    console.error("[notify] ❌ ONESIGNAL_REST_API_KEY env var not set!");
    return res.status(500).json({ error: "Server misconfigured: missing API key" });
  }

  const { title, body, operator } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({ error: "Missing title or body" });
  }

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    included_segments: ["Total Subscriptions"],
    headings: { en: title, pt: title },
    contents: { en: body, pt: body },
  };

  try {
    const onesignalRes = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await onesignalRes.json();

    if (onesignalRes.ok) {
      console.log(`[notify] ✅ Push sent | ID: ${json.id} | Recipients: ${json.recipients} | Op: ${operator || 'unknown'} | Title: "${title}"`);
      return res.status(200).json({ success: true, id: json.id, recipients: json.recipients });
    } else {
      console.error(`[notify] ❌ OneSignal error (${onesignalRes.status}):`, JSON.stringify(json));
      return res.status(502).json({ error: "OneSignal rejected request", details: json });
    }
  } catch (err) {
    console.error("[notify] ❌ Network error reaching OneSignal:", err.message);
    return res.status(500).json({ error: "Network error", message: err.message });
  }
};
