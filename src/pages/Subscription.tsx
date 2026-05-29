import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Zap,
  Clock,
  Check,
  AlertTriangle,
  ArrowRight,
  Shield,
  Sparkles,
  Rocket,
  TrendingDown,
  XCircle,
  FileSpreadsheet,
  Activity,
  Bell,
} from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    icon: Rocket,
    desc: 'Pra quem está saindo da planilha agora.',
    features: [
      'Até 5 operadores ativos',
      'Dashboard em tempo real',
      'Notificações push básicas',
      'Relatórios automáticos',
      'Suporte por e-mail (48h)',
    ],
    highlighted: false,
    cta: 'Começar agora',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 297,
    icon: Zap,
    badge: 'MAIS ESCOLHIDO',
    desc: 'O plano dos times que operam sério e querem escalar.',
    features: [
      'Até 25 operadores ativos',
      'Tudo do Starter +',
      'Gestão de PIX e custos',
      'Metas com foguete animado',
      'Ranking e gamificação',
      'Notificações push em massa',
      'Suporte prioritário (4h)',
    ],
    highlighted: true,
    cta: 'Assinar o Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 897,
    icon: Crown,
    desc: 'Pra operações de alta escala que não podem parar.',
    features: [
      'Operadores ilimitados',
      'Tudo do Pro +',
      'Gerente de conta dedicado',
      'SLA de 99,9% garantido',
      'Onboarding e treinamento 1:1',
      'API e webhooks personalizados',
      'Suporte 24/7 via WhatsApp',
    ],
    highlighted: false,
    cta: 'Falar com vendas',
  },
];

const painPoints = [
  { icon: FileSpreadsheet, title: 'Planilhas que travam', desc: 'Fórmulas quebradas, células sobrescritas e prejuízo silencioso.' },
  { icon: Clock, title: 'Fechamento até 2h da manhã', desc: 'Consolidando números que o operador já mandou errado no WhatsApp.' },
  { icon: XCircle, title: 'Operador parado por horas', desc: 'Sem visibilidade em tempo real, o problema só chega tarde demais.' },
];

const wins = [
  { icon: Activity, title: 'Tempo real, de verdade' },
  { icon: Bell, title: 'Push no celular sempre' },
  { icon: Shield, title: 'Histórico auditado e seguro' },
];

