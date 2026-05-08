export const config = {
  api: {
    bodyParser: true,
  },
};

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "25bd7404-9856-4021-bbb4-3260a00197f4";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

export default async function handler(req, res) {
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
    console.error("[notify] ONESIGNAL_REST_API_KEY env var is not set!");
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
    chrome_web_icon: "https://www.nytzervision.com/icon-512.png",
    adm_large_icon: "https://www.nytzervision.com/icon-512.png",
    adm_small_icon: "https://www.nytzervision.com/icon-512.png",
    ios_attachments: { id1: "https://www.nytzervision.com/icon-512.png" }
  };

  try {
    const onesignalRes = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await onesignalRes.json();

    if (onesignalRes.ok) {
      console.log(`[notify] Push sent | ID: ${json.id} | Rec: ${json.recipients} | Op: ${operator}`);
      return res.status(200).json({ success: true, id: json.id, recipients: json.recipients });
    } else {
      console.error(`[notify] OneSignal error (${onesignalRes.status}):`, json);
      return res.status(502).json({ error: "OneSignal error", details: json });
    }
  } catch (err) {
    console.error("[notify] Network error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
