const fs = require('fs');
let code = fs.readFileSync('supabase/functions/send-profit-summary/index.ts', 'utf8');

// The replacement logic:
code = code.replace('Deno.serve(async (req) => {', 'export default async function handler(req: any, res: any) {');

// Replace standard responses
code = code.replace("return new Response('ok', { headers: corsHeaders });", "return res.status(200).end();");
code = code.replace("return new Response(JSON.stringify({ error: 'invalid period' }), {\n        status: 400,\n        headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n      });", "return res.status(400).json({ error: 'invalid period' });");
code = code.replace("return new Response(JSON.stringify({ period, count: results.length, results }), {\n      headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n    });", "return res.status(200).json({ period, count: results.length, results });");
code = code.replace("return new Response(JSON.stringify({ error: String(e) }), {\n      status: 500,\n      headers: { ...corsHeaders, 'Content-Type': 'application/json' },\n    });", "return res.status(500).json({ error: String(e) });");

// Replace URL parsing
const urlParsing = `    const url = new URL(req.url);
    let bodyParams: any = {};
    if (req.method === 'POST') {
      try { bodyParams = await req.json(); } catch { bodyParams = {}; }
    }
    const period = ((bodyParams.period || url.searchParams.get('period') || 'daily') as Period);
    const targetAdmin = (bodyParams.targetAdmin || url.searchParams.get('targetAdmin') || '').toString().trim();
    const allowZero = !!(bodyParams.allowZero || url.searchParams.get('allowZero'));`;

const newUrlParsing = `    let bodyParams: any = req.body || {};
    let queryParams: any = req.query || {};
    const period = ((bodyParams.period || queryParams.period || 'daily') as Period);
    const targetAdmin = (bodyParams.targetAdmin || queryParams.targetAdmin || '').toString().trim();
    const allowZero = !!(bodyParams.allowZero || queryParams.allowZero);`;

code = code.replace(urlParsing, newUrlParsing);

fs.writeFileSync('api/send-profit-summary.ts', code);