const Subscription = () => {
  const navigate = useNavigate();
  const plan = usePlan();
  const [user] = useLocalStorage<any>('nytzer-user', null);

  const handleCheckout = async (planId: string, price: number) => {
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          price,
          userId: user?.id || user?.username,
          userEmail: user?.email || `${user?.username}@nytzervision.com`,
          userName: user?.fullName || user?.username,
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else alert('Erro ao criar checkout. Tente novamente.');
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Erro de conexão. Tente novamente.');
    }
  };

  const isTrial = plan.status === 'trial';
  const isExpired = plan.status === 'expired';
  const isActive = plan.status === 'active';
  const isUrgent = isTrial && plan.hoursLeft <= 24;

  return (
    <div className="relative min-h-full -mx-2 sm:-mx-4 -my-4 px-4 sm:px-6 py-10 bg-[#07070a] text-foreground overflow-hidden rounded-xl">
      {/* Ambient gold glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute top-[400px] -left-40 w-[500px] h-[500px] bg-primary/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-primary/[0.05] rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Status banner */}
        {(isTrial || isExpired) && (
          <div
            className={cn(
              'rounded-2xl border p-4 flex items-center gap-3 backdrop-blur-sm',
              isExpired
                ? 'bg-destructive/10 border-destructive/40'
                : isUrgent
                ? 'bg-orange-500/10 border-orange-500/40'
                : 'bg-primary/10 border-primary/40'
            )}
          >
            {isExpired ? (
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-primary shrink-0" />
            )}
            <div className="flex-1">
              <p className={cn('text-sm font-bold', isExpired ? 'text-destructive' : 'text-primary')}>
                {isExpired
                  ? 'Seu trial expirou — reative para continuar operando.'
                  : `Trial: ${plan.daysLeft > 0 ? `${plan.daysLeft} dia(s)` : `${plan.hoursLeft}h`} restantes`}
              </p>
              {isTrial && (
                <div className="mt-2 w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', isUrgent ? 'bg-destructive' : 'bg-primary')}
                    style={{ width: `${Math.max(2, (plan.hoursLeft / 72) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ HERO ============ */}
        <section className="text-center pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-[11px] font-bold tracking-widest text-primary mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            DESBLOQUEIE TODO O PODER DO NYTZERVISION
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] text-foreground mb-5">
            {isExpired ? (
              <>Reative seu acesso e <span className="bg-gradient-to-r from-primary via-[#fde68a] to-primary bg-clip-text text-transparent">volte ao controle.</span></>
            ) : isActive ? (
              <>Sua operação está <span className="bg-gradient-to-r from-primary via-[#fde68a] to-primary bg-clip-text text-transparent">no piloto automático.</span></>
            ) : (
              <>Pare de perder dinheiro com<br /><span className="bg-gradient-to-r from-primary via-[#fde68a] to-primary bg-clip-text text-transparent">operação amadora.</span></>
            )}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {isExpired
              ? 'Renove agora e mantenha equipe, metas e relatórios sem interrupção.'
              : isActive
              ? 'Quer escalar mais? Faça upgrade e desbloqueie ainda mais poder.'
              : 'Mais de 1.200 operações já saíram da planilha. Escolha o plano certo pra sua escala — comece hoje, cancele quando quiser.'}
          </p>
        </section>

        {/* ============ A DOR (mini) ============ */}
        {!isActive && (
          <section>
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <TrendingDown className="w-4 h-4" /> O que você está pagando pela planilha
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {painPoints.map((p) => (
                <div
                  key={p.title}
                  className="p-5 rounded-2xl bg-card/30 border border-destructive/20 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center flex-shrink-0">
                      <p.icon className="w-4.5 h-4.5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{p.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ PLANOS ============ */}
        <section id="planos">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const Icon = p.icon;
              const isCurrentPlan = isActive && user?.planTier === p.id;
              return (
                <div
                  key={p.id}
                  className={cn(
                    'relative rounded-3xl border p-6 flex flex-col backdrop-blur-sm transition-all',
                    p.highlighted
                      ? 'bg-gradient-to-b from-primary/[0.08] to-card/40 border-primary/50 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.45)] md:scale-[1.03]'
                      : 'bg-card/40 border-border/40 hover:border-primary/30',
                    isCurrentPlan && 'ring-2 ring-primary/50'
                  )}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black tracking-widest shadow-lg">
                      {p.badge}
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        p.highlighted
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 border border-primary/30 text-primary'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-foreground">{p.name}</h3>
                    {isCurrentPlan && (
                      <span className="ml-auto text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold tracking-wider">
                        ATUAL
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-5 min-h-[40px]">{p.desc}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <span className="text-4xl font-black tracking-tighter text-foreground">{p.price}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckout(p.id, p.price)}
                    disabled={isCurrentPlan}
                    className={cn(
                      'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mb-6',
                      isCurrentPlan
                        ? 'bg-muted/40 text-muted-foreground cursor-not-allowed'
                        : p.highlighted
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.6)]'
                        : 'bg-foreground/5 text-foreground hover:bg-foreground/10 border border-border/60'
                    )}
                  >
                    {isCurrentPlan ? 'Plano atual' : isExpired ? 'Reativar' : p.cta}
                    {!isCurrentPlan && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <ul className="space-y-2.5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                            p.highlighted ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </div>
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============ TRANSFORMAÇÃO ============ */}
        <section className="grid md:grid-cols-3 gap-4">
          {wins.map((w) => (
            <div
              key={w.title}
              className="p-5 rounded-2xl bg-card/40 border border-primary/15 backdrop-blur-sm flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <w.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground">{w.title}</span>
            </div>
          ))}
        </section>

        {/* ============ Trust strip ============ */}
        <div className="rounded-2xl border border-primary/20 bg-card/30 backdrop-blur-sm px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> 7 dias grátis</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Sem fidelidade · cancele quando quiser</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Garantia de 30 dias ou seu dinheiro de volta</span>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> Pagamento seguro · Mercado Pago</span>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/app')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar ao dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
