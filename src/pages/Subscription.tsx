import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, Sparkles, TrendingUp, Brain, Star, Shield, ArrowRight, Minus, Plus, FileSpreadsheet, AlertTriangle, Clock, Smartphone, Bell, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { SubscriptionHero } from '../components/heroes/SubscriptionHero';
import { cn } from '@/lib/utils';

const BENEFITS = [
  { icon: Brain, title: 'Motor de Decisão IA', desc: 'Recomendações em tempo real sobre cada operação, custo e meta.' },
  { icon: TrendingUp, title: 'Previsão Inteligente', desc: 'Projeções algorítmicas baseadas em performance histórica.' },
  { icon: Sparkles, title: 'Analytics Avançado', desc: 'Camada profunda de inteligência operacional sobre seus dados.' },
  { icon: Star, title: 'Prioridade em Novos Recursos', desc: 'Acesso antecipado a módulos lançados em ciclo fechado.' },
  { icon: Zap, title: 'Insights Exclusivos', desc: 'Padrões ocultos identificados automaticamente em sua operação.' },
  { icon: Crown, title: 'Performance Center', desc: 'Centro de controle premium com benchmarks e ranking interno.' },
];

const BASE_ADMIN = 49.9;
const BASE_OP = 19.9;

// Progressive discount tiers based on operator count
const TIERS = [
  { label: '1 OPERADOR', min: 1, max: 1, discount: 0 },
  { label: '2-3 OPERADORES', min: 2, max: 3, discount: 0.10 },
  { label: '4-6 OPERADORES', min: 4, max: 6, discount: 0.15 },
  { label: '7-9 OPERADORES', min: 7, max: 9, discount: 0.20 },
  { label: '10+ OPERADORES', min: 10, max: Infinity, discount: 0.25 },
];

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const tierFor = (n: number) => TIERS.find(t => n >= t.min && n <= t.max) ?? TIERS[0];

