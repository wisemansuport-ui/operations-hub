// Consulta status de um pagamento Mercado Pago (polling).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!token) {
      return new Response(JSON.stringify({ error: 'token ausente' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id') || (await req.json().catch(() => ({}))).id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'id obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json();

    if (!r.ok) {
      return new Response(JSON.stringify({ error: data?.message || 'erro', details: data }), {
        status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        status: data.status, // pending | approved | rejected | cancelled | refunded
        statusDetail: data.status_detail,
        amount: data.transaction_amount,
        paidAt: data.date_approved,
        metadata: data.metadata,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
