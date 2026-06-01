import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, ArrowRight, Shield, Sparkles, Zap, XCircle,
  TrendingUp, Users, Lock, Database, Clock, AlertTriangle,
  Minus, Plus, ChevronDown, ChevronUp, Star, Flame,
  FileX, MessagesSquare, BarChart3, BrainCircuit, Target,
  PhoneOff, Infinity as InfinityIcon,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '@/lib/utils';

// ─── CONFIG ──────────────────────────────────────────────────────────
const BASE_PRICE = 49.90;      // Admin solo
const OPERATOR_BASE = 19.90;   // Preço cheio por operador

const discountTiers = [
  { min: 1,  max: 1,   discount: 0,    label: '1 OPERADOR' },
  { min: 2,  max: 3,   discount: 0.10, label: '2-3 OPERADORES' },
  { min: 4,  max: 6,   discount: 0.15, label: '4-6 OPERADORES' },
  { min: 7,  max: 9,   discount: 0.20, label: '7-9 OPERADORES' },
  { min: 10, max: 999, discount: 0.25, label: '10+ OPERADORES' },
];

const getDiscount = (qty: number) =>
  discountTiers.find(t => qty >= t.min && qty <= t.max)?.discount ?? 0;

const getTierLabel = (qty: number) =>
  discountTiers.find(t => qty >= t.min && qty <= t.max)?.label ?? '';

const nextTierMessage = (qty: number): string | null => {
  const next = discountTiers.find(t => t.min > qty);
  if (!next || next.discount === 0) return null;
  const need = next.min - qty;
  return `+${need} operador${need > 1 ? 'es' : ''} para ${(next.discount * 100).toFixed(0)}% de desconto`;
};

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── GATILHOS DA DOR ─────────────────────────────────────────────────
const painPoints = [
  { icon: FileX, title: 'Planilha que mente', desc: 'Cada operador edita do jeito que quer. O resultado que você vê não é o resultado real.' },
  { icon: Clock, title: 'Fechamento no escuro', desc: 'Você consolida números às 2h da manhã porque ninguém entrega no formato certo.' },
  { icon: PhoneOff, title: 'Operador some, prejuízo fica', desc: 'Sem rastreamento em tempo real, quando o problema aparece já é tarde demais.' },
  { icon: MessagesSquare, title: 'WhatsApp vira sistema', desc: 'Depósito por print, saque por áudio. Isso não é gestão — é improviso caro.' },
  { icon: BarChart3, title: 'Meta que ninguém cumpre', desc: 'Você define o objetivo. Ninguém acompanha. No fim do mês, surpresa desagradável.' },
  { icon: AlertTriangle, title: 'Dado perdido para sempre', desc: 'Arquivo corrompido, aba deletada, fórmula quebrada. O histórico que deveria ser ouro, virou lixo.' },
];

// ─── FEATURES SOLO ────────────────────────────────────────────────────
const featuresSolo = [
  { label: 'Acesso completo ao painel de controle', included: true },
  { label: 'Dashboard com resultado líquido em tempo real', included: true },
  { label: 'Gestão de metas com IA preditiva', included: true },
  { label: 'Registro de remessas e depósitos', included: true },
  { label: 'Relatórios automáticos filtrados', included: true },
  { label: 'Chaves PIX integradas', included: true },
  { label: 'Histórico auditado com lixeira', included: true },
  { label: 'Operadores vinculados', included: false },
];

// ─── FEATURES COM OPERADORES ────────────────────────────────────────
const featuresOp = [
  { label: 'Tudo do plano Solo, sem limitação', included: true, bold: false },
  { label: 'Operadores ilimitados com hierarquia', included: true, bold: true },
  { label: 'Dashboard individual por operador', included: true, bold: false },
  { label: 'Log de atividade e sessão por operador', included: true, bold: true },
  { label: 'Fechamento automático de salário', included: true, bold: true },
  { label: 'Notificações push por operação', included: true, bold: false },
  { label: 'Ciclos automáticos de operação', included: true, bold: false },
  { label: 'Descontos progressivos até 25%', included: true, bold: true },
];

