// Edge function: AI analysis of a network's performance
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { network, peers } = await req.json();
    if (!network) {
      return new Response(JSON.stringify({ error: "network required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um analista sênior de performance de redes de iGaming. Receberá estatísticas de uma rede e deve devolver uma análise tática, direta, sem rodeios, em português do Brasil. Use linguagem operacional e objetiva. Nunca invente números — use apenas os fornecidos.`;

    const userPrompt = `Analise a rede "${network.name}" com base nos dados abaixo e em como ela se compara às demais redes do operador.

DADOS DA REDE:
- Network Score: ${network.score}/100 (tendência: ${network.trend})
- Rank: #${network.rank} de ${peers?.length ?? "?"} redes
- Metas operadas: ${network.metas}
- Contas processadas: ${network.contas}
- Win Rate: ${network.winRate}%
- ROI: ${network.roi?.toFixed(2)}%
- R$ por conta: R$ ${network.profitPerConta?.toFixed(2)}
- Capital depositado: R$ ${network.totalDeposito?.toFixed(2)}
- Retorno bruto: R$ ${network.totalSaque?.toFixed(2)}
- Lucro total: R$ ${network.totalProfit?.toFixed(2)}
- Recomendação automática do sistema: ${network.recommendationType}

CONTEXTO COMPARATIVO (média do operador):
- ROI médio: ${peers?.avgRoi?.toFixed(2) ?? "n/a"}%
- Win rate médio: ${peers?.avgWin?.toFixed(1) ?? "n/a"}%
- R$/conta médio: R$ ${peers?.avgPpc?.toFixed(2) ?? "n/a"}
- Lucro médio por rede: R$ ${peers?.avgProfit?.toFixed(2) ?? "n/a"}

Responda EM JSON puro (sem markdown, sem comentários) seguindo exatamente este schema:
{
  "veredito": "frase curta de 1 linha resumindo o status da rede",
  "pontosFortes": ["..."],
  "pontosFracos": ["..."],
  "acoes": ["ação concreta 1", "ação concreta 2", "ação concreta 3"],
  "comparativo": "1-2 frases comparando com a média do operador",
  "riscos": ["risco 1", "risco 2"],
  "previsao": "projeção curta para os próximos ciclos se nada mudar"
}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error", detail: txt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let analysis: any;
    try { analysis = JSON.parse(content); } catch { analysis = { veredito: content }; }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
