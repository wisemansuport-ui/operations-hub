import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Zap, Clock, Check, AlertTriangle, ArrowRight, Shield,
  Sparkles, Rocket, TrendingDown, XCircle, Activity, Bell,
  BrainCircuit, Target, Users, Lock, RefreshCcw, Database,
  PhoneCall, Infinity, Star, ChevronDown, ChevronUp, Flame,
  BarChart3, Eye, KeyRound,
} from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '@/lib/utils';

// ─── PLANOS ───────────────────────────────────────────────────────────
const plans = [
  {
    id: 'starter',
    name: 'Executor',
    price: 97,
    icon: Rocket,
    tagline: 'Você ainda está no manual.',
    desc: 'Para quem está saindo das planilhas e precisa de controle real agora.',
    accent: 'from-zinc-600/30 to-zinc-800/10',
    features: [
      { label: 'Até 5 operadores simultâneos', hot: false },
      { label: 'Dashboard ao vivo com resultado líquido', hot: true },
      { label: 'Registro de remessas com cálculo automático', hot: false },
      { label: 'Metas com foguete animado', hot: false },
      { label: 'Notificações push em tempo real', hot: false },
      { label: 'Suporte por e-mail em até 48h', hot: false },
    ],
    highlighted: false,
    cta: 'Ativar Executor',
  },
  {
    id: 'pro',
    name: 'Dominante',
    price: 297,
    icon: Zap,
    badge: 'ESCOLHA DOS SÉRIOS',
    tagline: 'Sua operação não pode depender de amadores.',
    desc: 'Para quem já opera em volume e exige controle total — sem exceção.',
    accent: 'from-primary/15 to-primary/5',
    features: [
      { label: 'Até 25 operadores simultâneos', hot: false },
      { label: 'Tudo do Executor, sem limitações', hot: false },
      { label: 'Previsão Inteligente por IA (exclusivo)', hot: true },
      { label: 'Ciclos automáticos de operação', hot: true },
      { label: 'Fechamento de salário por operador', hot: true },
      { label: 'Chaves PIX integradas ao fluxo', hot: false },
      { label: 'Listas de contatos por operação', hot: false },
      { label: 'Log de sessão e trilha de auditoria', hot: false },
      { label: 'Lixeira com recuperação de dados', hot: false },
      { label: 'Suporte prioritário em até 4h', hot: false },
    ],
    highlighted: true,
    cta: 'Quero Dominar',
  },
  {
    id: 'enterprise',
    name: 'Soberano',
    price: 897,
    icon: Crown,
    tagline: 'Escalas assim não aceitam ferramentas comuns.',
    desc: 'Para estruturas que movem volume alto e não podem ter gargalos.',
    accent: 'from-amber-500/10 to-amber-900/5',
    features: [
      { label: 'Operadores ilimitados', hot: true },
      { label: 'Tudo do Dominante, sem teto', hot: false },
      { label: 'API e webhooks customizados', hot: true },
      { label: 'Gerente de conta exclusivo', hot: false },
      { label: 'Onboarding e treinamento 1:1', hot: false },
      { label: 'SLA de 99.9% de uptime garantido', hot: false },
      { label: 'Suporte 24/7 direto no WhatsApp', hot: true },
      { label: 'Chaves de acesso para revenda', hot: true },
    ],
    highlighted: false,
    cta: 'Falar com o time',
  },
];

// ─── DIFERENCIAIS ────────────────────────────────────────────────────
const diferenciais = [
  {
    icon: BrainCircuit,
    title: 'IA que prevê antes de errar',
    desc: 'O motor preditivo calcula sua velocidade de ganho diário e projeta com precisão quando você bate cada meta.',
  },
  {
    icon: Eye,
    title: 'Visão cirúrgica em tempo real',
    desc: 'Resultado líquido, salário, custos e tendência de cada operador — tudo ao vivo, sem fórmulas, sem planilha.',
  },
  {
    icon: Users,
    title: 'Multi-operador sem caos',
    desc: 'Cada operador no seu escopo. Você enxerga tudo. Eles enxergam só o que devem. Hierarquia perfeita.',
  },
  {
    icon: RefreshCcw,
    title: 'Ciclos que se replicam sozinhos',
    desc: 'Cadastre uma operação uma vez. Defina o ciclo. O sistema assume o controle e você cuida do que importa.',
  },
  {
    icon: Lock,
    title: 'Segurança de dado financeiro',
    desc: 'Log de sessão completo, trilha de auditoria e acesso por chave de ativação. Quem entra, você sabe.',
  },
  {
    icon: Target,
    title: 'Metas que disparam alertas',
    desc: 'Configure objetivos mensais ou contínuos. A IA avisa a tendência. O foguete celebra cada conquista.',
  },
];

