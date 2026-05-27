import { useNavigate } from 'react-router-dom';
import { Crown, Zap, Clock, CheckCircle2, AlertTriangle, ArrowRight, Shield, Users, BarChart3, Headphones } from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { useLocalStorage } from '../hooks/useLocalStorage';

const plans = [
  {
    id: 'basic',
    name: 'Básico',
    price: 49,
    color: 'border-border/40',
    badge: '',
    icon: Zap,
    iconColor: 'text-muted-foreground',
    features: ['Até 5 operadores', 'Dashboard completo', 'Relatórios básicos', 'Suporte por email'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    color: 'border-primary/60',
    badge: 'MAIS POPULAR',
    icon: Crown,
    iconColor: 'text-primary',
    features: ['Até 20 operadores', 'Dashboard completo', 'Relatórios avançados', 'Suporte prioritário', 'Notificações push'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 199,
    color: 'border-yellow-500/40',
    badge: '',
    icon: Shield,
    iconColor: 'text-yellow-400',
    features: ['Operadores ilimitados', 'Dashboard completo', 'Relatórios completos', 'Suporte dedicado', 'Notificações push', 'API de integração'],
  },
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

  const isTrial = plan.status === 'trial';
  const isExpired = plan.status === 'expired';
  const isActive = plan.status === 'active';
  const isUrgent = isTrial && plan.hoursLeft <= 24;

  return (
    <div className="max-w-4xl mx-auto px-2 py-4 space-y-8">

      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold text-yellow-500 uppercase tracking-widest">
          <Crown className="w-3.5 h-3.5" />
          DESBLOQUEIE TODO O PODER DO NYTZERVISION
        </div>
        <h1 className="w-full text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight text-center">
          {isExpired ? 'Seu acesso expirou' : isActive ? 'Gerenciar Assinatura' : (
            <>Pare de perder dinheiro com <span className="text-yellow-500">operação amadora</span>.</>
          )}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto text-center px-4">
          {isExpired
            ? 'Renove agora para continuar gerenciando suas operações sem interrupção.'
            : isTrial
            ? `Seu trial ${isUrgent ? 'expira em breve' : `tem ${plan.daysLeft > 0 ? `${plan.daysLeft}d` : ''} ${plan.hoursLeft % 24}h restantes`}. Assine para continuar com acesso completo.`
            : 'Mais de 1.200 operadores já controlam suas equipes no piloto automático. Escolha o plano certo para sua escala — comece hoje, cancele quando quiser.'}
        </p>
      </div>

      {/* Status banner */}
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
              {isExpired ? 'Trial expirado' : `Trial: ${plan.daysLeft > 0 ? `${plan.daysLeft} dia(s)` : `${plan.hoursLeft}h`} restantes`}
            </p>
            {isTrial && (
              <div className="mt-1.5 w-full h-1.5 rounded-full bg-black/30 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-yellow-400'}`}
                  style={{ width: `${Math.max(2, (plan.hoursLeft / 72) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const Icon = p.icon;
          const isPro = p.id === 'pro';
          const isCurrentPlan = isActive && user?.planTier === p.id;
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border bg-card p-6 flex flex-col gap-4 transition-all ${p.color} ${
                isPro ? 'shadow-[0_0_30px_hsl(var(--primary)/0.1)] scale-[1.02]' : ''
              } ${isCurrentPlan ? 'ring-2 ring-primary/40' : ''}`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                  {p.badge}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${p.iconColor}`} />
                  <span className="font-bold text-foreground">{p.name}</span>
                  {isCurrentPlan && (
                    <span className="ml-auto text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">ATUAL</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">R$ {p.price}</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(p.id, p.price)}
                disabled={isCurrentPlan}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  isCurrentPlan
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : isPro
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_15px_hsl(var(--primary)/0.3)] hover:scale-[1.02]'
                    : 'bg-card border border-border hover:bg-accent text-foreground hover:scale-[1.02]'
                }`}
              >
                {isCurrentPlan ? 'Plano atual' : isExpired ? 'Reativar' : 'Assinar agora'}
                {!isCurrentPlan && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { icon: Shield, label: 'Pagamento seguro', sub: 'Mercado Pago' },
          { icon: Users, label: 'Cancele quando quiser', sub: 'Sem fidelidade' },
          { icon: Headphones, label: 'Suporte em PT', sub: 'Atendimento humano' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="rounded-xl border border-border/30 bg-card/50 p-3">
            <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button onClick={() => navigate('/')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Voltar ao dashboard
        </button>
      </div>
    </div>
  );
};

export default Subscription;
