import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Zap, Clock, Check, AlertTriangle, ArrowRight,
  Shield, Headphones, Rocket, Star, Sparkles, ChevronRight
} from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { useLocalStorage } from '../hooks/useLocalStorage';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Rocket,
    description: 'Para quem está começando a profissionalizar a operação.',
    monthlyPrice: 19.9,
    annualPrice: 15.92, // 20% off
    annualTotal: 191.04,
    color: 'border-border/30',
    iconBg: 'bg-zinc-800',
    iconColor: 'text-zinc-300',
    badge: null,
    cta: 'Começar agora',
    features: [
      'Até 5 operadores ativos',
      'Planilhas automáticas ilimitadas',
      'Dashboard em tempo real',
      'Notificações push básicas',
      'Suporte por e-mail (48h)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    description: 'O plano dos times que querem escalar de verdade.',
    monthlyPrice: 37.0,
    annualPrice: 29.6, // 20% off
    annualTotal: 355.2,
    color: 'border-yellow-500/50',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    badge: 'MAIS ESCOLHIDO',
    cta: 'Assinar o Pro',
    features: [
      'Até 25 operadores ativos',
      'Tudo do Starter +',
      'Sistema de metas com foguete animado',
      'Relatórios avançados e ranking',
      'Notificações push em massa',
      'Integração com PIX e custos',
      'Suporte prioritário (4h)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    description: 'Para operações de alta escala que não podem parar.',
    monthlyPrice: 69.9,
    annualPrice: 55.92, // 20% off
    annualTotal: 671.04,
    color: 'border-violet-500/30',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
    badge: null,
    cta: 'Falar com vendas',
    features: [
      'Operadores ilimitados',
      'Tudo do Pro +',
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
    <div className="min-h-screen w-full">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ── HEADER ── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold text-yellow-500 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            DESBLOQUEIE TODO O PODER DO NYTZERVISION
          </div>

          <h1 className="w-full text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight text-center">
            {isExpired
              ? 'Seu acesso expirou'
              : isActive
              ? 'Gerenciar Assinatura'
              : <>Pare de perder dinheiro com <span className="text-yellow-500">operação amadora</span>.</>
            }
          </h1>

          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto text-center">
            {isExpired
              ? 'Renove agora para continuar gerenciando suas operações sem interrupção.'
              : isTrial
              ? `Seu trial ${isUrgent ? 'expira em breve' : `tem ${plan.daysLeft > 0 ? `${plan.daysLeft}d` : ''} ${plan.hoursLeft % 24}h restantes`}. Assine para continuar com acesso completo.`
              : 'Mais de 1.200 operadores já controlam suas equipes no piloto automático.'}
          </p>
        </div>

        {/* ── TRIAL / EXPIRED BANNER ── */}
        {(isTrial || isExpired) && (
          <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
            isExpired
              ? 'bg-red-500/10 border-red-500/30'
              : isUrgent
              ? 'bg-orange-500/10 border-orange-500/30'
              : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            {isExpired
              ? <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              : <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
            }
            <div className="flex-1">
              <p className={`text-sm font-semibold ${isExpired ? 'text-red-300' : 'text-yellow-300'}`}>
                {isExpired
                  ? 'Trial expirado — escolha um plano para continuar'
                  : `Trial: ${plan.daysLeft > 0 ? `${plan.daysLeft} dia(s)` : `${plan.hoursLeft}h`} restantes`}
              </p>
              {isTrial && (
                <div className="mt-1.5 w-full h-1 rounded-full bg-black/30 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isUrgent ? 'bg-red-500' : 'bg-yellow-400'}`}
                    style={{ width: `${Math.max(2, (plan.hoursLeft / 72) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BILLING TOGGLE ── */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-medium transition-colors ${billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Mensal
          </span>
          <button
            onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
            className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'annual' ? 'bg-yellow-500' : 'bg-zinc-700'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${billing === 'annual' ? 'left-6' : 'left-0.5'}`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${billing === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Anual
          </span>
          <span className="bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            -20%
          </span>
        </div>

        {/* ── PLAN CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((p) => {
            const Icon = p.icon;
            const isPro = p.id === 'pro';
            const isCurrentPlan = isActive && user?.planTier === p.id;
            const displayPrice = billing === 'annual' ? p.annualPrice : p.monthlyPrice;
            const priceStr = displayPrice.toFixed(2).replace('.', ',');

            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border bg-card transition-all duration-300 overflow-hidden
                  ${p.color}
                  ${isPro
                    ? 'shadow-[0_0_40px_-5px_rgba(234,179,8,0.2)] md:scale-[1.03] md:-translate-y-1 z-10'
                    : 'hover:border-border/60 hover:-translate-y-0.5'
                  }
                  ${isCurrentPlan ? 'ring-2 ring-primary/50' : ''}
                `}
              >
                {/* Pro top accent line */}
                {isPro && (
                  <div className="h-[2px] w-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />
                )}

                {/* Badge */}
                {p.badge && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 translate-y-[-50%] mt-px">
                    <div className="bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap shadow-lg shadow-yellow-500/30">
                      {p.badge}
                    </div>
                  </div>
                )}

                <div className="p-6 flex flex-col gap-5 flex-1">
                  {/* Plan header */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl ${p.iconBg} flex items-center justify-center border border-white/5`}>
                        <Icon className={`w-4.5 h-4.5 ${p.iconColor}`} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-base leading-none">{p.name}</p>
                        {isCurrentPlan && (
                          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                            Plano atual
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                  </div>

                  {/* Price */}
                  <div className="space-y-0.5">
                    <div className="flex items-end gap-1">
                      <span className="text-xs text-muted-foreground font-medium self-start mt-1.5">R$</span>
                      <span className="text-4xl font-black text-foreground tracking-tight leading-none">{priceStr.split(',')[0]}</span>
                      <span className="text-xl font-black text-foreground/60 leading-none mb-0.5">,{priceStr.split(',')[1]}</span>
                      <span className="text-xs text-muted-foreground mb-0.5">/mês</span>
                    </div>
                    {billing === 'annual' && (
                      <p className={`text-[10px] font-semibold ${isPro ? 'text-yellow-500/80' : 'text-muted-foreground'}`}>
                        cobrado anualmente · R$ {p.annualTotal.toFixed(2).replace('.', ',')}/ano
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => !isCurrentPlan && handleCheckout(p.id, displayPrice)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200
                      ${isCurrentPlan
                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                        : isPro
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-foreground border border-white/5 hover:border-white/10 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                  >
                    {isCurrentPlan ? 'Plano atual' : isExpired ? `Reativar — ${p.cta}` : p.cta}
                    {!isCurrentPlan && <ArrowRight className="w-4 h-4" />}
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-border/30" />

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isPro ? 'bg-yellow-500/15' : 'bg-white/5'
                        }`}>
                          <Check className={`w-2.5 h-2.5 ${isPro ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── TRUST BAR ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pt-2">
          {[
            { icon: Shield, text: '7 dias grátis' },
            { icon: Star, text: 'Sem fidelidade · cancele quando quiser' },
            { icon: Headphones, text: 'Garantia de 30 dias ou seu dinheiro de volta' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* ── BACK LINK ── */}
        <div className="text-center pb-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default Subscription;
