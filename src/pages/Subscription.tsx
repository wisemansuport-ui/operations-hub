import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Clock, AlertTriangle, ChevronLeft, Infinity as InfinityIcon } from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Para quem está saindo do caos da planilha manual.',
    monthlyPrice: 29.9,
    annualPrice: 23.92,
    annualTotal: 287.04,
    badge: null as string | null,
    highlight: false,
    cta: 'Começar agora',
    features: [
      'Até 5 operadores ativos',
      'Dashboard em tempo real',
      'Planilhas automáticas ilimitadas',
      'Notificações push básicas',
      'Suporte por e-mail (48h)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Para times que precisam crescer sem perder o controle.',
    monthlyPrice: 69.9,
    annualPrice: 55.92,
    annualTotal: 671.04,
    badge: 'Mais popular',
    highlight: true,
    cta: 'Assinar Pro',
    features: [
      'Até 25 operadores ativos',
      'Tudo do Starter',
      'Metas com acompanhamento visual',
      'Relatórios avançados e ranking',
      'Notificações push em massa',
      'Integração com PIX e custos',
      'Suporte prioritário (4h)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Para operações de alta escala que não podem parar.',
    monthlyPrice: 149.9,
    annualPrice: 119.92,
    annualTotal: 1439.04,
    badge: null,
    highlight: false,
    cta: 'Falar com vendas',
    features: [
      'Operadores ilimitados',
      'Tudo do Pro',
      'Gerente de conta dedicado',
      'SLA de 99,9% garantido',
      'Onboarding e treinamento 1:1',
      'API e webhooks personalizados',
      'Suporte 24/7 via WhatsApp',
    ],
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const plan = usePlan();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const isTrial = plan.status === 'trial';
  const isExpired = plan.status === 'expired';
  const isActive = plan.status === 'active';
  const isUrgent = isTrial && plan.hoursLeft <= 24;

  const handleCheckout = async (planId: string, price: number) => {
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          price,
          billing,
          userId: user?.id || user?.username,
          userEmail: user?.email || `${user?.username}@nytzervision.com`,
          userName: user?.fullName || user?.username,
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert('Erro ao criar checkout. Tente novamente.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Erro de conexão. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">

        {/* BACK */}
        <button
          onClick={() => navigate('/app')}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao dashboard
        </button>

        {/* HEADER */}
        <div className="text-center space-y-5">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
            Planos & preços
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05] max-w-3xl mx-auto">
            {isExpired
              ? 'Reative seu acesso e volte ao controle.'
              : isActive
              ? 'Gerenciar assinatura'
              : (
                <>
                  Controle total da sua operação,
                  <br className="hidden md:block" />
                  <span className="text-muted-foreground"> sem complicação.</span>
                </>
              )}
          </h1>
          <p className="text-sm md:text-[15px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {isExpired
              ? 'Renove agora para continuar gerenciando suas operações sem interrupção.'
              : isTrial
              ? `Seu trial ${isUrgent ? 'expira em breve' : `tem ${plan.daysLeft > 0 ? `${plan.daysLeft}d` : ''} ${plan.hoursLeft % 24}h restantes`}. Assine para continuar com acesso completo.`
              : 'Escolha o plano que cabe no tamanho do seu time hoje. Atualize ou cancele a qualquer momento.'}
          </p>
        </div>

        {/* TRIAL / EXPIRED BANNER */}
        {(isTrial || isExpired) && (
          <div className={cn(
            'rounded-xl border p-4 flex items-center gap-3 max-w-2xl mx-auto',
            isExpired
              ? 'bg-destructive/5 border-destructive/30'
              : isUrgent
              ? 'bg-orange-500/5 border-orange-500/30'
              : 'bg-muted/40 border-border'
          )}>
            {isExpired
              ? <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              : <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            }
            <div className="flex-1">
              <p className={cn(
                'text-xs font-medium',
                isExpired ? 'text-destructive' : 'text-foreground'
              )}>
                {isExpired
                  ? 'Trial expirado — escolha um plano para continuar'
                  : `Trial: ${plan.daysLeft > 0 ? `${plan.daysLeft} dia(s)` : `${plan.hoursLeft}h`} restantes`}
              </p>
              {isTrial && (
                <div className="mt-2 w-full h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isUrgent ? 'bg-destructive' : 'bg-foreground/70'
                    )}
                    style={{ width: `${Math.max(2, (plan.hoursLeft / 72) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOGGLE */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-card">
            {(['monthly', 'annual'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setBilling(opt)}
                className={cn(
                  'relative px-4 py-1.5 text-xs font-medium rounded-full transition-all',
                  billing === opt
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt === 'monthly' ? 'Mensal' : 'Anual'}
                {opt === 'annual' && (
                  <span className={cn(
                    'ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                    billing === 'annual'
                      ? 'bg-background/20 text-background'
                      : 'bg-emerald-500/15 text-emerald-500'
                  )}>
                    -20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* PLAN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {PLANS.map((p) => {
            const isCurrentPlan = isActive && user?.planTier === p.id;
            const displayPrice = billing === 'annual' ? p.annualPrice : p.monthlyPrice;
            const [int, dec] = displayPrice.toFixed(2).replace('.', ',').split(',');

            return (
              <div
                key={p.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-6 transition-all duration-300',
                  p.highlight
                    ? 'border-foreground/20 bg-card shadow-[0_0_0_1px_hsl(var(--foreground)/0.06)]'
                    : 'border-border/60 bg-card/40 hover:border-border',
                  isCurrentPlan && 'ring-1 ring-foreground/30'
                )}
              >
                {p.badge && (
                  <span className="absolute -top-2.5 left-6 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-foreground text-background">
                    {p.badge}
                  </span>
                )}

                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{p.name}</h3>
                    {isCurrentPlan && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Atual
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {p.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground font-medium">R$</span>
                    <span className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                      {int}
                    </span>
                    <span className="text-lg font-semibold text-foreground/70 tabular-nums">
                      ,{dec}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">/mês</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 h-4">
                    {billing === 'annual'
                      ? `R$ ${p.annualTotal.toFixed(2).replace('.', ',')} cobrado anualmente`
                      : 'Cobrado mensalmente'}
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => !isCurrentPlan && handleCheckout(p.id, displayPrice)}
                  disabled={isCurrentPlan}
                  className={cn(
                    'w-full py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all group',
                    isCurrentPlan
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : p.highlight
                      ? 'bg-foreground text-background hover:opacity-90'
                      : 'border border-border bg-transparent text-foreground hover:bg-muted/50'
                  )}
                >
                  {isCurrentPlan ? 'Plano atual' : isExpired ? `Reativar — ${p.cta}` : p.cta}
                  {!isCurrentPlan && <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />}
                </button>

                {/* Divider */}
                <div className="h-px bg-border/60 my-6" />

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {p.features.map((f) => {
                    const isUnlimited = /ilimitad/i.test(f);
                    const Icon = isUnlimited ? InfinityIcon : Check;
                    return (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] text-foreground/80">
                        <Icon
                          className={cn(
                            'w-3.5 h-3.5 mt-0.5 shrink-0',
                            p.highlight ? 'text-foreground' : 'text-muted-foreground'
                          )}
                          strokeWidth={2.5}
                        />
                        <span className="leading-snug">{f}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* TRUST BAR */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground pt-4">
          <span>7 dias grátis</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>Sem fidelidade · cancele quando quiser</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>Garantia de 30 dias</span>
        </div>

      </div>
    </div>
  );
};

export default Subscription;