export default function Subscription() {
  const navigate = useNavigate();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const { users } = useFirestoreData();
  const [operators, setOperators] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<'solo' | 'team'>('team');

  const adminUser = user?.role === 'ADMIN'
    ? users.find(u => u.username === user.username)
    : users.find(u => u.username === user.affiliatedTo);

  const expDate = adminUser?.planExpiry ? new Date(adminUser.planExpiry) : null;
  const isExpired = expDate ? !isAfter(expDate, new Date()) : false;
  const status: 'active' | 'expired' = isExpired ? 'expired' : 'active';

  const currentTier = tierFor(operators);
  const opPrice = useMemo(() => BASE_OP * (1 - currentTier.discount), [currentTier]);
  const opTotal = useMemo(() => opPrice * operators, [opPrice, operators]);
  const planTotal = selectedPlan === 'team' ? BASE_ADMIN + opTotal : BASE_ADMIN;

  const nextTier = TIERS.find(t => t.min > operators);
  const opsToNext = nextTier ? nextTier.min - operators : 0;

  const handleSubscribe = () => {
    toast.success(`Assinatura iniciada — R$ ${fmt(planTotal)}/mês`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in relative z-10 w-full text-foreground">
      <SubscriptionHero
        status={status}
        expDateLabel={expDate ? format(expDate, "dd 'de' MMM, yyyy", { locale: ptBR }) : undefined}
      />

      {/* AIDA Narrative */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { tag: 'ATENÇÃO', text: 'Você já possui os dados. A maioria das pessoas falha porque não possui inteligência suficiente para agir sobre eles.' },
          { tag: 'INTERESSE', text: 'O sistema analisa desempenho, identifica oportunidades e transforma operações dispersas em decisões mais lucrativas.' },
          { tag: 'DESEJO', text: 'Saiba exatamente onde investir capital, quais operadores performam melhor e quais redes geram maior retorno — em tempo real.' },
          { tag: 'AÇÃO', text: 'Ative seu acesso premium agora e opere com a inteligência completa do Nytzer Vision Pro.' },
        ].map(b => (
          <div key={b.tag} className="surface-2 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <p className="text-[9px] uppercase tracking-[0.25em] font-black text-primary mb-2">{b.tag}</p>
            <p className="text-xs text-foreground/85 leading-relaxed">{b.text}</p>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-black tracking-tight text-foreground">O que você desbloqueia</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BENEFITS.map(b => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="surface-2 hairline-gold rounded-2xl p-5 group hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-black text-foreground tracking-tight mb-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plans */}
      <div className="text-center pt-4">
        <p className="text-[10px] tracking-[0.3em] font-black text-primary mb-2">ESCOLHA COMO VOCÊ QUER OPERAR</p>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
          Pague só pelo que você usa.{' '}
          <span className="gradient-gold-text">Sem surpresa no final do mês.</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-2">Comece solo ou com a sua equipe e economize até 25% com descontos progressivos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Solo */}
        <button
          type="button"
          onClick={() => setSelectedPlan('solo')}
          className={cn(
            'text-left relative rounded-2xl border p-6 flex flex-col transition-all',
            selectedPlan === 'solo'
              ? 'surface-3 hairline-gold border-primary/40 shadow-[0_0_40px_-20px_hsl(var(--primary)/0.4)]'
              : 'surface-2 border-border/50 hover:border-border'
          )}
        >
          <p className="text-[9px] uppercase tracking-[0.25em] font-black text-muted-foreground mb-2">PARA COMEÇAR</p>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-black tracking-tight">Admin Solo</h3>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-xs text-muted-foreground">R$</span>
            <span className="text-5xl font-black tabular-nums tracking-tighter">{fmt(BASE_ADMIN)}</span>
            <span className="text-sm text-muted-foreground">/mês</span>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Ideal para quem gerencia operações sozinho, sem equipe vinculada.</p>
          <ul className="space-y-2 text-sm">
            {[
              'Acesso completo ao painel de controle',
              'Dashboard com resultado líquido em tempo real',
              'Gestão de metas com IA preditiva',
              'Registro de remessas e depósitos',
              'Relatórios automáticos filtrados',
              'Chaves PIX integradas',
              'Histórico auditado com lixeira',
            ].map(f => (
              <li key={f} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </div>
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
            <li className="flex items-start gap-2.5 opacity-50">
              <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                <Minus className="w-2.5 h-2.5" />
              </div>
              <span className="line-through text-muted-foreground">Operadores vinculados</span>
            </li>
          </ul>
        </button>

        {/* Team */}
        <button
          type="button"
          onClick={() => setSelectedPlan('team')}
          className={cn(
            'text-left relative rounded-2xl border p-6 flex flex-col transition-all',
            selectedPlan === 'team'
              ? 'surface-3 hairline-gold border-primary/50 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.55)] scale-[1.01]'
              : 'surface-2 border-border/50 hover:border-border'
          )}
        >
          <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black tracking-widest shadow-lg inline-flex items-center gap-1">
            <Star className="w-3 h-3" /> RECOMENDADO
          </div>
          {selectedPlan === 'team' && (
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            </div>
          )}
          <p className="text-[9px] uppercase tracking-[0.25em] font-black text-primary mb-2">PARA ESCALAR</p>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-black tracking-tight">Admin + Operadores</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-5 flex-wrap">
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">R$</span>
              <span className="text-5xl font-black tabular-nums tracking-tighter gradient-gold-text">{fmt(BASE_ADMIN)}</span>
            </div>
            <span className="text-sm text-muted-foreground">+ R$ {fmt(BASE_OP)}/op</span>
          </div>
          <ul className="space-y-2 text-sm">
            {[
              { t: 'Tudo do plano Solo, sem limitação', bold: true },
              { t: 'Operadores ilimitados com hierarquia', bold: true },
              { t: 'Dashboard individual por operador' },
              { t: 'Log de atividade e sessão por operador', bold: true },
              { t: 'Fechamento automático de salário', bold: true },
              { t: 'Notificações push por operação' },
              { t: 'Ciclos automáticos de operação' },
              { t: 'Descontos progressivos até 25%', bold: true },
            ].map(f => (
              <li key={f.t} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </div>
                <span className={cn('text-foreground/90', f.bold && 'font-bold text-foreground')}>{f.t}</span>
              </li>
            ))}
          </ul>
        </button>
      </div>

      {/* Progressive discounts */}
      {selectedPlan === 'team' && (
        <div className="surface-2 hairline-gold rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black tracking-tight">Descontos progressivos</h3>
            <span className="text-xs text-muted-foreground">— quanto mais operadores, menor o preço por unidade</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
            {TIERS.map(t => {
              const active = t.label === currentTier.label;
              const unit = BASE_OP * (1 - t.discount);
              return (
                <div
                  key={t.label}
                  className={cn(
                    'rounded-xl p-3 text-center border transition-all',
                    active
                      ? 'surface-3 border-primary/40 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.5)]'
                      : 'surface-1 border-border/40'
                  )}
                >
                  <p className={cn('text-[9px] font-black tracking-widest mb-1', active ? 'text-primary' : 'text-muted-foreground')}>
                    {active ? 'ATUAL' : t.label}
                  </p>
                  {active && <p className="text-[9px] text-muted-foreground mb-1">{t.label}</p>}
                  <p className={cn('text-xl font-black tabular-nums', active ? 'gradient-gold-text' : 'text-foreground')}>
                    {t.discount === 0 ? '—' : `-${t.discount * 100}%`}
                  </p>
                  {active && <div className="w-6 h-px bg-primary/50 mx-auto my-1" />}
                  <p className="text-[10px] text-muted-foreground tabular-nums mt-1">R$ {fmt(unit)}/op</p>
                </div>
              );
            })}
          </div>

          {/* Operator selector */}
          <div className="surface-1 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-foreground">Quantidade de operadores</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">R$ {fmt(opPrice)}/operador</p>
            </div>
            <div className="inline-flex items-center gap-3 surface-2 rounded-xl p-1.5 border border-border/50">
              <button
                onClick={() => setOperators(Math.max(1, operators - 1))}
                className="w-8 h-8 rounded-lg bg-background/50 hover:bg-background text-foreground flex items-center justify-center transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-lg font-black tabular-nums gradient-gold-text">{operators}</span>
              <button
                onClick={() => setOperators(operators + 1)}
                className="w-8 h-8 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {nextTier && (
            <div className="mt-3 surface-1 rounded-xl px-4 py-2.5 flex items-center gap-2 border border-primary/15">
              <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
              <p className="text-xs text-foreground/90">
                +{opsToNext} operador{opsToNext > 1 ? 'es' : ''} para {nextTier.discount * 100}% de desconto
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="surface-2 hairline-gold rounded-2xl p-6">
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground/85">Plano {selectedPlan === 'team' ? 'Admin + Operadores' : 'Admin Solo'}</span>
            <span className="font-bold tabular-nums">R$ {fmt(BASE_ADMIN)}</span>
          </div>
          {selectedPlan === 'team' && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{operators} operador{operators > 1 ? 'es' : ''} × R$ {fmt(opPrice)}</span>
              <span className="font-bold tabular-nums text-foreground">R$ {fmt(opTotal)}</span>
            </div>
          )}
        </div>
        <div className="h-px bg-border/60 my-4" />
        <div className="flex items-center justify-between">
          <span className="text-base font-black">Total mensal</span>
          <span className="text-3xl font-black tabular-nums gradient-gold-text">R$ {fmt(planTotal)}</span>
        </div>

        <button
          onClick={handleSubscribe}
          className="w-full mt-6 py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.7)] transition-all"
        >
          <Zap className="w-4 h-4" />
          Assinar por R$ {fmt(planTotal)}/mês
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-muted-foreground text-center mt-3 inline-flex items-center gap-1.5 w-full justify-center">
          <Shield className="w-3 h-3" /> Pagamento seguro via PIX · Ativação instantânea
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Sem fidelidade</span>
        <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Garantia de 30 dias</span>
        <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Mais de 1.200 operadores ativos</span>
      </div>

      {!isExpired && (
        <div className="text-center">
          <button
            onClick={() => navigate('/app')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            ← Voltar ao dashboard
          </button>
        </div>
      )}
    </div>
  );
}
