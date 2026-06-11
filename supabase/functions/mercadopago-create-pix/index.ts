// Cria um pagamento PIX no Mercado Pago e devolve o QR Code em tempo real.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Body {
  amount: number;
  description: string;
  payerEmail: string;
  payerName?: string;
  adminId: string;
  adminUsername: string;
  plan: 'solo' | 'team';
  operators?: number;
  extendDays?: number; // default 30
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json()) as Body;

    if (!body.amount || body.amount <= 0) {
      return new Response(JSON.stringify({ error: 'Valor inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!body.payerEmail) {
      return new Response(JSON.stringify({ error: 'E-mail do pagador obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const idempotencyKey = crypto.randomUUID();
    const [firstName, ...rest] = (body.payerName || 'Cliente').trim().split(' ');
    const lastName = rest.join(' ') || 'NytzerVision';

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: Number(body.amount.toFixed(2)),
        description: body.description,
        payment_method_id: 'pix',
        payer: {
          email: body.payerEmail,
          first_name: firstName,
          last_name: lastName,
        },
        metadata: {
          admin_id: body.adminId,
          admin_username: body.adminUsername,
          plan: body.plan,
          operators: body.operators ?? 0,
          extend_days: body.extendDays ?? 30,
        },
      }),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error('MP error', mpData);
      return new Response(
        JSON.stringify({ error: mpData?.message || 'Falha ao criar PIX', details: mpData }),
        { status: mpRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const poi = mpData?.point_of_interaction?.transaction_data;

    return new Response(
      JSON.stringify({
        paymentId: mpData.id,
        status: mpData.status,
        qrCode: poi?.qr_code, // copia e cola
        qrCodeBase64: poi?.qr_code_base64, // imagem PNG base64
        ticketUrl: poi?.ticket_url,
        expiresAt: mpData.date_of_expiration,
        amount: mpData.transaction_amount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
