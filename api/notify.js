/**
 * Vercel Serverless Function — /api/notify
 * 
 * Receives notification requests from the frontend and forwards them
 * to the OneSignal REST API server-side, avoiding all CORS issues
 * and keeping the API key secure.
 */

const ONESIGNAL_APP_ID = "25bd7404-9856-4021-bbb4-3260a00197f4";
const ONESIGNAL_REST_API_KEY = "os_v2_app_ew6xibeykzacdo5ugjqkaamx6sbpbenbmkyeq35ogx2pid2llyp6brihirc4btwpymribjnwteyszwwaggqu7eknn3hu5ujp7kfnr5a";

export default async function handler(req, res) {
  // Allow CORS from our own domain
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
      console.log(`[notify] ✅ Push sent | ID: ${json.id} | Recipients: ${json.recipients} | Operator: ${operator || 'unknown'}`);
      return res.status(200).json({ success: true, id: json.id, recipients: json.recipients });
    } else {
      console.error(`[notify] ❌ OneSignal error (${onesignalRes.status}):`, json);
      return res.status(onesignalRes.status).json({ error: json });
    }
  } catch (err) {
    console.error("[notify] ❌ Fetch failed:", err);
    return res.status(500).json({ error: "Failed to reach OneSignal" });
  }
}
