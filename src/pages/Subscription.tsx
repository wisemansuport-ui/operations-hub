import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Crown, Zap, Sparkles, TrendingUp, Brain, Lock, Star, Shield, ArrowRight } from 'lucide-react';
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

const PLANS = [
  {
    id: 'monthly' as const,
    name: 'Mensal',
    price: 500,
    period: '/mês',
    tagline: 'Flexibilidade total. Cancele quando quiser.',
    features: ['Acesso completo à plataforma', 'Motor de Decisão ativo', 'Suporte prioritário'],
  },
  {
    id: 'yearly' as const,
    name: 'Anual',
    price: 4200,
    monthly: 350,
    period: '/ano',
    tagline: 'Maior economia. Compromisso com escala.',
    badge: 'MAIS ESCOLHIDO',
    saving: 30,
    highlight: true,
    features: [
      'Tudo do Mensal',
      'Economia de R$ 1.800/ano',
      'Onboarding dedicado',
      'Previsão estendida 12 meses',
      'Acesso antecipado a novos módulos',
    ],
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const { users } = useFirestoreData();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  const adminUser = user?.role === 'ADMIN'
    ? users.find(u => u.username === user.username)
    : users.find(u => u.username === user.affiliatedTo);

  const expDate = adminUser?.planExpiry ? new Date(adminUser.planExpiry) : null;
  const isExpired = expDate ? !isAfter(expDate, new Date()) : false;
  const status: 'active' | 'expired' = isExpired ? 'expired' : 'active';

  const handleCopyPix = () => {
    navigator.clipboard.writeText('pix@nytzervision.com');
    toast.success('Chave PIX copiada!');
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
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">Escolha seu acesso</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Cancele quando quiser. Sem fidelidade.</p>
          </div>
          <div className="inline-flex p-1 rounded-full surface-1">
            {(['monthly', 'yearly'] as const).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={cn(
                  'px-4 py-1.5 text-xs font-bold rounded-full transition-all',
                  billing === b ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
                )}
              >
                {b === 'monthly' ? 'Mensal' : 'Anual · -30%'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl border p-6 flex flex-col transition-all',
                plan.highlight
                  ? 'surface-3 hairline-gold border-primary/40 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.45)] scale-[1.01]'
                  : 'surface-2 border-border/50'
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black tracking-widest shadow-lg">
                  {plan.badge}
                </div>
              )}
              <div className="flex items-center gap-2.5 mb-2">
                {plan.highlight ? <Crown className="w-5 h-5 text-primary" /> : <Shield className="w-5 h-5 text-muted-foreground" />}
                <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5">{plan.tagline}</p>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <span className="text-5xl font-black tabular-nums tracking-tighter gradient-gold-text">
                    {(plan.monthly ?? plan.price).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.monthly ? '/mês' : plan.period}</span>
                </div>
                {plan.monthly && (
                  <p className="text-[11px] text-primary font-semibold mt-1">
                    R$ {plan.price.toLocaleString('pt-BR')} cobrado anualmente · economia de R$ 1.800
                  </p>
                )}
              </div>

              <button
                onClick={handleCopyPix}
                className={cn(
                  'w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all mb-5',
                  plan.highlight
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]'
                    : 'bg-foreground/5 text-foreground hover:bg-foreground/10 border border-border'
                )}
              >
                {plan.highlight ? 'Ativar acesso elite' : 'Assinar mensal'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <ul className="space-y-2.5 text-sm">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className={cn(
                      'w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                      plan.highlight ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </div>
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* PIX Payment Box */}
      <div className="surface-2 hairline-gold rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground tracking-tight">Pagamento via PIX</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Envie o comprovante para liberar acesso imediato.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 p-3 rounded-lg bg-background border border-border text-primary font-mono text-sm">
            pix@nytzervision.com
          </code>
          <button
            onClick={handleCopyPix}
            className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
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