// ─── FAQs ─────────────────────────────────────────────────────────────
const faqs = [
  { q: 'Preciso instalar alguma coisa?', a: 'Não. O NytzerVision funciona direto no navegador, em qualquer dispositivo. Se quiser, pode instalar como app no celular via PWA — mas é uma opção, não obrigação.' },
  { q: 'Posso mudar de plano depois?', a: 'Sim. Você adiciona ou remove operadores quando quiser. O valor é ajustado automaticamente no ciclo seguinte, sem burocracia.' },
  { q: 'Meus dados ficam seguros?', a: 'Seus dados são seus. Criptografia ponta a ponta, log de sessão completo e backup automático. Você pode exportar tudo a qualquer momento.' },
  { q: 'O que é a previsão por IA?', a: 'Um modelo preditivo embutido que analisa sua velocidade de resultado por dia e calcula, em tempo real, quantos dias faltam para bater cada meta. Sem API externa. Sem custo adicional.' },
  { q: 'Como funciona a garantia de 30 dias?', a: 'Se por qualquer motivo não ficar satisfeito nos primeiros 30 dias, devolvemos 100% do valor. Sem questionamentos, sem burocracia, sem letras miúdas.' },
];

// ─── COMPONENT ────────────────────────────────────────────────────────
export default function Subscription() {
  const navigate = useNavigate();
  const [user] = useLocalStorage<any>('nytzer-user', null);

  const [selectedPlan, setSelectedPlan] = useState<'solo' | 'operators'>('operators');
  const [operatorQty, setOperatorQty] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const discount = getDiscount(operatorQty);
  const pricePerOp = OPERATOR_BASE * (1 - discount);
  const operatorsTotal = operatorQty * pricePerOp;
  const grandTotal = selectedPlan === 'solo' ? BASE_PRICE : BASE_PRICE + operatorsTotal;

  const nextMsg = nextTierMessage(operatorQty);
  const activeTierIdx = discountTiers.findIndex(t => operatorQty >= t.min && operatorQty <= t.max);

  const handleCheckout = async () => {
    const planId = selectedPlan === 'solo' ? 'solo' : 'operators';
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          price: grandTotal,
          operatorQty: selectedPlan === 'operators' ? operatorQty : 0,
          userId: user?.id || user?.username,
          userEmail: user?.email || `${user?.username}@nytzervision.com`,
          userName: user?.fullName || user?.username,
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else alert('Erro ao criar checkout. Tente novamente.');
    } catch {
      alert('Erro de conexão. Tente novamente.');
    }
  };

  return (
    <div className="relative min-h-full -mx-2 sm:-mx-4 -my-4 px-4 sm:px-6 py-10 bg-[#07070a] text-foreground overflow-hidden">

      {/* ─── AMBIENT ────────────────────────────────────────────── */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] bg-primary/[0.07] rounded-full blur-[180px]" />
        <div className="absolute top-[600px] -left-60 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[130px]" />
        <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      </div>

      <div className="max-w-5xl mx-auto space-y-20">

        {/* ─── HERO ────────────────────────────────────────────── */}
        <section className="text-center space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-[11px] font-black tracking-widest text-primary">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            NYTZERVISION — CONTROLE REAL. RESULTADO VISÍVEL.
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.03] text-foreground">
            Você não tem um problema<br />
            de operação. Você tem um problema<br />
            <span className="bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
              de visibilidade.
            </span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Enquanto você ainda consolida números em planilha, dinheiro some, operador mente e você não sabe —
            porque <strong className="text-foreground">o que você não enxerga, você não controla.</strong>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            {['Sem fidelidade', 'Cancele quando quiser', '30 dias de garantia total', 'Pagamento seguro via PIX'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary" />{t}
              </span>
            ))}
          </div>
        </section>

        {/* ─── DOR ─────────────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-xs font-black text-destructive uppercase tracking-widest">
              Reconhece alguma dessas situações?
            </span>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {painPoints.map((p) => (
              <div key={p.title} className="p-4 rounded-2xl bg-destructive/5 border border-destructive/15 backdrop-blur-sm hover:border-destructive/30 transition-all group">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0 group-hover:bg-destructive/15 transition-all">
                    <p.icon className="w-4 h-4 text-destructive/80" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground mb-1">{p.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Se você se identificou com qualquer uma dessas situações, <strong className="text-foreground">o NytzerVision foi feito para você.</strong>
          </p>
        </section>

        {/* ─── PLANOS ──────────────────────────────────────────── */}
        <section id="planos" className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-xs font-black text-primary uppercase tracking-widest">Escolha como você quer operar</div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Pague só pelo que você usa. <span className="text-primary">Sem surpresa no final do mês.</span>
            </h2>
            <p className="text-sm text-muted-foreground">Comece solo ou com a sua equipe e economize até 25% com descontos progressivos.</p>
          </div>

          {/* Dois planos lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* SOLO */}
            <button
              onClick={() => setSelectedPlan('solo')}
              className={cn(
                'relative rounded-3xl border p-6 flex flex-col text-left backdrop-blur-sm transition-all duration-300',
                selectedPlan === 'solo'
                  ? 'bg-primary/[0.06] border-primary/50 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.3)]'
                  : 'bg-card/40 border-border/40 hover:border-primary/25'
              )}
            >
              {selectedPlan === 'solo' && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                </div>
              )}
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Para começar</div>
              <h3 className="text-2xl font-black text-foreground mb-3">Admin Solo</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-sm text-muted-foreground font-semibold">R$</span>
                <span className="text-4xl font-black tracking-tighter text-foreground">{fmtBRL(BASE_PRICE)}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <p className="text-xs text-muted-foreground mb-5">Ideal para quem gerencia operações sozinho, sem equipe vinculada.</p>
              <ul className="space-y-2 flex-1">
                {featuresSolo.map(f => (
                  <li key={f.label} className="flex items-center gap-2.5">
                    {f.included
                      ? <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-primary" strokeWidth={3.5} /></div>
                      : <div className="w-4 h-4 rounded-full bg-muted/30 border border-border/40 flex items-center justify-center shrink-0"><Minus className="w-2.5 h-2.5 text-muted-foreground/50" strokeWidth={3} /></div>}
                    <span className={cn('text-sm', f.included ? 'text-foreground/90' : 'text-muted-foreground/50 line-through')}>{f.label}</span>
                  </li>
                ))}
              </ul>
            </button>

            {/* COM OPERADORES */}
            <button
              onClick={() => setSelectedPlan('operators')}
              className={cn(
                'relative rounded-3xl border p-6 flex flex-col text-left backdrop-blur-sm transition-all duration-300',
                selectedPlan === 'operators'
                  ? 'bg-primary/[0.09] border-primary/60 shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.45)]'
                  : 'bg-card/40 border-border/40 hover:border-primary/30'
              )}
            >
              {/* Badge recomendado */}
              <div className="absolute -top-3.5 right-5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black tracking-widest flex items-center gap-1.5 shadow-xl shadow-primary/30">
                <Star className="w-3 h-3" /> RECOMENDADO
              </div>
              {selectedPlan === 'operators' && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                </div>
              )}
              {/* Glow top line */}
              <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-3xl bg-gradient-to-r from-transparent via-primary to-transparent" />

              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Para escalar</div>
              <h3 className="text-2xl font-black text-foreground mb-3">Admin + Operadores</h3>

              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground font-semibold">R$</span>
                  <span className="text-4xl font-black tracking-tighter text-foreground">{fmtBRL(BASE_PRICE)}</span>
                </div>
                <span className="text-sm text-muted-foreground">+ R$ {fmtBRL(pricePerOp)}/op</span>
              </div>

              {discount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/15 border border-primary/30 text-xs font-black text-primary mb-4 w-fit">
                  <TrendingUp className="w-3.5 h-3.5" />
                  ATÉ {(discount * 100).toFixed(0)}% DE DESCONTO ATIVO
                </div>
              )}
              {discount === 0 && <div className="mb-4" />}

              <ul className="space-y-2 flex-1">
                {featuresOp.map(f => (
                  <li key={f.label} className="flex items-center gap-2.5">
                    <div className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0', f.bold ? 'bg-primary text-primary-foreground' : 'bg-primary/20 border border-primary/30')}>
                      <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                    </div>
                    <span className={cn('text-sm', f.bold ? 'text-foreground font-bold' : 'text-foreground/85')}>{f.label}</span>
                  </li>
                ))}
              </ul>
            </button>
          </div>

          {/* ─── DESCONTOS PROGRESSIVOS ─────────────────────────── */}
          {selectedPlan === 'operators' && (
            <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-black text-foreground">Descontos progressivos</span>
                <span className="text-xs text-muted-foreground ml-1">— quanto mais operadores, menor o preço por unidade</span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {discountTiers.map((t, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-xl border p-3 text-center transition-all duration-200',
                      i === activeTierIdx
                        ? 'bg-primary/15 border-primary/50 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]'
                        : 'bg-background/40 border-border/30'
                    )}
                  >
                    {i === activeTierIdx && (
                      <div className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">ATUAL</div>
                    )}
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t.label}</div>
                    <div className={cn('text-base font-black', i === activeTierIdx ? 'text-primary' : 'text-foreground')}>
                      {t.discount === 0 ? '—' : `-${(t.discount * 100).toFixed(0)}%`}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      R$ {fmtBRL(OPERATOR_BASE * (1 - t.discount))}/op
                    </div>
                  </div>
                ))}
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-between bg-background/50 border border-border/40 rounded-2xl px-5 py-4">
                <div>
                  <p className="text-sm font-black text-foreground">Quantidade de operadores</p>
                  <p className="text-xs text-muted-foreground">R$ {fmtBRL(pricePerOp)}/operador{discount > 0 ? ` (${(discount * 100).toFixed(0)}% off)` : ''}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setOperatorQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <Minus className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="text-xl font-black text-primary w-8 text-center tabular-nums">{operatorQty}</span>
                  <button
                    onClick={() => setOperatorQty(q => q + 1)}
                    className="w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <Plus className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              </div>

              {/* Próximo nível de desconto */}
              {nextMsg && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
                  <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-primary">{nextMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* ─── RESUMO DO TOTAL ─────────────────────────────────── */}
          <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plano Admin {selectedPlan === 'solo' ? 'Solo' : '+ Operadores'}</span>
                <span className="text-foreground font-semibold tabular-nums">R$ {fmtBRL(BASE_PRICE)}</span>
              </div>
              {selectedPlan === 'operators' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{operatorQty} operador{operatorQty > 1 ? 'es' : ''} × R$ {fmtBRL(pricePerOp)}</span>
                  <span className="text-foreground font-semibold tabular-nums">R$ {fmtBRL(operatorsTotal)}</span>
                </div>
              )}
              {selectedPlan === 'operators' && discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary font-semibold">Desconto aplicado ({(discount * 100).toFixed(0)}%)</span>
                  <span className="text-primary font-semibold tabular-nums">-R$ {fmtBRL(operatorQty * OPERATOR_BASE * discount)}</span>
                </div>
              )}
              <div className="border-t border-border/30 pt-3 flex items-center justify-between">
                <span className="text-base font-black text-foreground">Total mensal</span>
                <span className="text-3xl font-black text-foreground tabular-nums">R$ {fmtBRL(grandTotal)}</span>
              </div>
            </div>

            {/* CTA principal */}
            <div className="px-5 pb-5">
              <button
                onClick={handleCheckout}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base flex items-center justify-center gap-2.5 shadow-[0_15px_50px_-15px_hsl(var(--primary)/0.7)] hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.9)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Zap className="w-5 h-5" />
                Assinar por R$ {fmtBRL(grandTotal)}/mês
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-[11px] text-muted-foreground mt-3 flex items-center justify-center gap-2">
                <Lock className="w-3 h-3" /> Pagamento seguro via PIX · Ativação instantânea
              </p>
            </div>
          </div>
        </section>

        {/* ─── POR QUE NYTZERVISION ────────────────────────────── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-xs font-black text-primary uppercase tracking-widest">O que muda da noite pro dia</div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Mais do que um sistema. <span className="text-primary">Uma sala de guerra.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: BrainCircuit, title: 'IA que prevê antes de errar', desc: 'Calcula velocidade de resultado e projeta quantos dias faltam para bater cada meta — sem fórmula, sem planilha.' },
              { icon: BarChart3, title: 'Dashboard que não mente', desc: 'Resultado líquido, custo por conta, salário e tendência. Tudo ao vivo, atualizado em menos de 1 segundo.' },
              { icon: Users, title: 'Cada operador no seu lugar', desc: 'Hierarquia real. Você enxerga tudo. Eles enxergam só o que devem. Sem acesso indevido, sem dado exposto.' },
              { icon: Target, title: 'Meta com acompanhamento real', desc: 'Foguete animado, previsão de dias e alerta de tendência. A meta sai do papel e vive no sistema.' },
              { icon: Database, title: 'Histórico que não some', desc: 'Lixeira com recuperação, log auditado e backup automático. Nenhum dado operacional se perde.' },
              { icon: Lock, title: 'Quem acessa, você sabe', desc: 'Log de sessão completo, acesso por chave de ativação e rastreamento em tempo real de quem está operando.' },
            ].map(d => (
              <div key={d.title} className="group p-5 rounded-2xl bg-card/40 border border-border/40 backdrop-blur-sm hover:border-primary/25 hover:bg-primary/[0.02] transition-all duration-300 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-all">
                  <d.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground mb-1">{d.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── STATS ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: '+1.200', label: 'Operações gerenciadas', icon: BarChart3 },
            { value: '100%', label: 'Dados criptografados', icon: Lock },
            { value: '< 1s', label: 'Atualização em tempo real', icon: Zap },
            { value: '30 dias', label: 'Garantia incondicional', icon: Shield },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-2xl bg-card/40 border border-primary/10 text-center space-y-2 hover:border-primary/25 transition-all">
              <s.icon className="w-5 h-5 text-primary mx-auto" />
              <div className="text-2xl font-black text-foreground tracking-tight">{s.value}</div>
              <div className="text-[11px] text-muted-foreground font-medium leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ─── FAQ ─────────────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="text-center">
            <div className="text-xs font-black text-primary uppercase tracking-widest mb-2">Dúvidas frequentes</div>
            <h2 className="text-xl font-black text-foreground">Respostas diretas. Sem enrolação.</h2>
          </div>
          <div className="space-y-2 max-w-2xl mx-auto">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
                <button className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="text-sm font-bold text-foreground">{f.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-primary shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
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

        {/* ─── CTA FINAL ───────────────────────────────────────── */}
        <section className="relative rounded-3xl overflow-hidden border border-primary/30 p-10 text-center space-y-5">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] to-card/60" />
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-[11px] font-black tracking-widest text-primary">
            <Flame className="w-3.5 h-3.5" /> ÚLTIMA CHAMADA
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
            Cada dia sem controle real<br />é um dia que alguém sai ganhando <span className="text-primary">às suas custas.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Você não precisa de mais uma planilha. Você precisa de um sistema que funciona enquanto você dorme, que avisa quando algo muda e que nunca esconde o número real.
          </p>
          <button
            onClick={handleCheckout}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.7)] hover:shadow-[0_25px_70px_-15px_hsl(var(--primary)/0.9)] hover:-translate-y-1 transition-all duration-200"
          >
            <Zap className="w-5 h-5" />
            Quero enxergar minha operação de verdade
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-[11px] text-muted-foreground">Sem fidelidade · sem cartão · 30 dias de garantia total</p>
        </section>

        {/* Trust strip */}
        <div className="rounded-2xl border border-primary/15 bg-card/30 backdrop-blur-sm px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          {[
            { icon: Check, label: 'Ativação imediata após pagamento' },
            { icon: Shield, label: 'Garantia de 30 dias — dinheiro de volta' },
            { icon: Lock, label: 'Dados 100% seus — sempre exportáveis' },
            { icon: Database, label: 'Backup automático em tempo real' },
          ].map(t => (
            <span key={t.label} className="flex items-center gap-1.5">
              <t.icon className="w-3.5 h-3.5 text-primary" />{t.label}
            </span>
          ))}
        </div>

        <div className="text-center">
          <button onClick={() => navigate('/app')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar ao dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