// ─── ANTES vs DEPOIS ─────────────────────────────────────────────────
const comparativo = [
  { sem: 'Planilha trava na hora pior', com: 'Dashboard ao vivo sem latência' },
  { sem: 'Fechamento até 2h da manhã', com: 'Resultado líquido gerado automaticamente' },
  { sem: 'Operador some sem dar retorno', com: 'Log em tempo real de toda atividade' },
  { sem: 'Salário calculado na base da caneta', com: 'Fechamento automático por operador' },
  { sem: 'Meta no papel que ninguém acompanha', com: 'IA prevê quantos dias faltam para bater' },
  { sem: 'Dado perdido pra sempre', com: 'Lixeira com recuperação total de histórico' },
];

// ─── FAQs ─────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'Preciso instalar alguma coisa?',
    a: 'Não. O NytzerVision roda 100% no navegador. Se quiser, pode instalar como app no celular — mas isso é escolha, não obrigação.',
  },
  {
    q: 'E se eu tiver mais operadores do que o plano permite?',
    a: 'Você pode fazer upgrade a qualquer momento, sem perder histórico, configuração ou dados. Tudo migra automaticamente.',
  },
  {
    q: 'O que é a previsão por IA?',
    a: 'Um modelo preditivo embutido que analisa sua velocidade média de resultado por dia e projeta em quantos dias você bate cada meta — sem API externa, instantâneo e gratuito dentro do plano.',
  },
  {
    q: 'Como funciona a garantia de 30 dias?',
    a: 'Se por qualquer motivo não ficar satisfeito nos primeiros 30 dias, devolvemos 100% do valor pago. Sem perguntas, sem burocracia.',
  },
  {
    q: 'Os dados são meus?',
    a: 'Sempre. Você pode exportar tudo a qualquer momento. Não retemos, não vendemos, não compartilhamos nenhum dado operacional.',
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────
const Subscription = () => {
  const navigate = useNavigate();
  const plan = usePlan();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    <div className="relative min-h-full -mx-2 sm:-mx-4 -my-4 px-4 sm:px-6 py-10 bg-[#07070a] text-foreground overflow-hidden">
      
      {/* ─── AMBIENT ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] bg-primary/[0.07] rounded-full blur-[160px]" />
        <div className="absolute top-[500px] -left-60 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-0 -right-40 w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto space-y-20">

        {/* ─── STATUS BANNER ───────────────────────────────────────── */}
        {(isTrial || isExpired) && (
          <div className={cn(
            'rounded-2xl border p-4 flex items-center gap-4 backdrop-blur-sm',
            isExpired ? 'bg-destructive/10 border-destructive/40' : isUrgent ? 'bg-orange-500/10 border-orange-500/40' : 'bg-primary/10 border-primary/40'
          )}>
            {isExpired ? <AlertTriangle className="w-5 h-5 text-destructive shrink-0" /> : <Clock className="w-5 h-5 text-primary shrink-0" />}
            <div className="flex-1">
              <p className={cn('text-sm font-bold', isExpired ? 'text-destructive' : 'text-primary')}>
                {isExpired ? '⚠️ Trial encerrado. Cada minuto sem plano é operação sem controle.' : `Trial ativo: ${plan.daysLeft > 0 ? `${plan.daysLeft} dia(s)` : `${plan.hoursLeft}h`} restantes — não desperdice.`}
              </p>
              {isTrial && (
                <div className="mt-2 w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', isUrgent ? 'bg-destructive' : 'bg-primary')} style={{ width: `${Math.max(2, (plan.hoursLeft / 72) * 100)}%` }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── HERO ────────────────────────────────────────────────── */}
        <section className="text-center pt-4 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-[11px] font-black tracking-widest text-primary">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            NYTZERVISION — CENTRAL DE CONTROLE OPERACIONAL
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.03] text-foreground">
            {isExpired ? (
              <>Sua operação está <br /><span className="bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">cega sem o sistema.</span></>
            ) : isActive ? (
              <>Você tem o sistema. <br /><span className="bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">Agora escale sem teto.</span></>
            ) : (
              <>Você controla o que <br /><span className="bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">consegue enxergar.</span></>
            )}
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isExpired
              ? 'Renove agora. Metas, histórico e equipe esperando — sem perda de nenhum dado.'
              : isActive
              ? 'Faça upgrade e desbloqueie ciclos automáticos, IA preditiva e capacidade ilimitada.'
              : 'Enquanto você usa planilha, operadores somem, resultados são escondidos e dinheiro escoa em silêncio. Isso acaba aqui.'}
          </p>

          {!isActive && (
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              {['7 dias grátis sem cartão', '30 dias de garantia total', 'Cancele quando quiser', 'Dados seus — pra sempre'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />{t}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ─── ANTES vs DEPOIS ─────────────────────────────────────── */}
        {!isActive && (
          <section className="space-y-5">
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs font-black text-destructive uppercase tracking-widest">O que a planilha te custa todo dia</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {comparativo.map((c, i) => (
                <div key={i} className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-destructive/70 shrink-0 mt-0.5" />
                    <span className="text-sm text-destructive/80 font-medium">{c.sem}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-primary/90 font-medium">{c.com}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── PLANOS ──────────────────────────────────────────────── */}
        <section id="planos" className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-xs font-black text-primary uppercase tracking-widest">Escolha seu nível de controle</div>
            <p className="text-sm text-muted-foreground">Todos os planos incluem 7 dias grátis. Sem cartão. Sem armadilha.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {plans.map((p) => {
              const Icon = p.icon;
              const isCurrentPlan = isActive && user?.planTier === p.id;
              return (
                <div
                  key={p.id}
                  className={cn(
                    'relative rounded-3xl border flex flex-col backdrop-blur-sm transition-all duration-300 overflow-hidden',
                    p.highlighted
                      ? 'bg-gradient-to-b from-primary/[0.1] to-card/50 border-primary/50 shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.5)] md:scale-[1.04] md:-translate-y-2'
                      : 'bg-card/40 border-border/40 hover:border-primary/25 hover:shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.2)]',
                    isCurrentPlan && 'ring-2 ring-primary/60'
                  )}
                >
                  {/* Glow top bar */}
                  {p.highlighted && (
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}

                  {p.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black tracking-widest shadow-xl shadow-primary/30 flex items-center gap-1.5">
                      <Flame className="w-3 h-3" />{p.badge}
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1 space-y-5">
                    {/* Header */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', p.highlighted ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-primary/10 border border-primary/30 text-primary')}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black tracking-tight text-foreground">{p.name}</h3>
                            {isCurrentPlan && <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black tracking-wider">ATUAL</span>}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-semibold">{p.tagline}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>

                    {/* Price */}
                    <div className="py-4 border-y border-border/20">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-muted-foreground font-semibold">R$</span>
                        <span className={cn('text-5xl font-black tracking-tighter', p.highlighted ? 'text-primary' : 'text-foreground')}>{p.price}</span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Cobrado mensalmente · cancele quando quiser</p>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => handleCheckout(p.id, p.price)}
                      disabled={isCurrentPlan}
                      className={cn(
                        'w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200',
                        isCurrentPlan
                          ? 'bg-muted/30 text-muted-foreground cursor-not-allowed'
                          : p.highlighted
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.7)] hover:shadow-[0_15px_50px_-10px_hsl(var(--primary)/0.8)] hover:-translate-y-0.5'
                          : 'bg-foreground/5 text-foreground hover:bg-foreground/10 border border-border/60 hover:border-primary/40'
                      )}
                    >
                      {isCurrentPlan ? 'Plano atual' : isExpired ? 'Reativar agora' : p.cta}
                      {!isCurrentPlan && <ArrowRight className="w-4 h-4" />}
                    </button>

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1">
                      {p.features.map((f) => (
                        <li key={f.label} className="flex items-start gap-2.5">
                          <div className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5', f.hot ? 'bg-primary text-primary-foreground' : p.highlighted ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                            <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                          </div>
                          <span className={cn('text-sm leading-relaxed', f.hot ? 'text-foreground font-semibold' : 'text-foreground/80')}>
                            {f.label}
                            {f.hot && <span className="ml-1.5 text-[9px] text-primary font-black uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded">DESTAQUE</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── DIFERENCIAIS ────────────────────────────────────────── */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <div className="text-xs font-black text-primary uppercase tracking-widest">Por que NytzerVision é diferente</div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Não é mais uma ferramenta. <span className="text-primary">É sua sala de guerra.</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {diferenciais.map((d) => (
              <div key={d.title} className="group p-5 rounded-2xl bg-card/40 border border-border/40 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-300 flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                  <d.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground mb-1">{d.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── STATS / SOCIAL PROOF ────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '+1.200', label: 'Operações registradas', icon: BarChart3 },
              { value: '100%', label: 'Dados criptografados', icon: Lock },
              { value: '< 1s', label: 'Atualização em tempo real', icon: Activity },
              { value: '30 dias', label: 'Garantia sem perguntas', icon: Shield },
            ].map((s) => (
              <div key={s.label} className="p-5 rounded-2xl bg-card/40 border border-primary/10 backdrop-blur-sm text-center space-y-2 hover:border-primary/30 transition-all">
                <s.icon className="w-5 h-5 text-primary mx-auto" />
                <div className="text-2xl font-black text-foreground tracking-tight">{s.value}</div>
                <div className="text-[11px] text-muted-foreground font-medium leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── TRUST STRIP ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-primary/20 bg-card/30 backdrop-blur-sm px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          {[
            { icon: Check, label: '7 dias grátis' },
            { icon: Check, label: 'Sem fidelidade — cancele quando quiser' },
            { icon: Shield, label: 'Garantia de 30 dias ou dinheiro de volta' },
            { icon: Lock, label: 'Pagamento seguro · Mercado Pago' },
            { icon: Database, label: 'Seus dados são seus — sempre' },
            { icon: KeyRound, label: 'Acesso por chave de ativação controlado' },
          ].map((t) => (
            <span key={t.label} className="flex items-center gap-1.5">
              <t.icon className="w-3.5 h-3.5 text-primary" />{t.label}
            </span>
          ))}
        </div>

        {/* ─── FAQ ─────────────────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="text-center">
            <div className="text-xs font-black text-primary uppercase tracking-widest mb-2">Dúvidas que surgem</div>
            <h2 className="text-xl font-black text-foreground">Respostas diretas.</h2>
          </div>
          <div className="space-y-2 max-w-2xl mx-auto">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
                <button
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-bold text-foreground">{f.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/20 pt-4">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA FINAL ───────────────────────────────────────────── */}
        {!isActive && (
          <section className="relative rounded-3xl overflow-hidden border border-primary/30 p-10 text-center space-y-5">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] to-card/50" />
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-[11px] font-black tracking-widest text-primary">
              <Star className="w-3.5 h-3.5" />ÚLTIMO AVISO
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
              A planilha não vai te avisar <br />quando <span className="text-primary">o operador mentiu os números.</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
              O NytzerVision foi construído para quem entende que controle é dinheiro. Cada minuto de visibilidade que você não tem é margem que alguém está sugando da sua operação.
            </p>
            <button
              onClick={() => handleCheckout('pro', 297)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.7)] hover:shadow-[0_25px_70px_-15px_hsl(var(--primary)/0.9)] hover:-translate-y-1 transition-all duration-200"
            >
              <Zap className="w-5 h-5" />
              Assumir o controle agora
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-[11px] text-muted-foreground">7 dias grátis · sem cartão · cancele quando quiser</p>
          </section>
        )}

        <div className="text-center">
          <button onClick={() => navigate('/app')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar ao dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default Subscription;
