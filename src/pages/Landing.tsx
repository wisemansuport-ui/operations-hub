import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ShieldCheck,
  Bell,
  LineChart,
  Users,
  FileSpreadsheet,
  Check,
  ArrowRight,
  Sparkles,
  Activity,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  Zap,
  TrendingDown,
  Globe2,
  Star,
  Brain,
  Trophy,
  Target,
  KeyRound,
  Wallet,
  BarChart3,
  Smartphone,
  Network,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Landing — NytzerVision
 * Reformulada com base nas features reais do produto:
 * Motor de Decisão IA, Ranking de Redes com IA, Forecast de Metas,
 * Push iOS, Extrato por operador, PIX, Custos, Relatórios cruzados.
 */

const painPoints = [
  {
    icon: FileSpreadsheet,
    title: "Planilha de 14 abas que ninguém entende",
    desc: "Fórmula quebrada, célula sobrescrita, número que muda sozinho. Cada erro é dinheiro perdido — e você só descobre dias depois.",
  },
  {
    icon: Clock,
    title: "Fechamento até 2h da manhã",
    desc: "Você consolida no escuro o que o operador mandou errado por áudio no WhatsApp. E o relatório ainda fecha torto.",
  },
  {
    icon: XCircle,
    title: "Operador parado por 3 horas, sem ninguém ver",
    desc: "Sem tempo real, queda de produção é prejuízo silencioso. Quando você percebe, o turno já era.",
  },
  {
    icon: AlertTriangle,
    title: "Decisão na intuição, no print, no achismo",
    desc: "Qual rede está rendendo mais agora? Qual PIX queimou? Qual operador segura o time? Você responde no chute.",
  },
];

const features = [
  {
    icon: Brain,
    title: "Motor de Decisão IA",
    desc: "A IA lê seu painel em tempo real — lucro, custo, produção — e cospe a próxima ação certa antes de você perguntar.",
    tag: "Exclusivo",
  },
  {
    icon: Network,
    title: "Ranking inteligente de redes",
    desc: "Score automatizado por rede. Clique e a IA analisa as estatísticas e justifica por que ela está em cima ou em baixo.",
    tag: "IA",
  },
  {
    icon: Target,
    title: "Forecast de metas com IA",
    desc: "Você define a meta. A IA projeta se vai bater, em quantos dias, e o que precisa mudar pra chegar lá.",
    tag: "IA",
  },
  {
    icon: Activity,
    title: "Dashboard em tempo real",
    desc: "Cada operação, cada CPA, cada PIX aparece no instante em que acontece. Sem refresh, sem planilha, sem atraso.",
  },
  {
    icon: Smartphone,
    title: "Push nativo no iPhone",
    desc: "Operador travou? Meta batida? Saldo acumulado? Notificação no celular em segundos — antes do problema virar problema.",
  },
  {
    icon: Trophy,
    title: "Ranking e extrato por operador",
    desc: "Performance individual, ranking ao vivo, extrato detalhado por pessoa. Quem produz aparece. Quem trava, também.",
  },
  {
    icon: KeyRound,
    title: "Gestão de PIX sem perder a cabeça",
    desc: "Chaves PIX cadastradas, rotação, status, histórico. Trocou uma chave? O sistema sabe. Você não precisa atualizar 7 planilhas.",
  },
  {
    icon: Wallet,
    title: "Custo e lucro num lugar só",
    desc: "Margem real, custo por conta, custo por PIX, CPA bruto e líquido. O número que importa, calculado sozinho.",
  },
  {
    icon: BarChart3,
    title: "Relatórios cruzados automáticos",
    desc: "Diário, semanal, mensal — gerados sozinhos com gráficos cruzando rede, operador, PIX e custo. Exporta pra Excel quando quiser.",
  },
];

const SOLO_PRICE = 29.9;
const OPERATOR_PRICE = 19.9;
const MAX_OPERATOR_DISCOUNT = 0.3; // até 30% por operador

// Desconto gradativo: cada operador adicional reduz 3% no preço unitário,
// limitado a 30%. Operador 1 = preço cheio, operador 11+ = 30% off.
const operatorUnitPrice = (index: number) => {
  const discount = Math.min(MAX_OPERATOR_DISCOUNT, Math.max(0, index - 1) * 0.03);
  return OPERATOR_PRICE * (1 - discount);
};

const teamPriceFor = (operators: number) => {
  let total = SOLO_PRICE;
  for (let i = 1; i <= operators; i++) total += operatorUnitPrice(i);
  return total;
};

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const stats = [
  { value: "20h", label: "Economizadas / semana" },
  { value: "+10k", label: "Operações / dia" },
  { value: "99.9%", label: "Uptime" },
  { value: "<200ms", label: "Latência" },
];

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Head of Ops · TradeMax",
    text: "O Motor de Decisão IA virou o jogo. Antes eu olhava 6 abas pra entender o que fazer. Hoje a IA me diz. Dobrei a produção em 30 dias.",
  },
  {
    name: "Júlia Andrade",
    role: "Gestora · AlphaGroup",
    text: "Push avisa antes do operador parar. Ranking de redes mostra onde o dinheiro está nascendo. Engajamento subiu 40%.",
  },
  {
    name: "Rafael Costa",
    role: "CEO · OmniOps",
    text: "Pagou o investimento na primeira semana. A planilha era um buraco invisível de dinheiro — e a IA é um analista que não dorme.",
  },
];

// Inline "fake dashboard" preview used in the hero
const HeroPreview = () => (
  <div className="relative mt-16 mx-auto max-w-5xl">
    <div className="absolute -inset-6 bg-primary/20 blur-3xl rounded-[2rem] pointer-events-none" />
    <div className="relative rounded-2xl border border-primary/25 bg-card/60 backdrop-blur-xl overflow-hidden shadow-[0_40px_120px_-30px_hsl(var(--primary)/0.5)]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 h-9 border-b border-primary/10 bg-black/40">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-primary/70" />
        </div>
        <div className="text-[10px] text-muted-foreground ml-3 tracking-widest uppercase">
          nytzervision · operations hub
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
        {/* KPI cards */}
        {[
          { label: "Lucro hoje", value: "R$ 84.320", trend: "+18%" },
          { label: "CPA líquido", value: "R$ 3,84", trend: "-12%" },
          { label: "Operadores ativos", value: "23/25", trend: "92%" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-primary/15 bg-black/30 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
            <div className="text-2xl font-black text-foreground mt-1">{k.value}</div>
            <div className="text-xs text-primary mt-1">{k.trend}</div>
          </div>
        ))}
        {/* AI strip */}
        <div className="md:col-span-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold">
              Motor de Decisão IA · ao vivo
            </div>
            <div className="text-sm text-foreground mt-1">
              Rede <span className="font-bold text-primary">Tiger</span> caiu 14% nas últimas 2h.
              Realoque 4 operadores pra <span className="font-bold text-primary">Dragon</span> —
              projeção de +R$ 9.200 até as 23h.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Landing = () => {
  const [operators, setOperators] = useState(3);
  const teamTotal = teamPriceFor(operators);
  const nextUnit = operatorUnitPrice(operators + 1);
  const currentDiscount = Math.round((1 - nextUnit / OPERATOR_PRICE) * 100);
  return (
    <div className="min-h-screen bg-[#07070a] text-foreground overflow-x-hidden">
      {/* Ambient gold glow background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1400px] h-[700px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute top-[600px] left-[-200px] w-[600px] h-[600px] bg-primary/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-[-200px] w-[700px] h-[700px] bg-primary/[0.05] rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07070a]/70 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-black tracking-tight text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            NYTZER<span className="text-primary">VISION</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#dor" className="hover:text-foreground transition-colors">O problema</a>
            <a href="#ia" className="hover:text-foreground transition-colors">A IA</a>
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link to="/login">
              <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                Testar grátis <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          IA + Tempo real para operações CPA em plataformas chinesas
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.02] text-foreground">
          Sua planilha não decide.<br />
          <span className="bg-gradient-to-r from-primary via-[#fde68a] to-primary bg-clip-text text-transparent">
            A NytzerVision decide por você.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
          Um painel único, em tempo real, com uma <span className="text-foreground font-semibold">IA que lê seus números e diz o próximo passo</span> antes de você perguntar.
        </p>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Acabe com Excel quebrado, áudio no WhatsApp e fechamento de madrugada. Opere com visão — não no escuro.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <Link to="/login">
            <Button
              size="lg"
              className="rounded-full text-base px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)]"
            >
              Testar grátis por 7 dias <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#ia">
            <Button size="lg" variant="outline" className="rounded-full text-base px-8 h-12 border-primary/30 hover:bg-primary/5">
              Ver a IA em ação
            </Button>
          </a>
        </div>
        <p className="text-xs text-muted-foreground mb-10">Sem cartão · Setup em 5 minutos · Cancele quando quiser</p>

        <HeroPreview />

        {/* Hero stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16">
          {stats.map((s) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl bg-card/40 border border-primary/15 backdrop-blur-sm"
            >
              <div className="text-3xl md:text-4xl font-black text-primary">{s.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-widest">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ DOR ============ */}
      <section id="dor" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <TrendingDown className="w-4 h-4" /> O custo invisível da planilha
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-foreground">
            Você não precisa de mais uma aba.<br />
            <span className="text-primary">Você precisa parar de operar no escuro.</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Toda noite, a mesma cena: você fechando relatório enquanto seus concorrentes dormem. E o número fechando errado mesmo assim.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {painPoints.map((p) => (
            <div
              key={p.title}
              className="group relative p-7 rounded-2xl bg-card/30 border border-destructive/20 hover:border-destructive/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-destructive/10 via-card/40 to-transparent border border-destructive/20 text-center">
          <p className="text-xl md:text-2xl font-bold text-foreground">
            Cada hora gasta em planilha é{" "}
            <span className="text-destructive">uma hora a menos operando</span>.
            <br className="hidden md:block" />
            E uma hora a mais para o erro chegar até você.
          </p>
        </div>
      </section>

      {/* ============ IA EM DESTAQUE ============ */}
      <section id="ia" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <Brain className="w-4 h-4" /> Inteligência que opera com você
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-foreground">
            Três IAs trabalhando<br />
            <span className="bg-gradient-to-r from-primary to-[#fde68a] bg-clip-text text-transparent">
              enquanto você dorme.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Não é gráfico bonito. É decisão. A NytzerVision lê seus números em tempo real e te diz o que fazer agora.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Motor de Decisão */}
          <div className="md:col-span-3 lg:col-span-1 p-8 rounded-3xl bg-gradient-to-br from-primary/15 via-card/40 to-transparent border border-primary/40 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.5)]">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/20 border border-primary/40 text-[10px] font-bold uppercase tracking-widest text-primary mb-5">
              <Cpu className="w-3 h-3" /> Motor de Decisão
            </div>
            <h3 className="text-2xl font-black mb-3 text-foreground">A próxima ação certa, sem você pedir.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              A IA lê lucro, custo e produção em tempo real e cospe recomendações acionáveis no seu dashboard. Quem realocar, qual rede priorizar, quando parar.
            </p>
            <div className="rounded-xl bg-black/40 border border-primary/15 p-4 text-left">
              <div className="text-[10px] uppercase tracking-widest text-primary mb-2">Exemplo ao vivo</div>
              <p className="text-sm text-foreground">
                "Margem caiu 9% nos últimos 30min. Pausa o operador #07 — performance abaixo do CPA mínimo."
              </p>
            </div>
          </div>

          {/* Ranking de Redes */}
          <div className="p-8 rounded-3xl bg-card/40 border border-primary/15 hover:border-primary/40 transition-all">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-bold uppercase tracking-widest text-primary mb-5">
              <Network className="w-3 h-3" /> Ranking de Redes
            </div>
            <h3 className="text-2xl font-black mb-3 text-foreground">Clique numa rede. A IA explica.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Score automatizado por rede. Toque e a IA analisa as estatísticas — por que subiu, por que caiu, o que mudar.
            </p>
            <ul className="space-y-2 text-sm">
              {["Score em tempo real", "Análise IA sob demanda", "Comparativo histórico"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-foreground/90">
                  <Check className="w-4 h-4 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Forecast */}
          <div className="p-8 rounded-3xl bg-card/40 border border-primary/15 hover:border-primary/40 transition-all">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-bold uppercase tracking-widest text-primary mb-5">
              <Target className="w-3 h-3" /> Forecast de Metas
            </div>
            <h3 className="text-2xl font-black mb-3 text-foreground">Saiba se vai bater a meta — antes do fim do mês.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Defina o alvo. A IA projeta a chance de bater, em quantos dias, e o que precisa mudar pra chegar lá.
            </p>
            <ul className="space-y-2 text-sm">
              {["Projeção diária", "Alertas de desvio", "Sugestões corretivas"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-foreground/90">
                  <Check className="w-4 h-4 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" /> Tudo num lugar só
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-foreground">
            Operação completa, sem mais nenhuma aba.
          </h2>
          <p className="text-muted-foreground text-lg">
            Cada operador, cada conta, cada PIX, cada CPA — consolidado, auditado e pronto pra você decidir.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative p-7 rounded-2xl bg-card/40 border border-primary/15 hover:border-primary/50 hover:bg-card/60 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.4)]"
            >
              {f.tag && (
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-[9px] font-bold uppercase tracking-widest text-primary">
                  {f.tag}
                </div>
              )}
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ANTES vs DEPOIS ============ */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Antes vs Depois</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            A diferença entre <span className="text-destructive">caos</span> e{" "}
            <span className="text-primary">controle</span>.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl bg-card/30 border border-destructive/20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider mb-6">
              <XCircle className="w-3.5 h-3.5" /> Sem NytzerVision
            </div>
            <ul className="space-y-4">
              {[
                "14 planilhas espalhadas em 5 PCs",
                "Operador some, ninguém percebe por 3h",
                "Fechamento manual até de madrugada",
                "Decisão na intuição e no áudio do WhatsApp",
                "Erro de digitação vira prejuízo real",
                "Sem histórico confiável de quem fez o quê",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-muted-foreground">
                  <XCircle className="w-5 h-5 text-destructive/70 flex-shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-card/40 border border-primary/40 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.3)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Check className="w-3.5 h-3.5" /> Com NytzerVision
            </div>
            <ul className="space-y-4">
              {[
                "Painel único sincronizado em tempo real",
                "Push instantâneo quando o operador trava",
                "Relatório cruzado fechado sozinho, todo dia",
                "Motor de Decisão IA recomendando a próxima ação",
                "Ranking de redes e operadores ao vivo",
                "Forecast de metas e histórico imutável",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ DEPOIMENTOS ============ */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Quem usa, conta</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Operações reais. Resultados reais.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-7 rounded-2xl bg-card/40 border border-primary/15 hover:border-primary/40 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-6 text-foreground/90">"{t.text}"</p>
              <div>
                <div className="font-bold text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ PLANOS ============ */}
      <section id="planos" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Planos</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
            Escolha seu nível de controle
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            7 dias grátis em todos os planos. Sem cartão. Sem fidelidade. Cancele quando quiser.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* ====== SOLO ====== */}
          <div className="relative p-8 rounded-3xl border bg-card/30 border-primary/15 hover:border-primary/40 transition-all flex flex-col">
            <h3 className="text-2xl font-black mb-1 text-foreground">Solo</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Dashboard completo só pra você. Sem operadores vinculados.
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-sm text-muted-foreground">R$</span>
              <span className="text-5xl font-black text-foreground">{formatBRL(SOLO_PRICE)}</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Cobrança mensal · cancele quando quiser</p>
            <Link to="/login">
              <Button className="w-full rounded-full mb-8 bg-secondary text-secondary-foreground hover:bg-secondary/80" size="lg">
                Começar agora
              </Button>
            </Link>
            <ul className="space-y-3">
              {[
                "Dashboard em tempo real",
                "Motor de Decisão IA",
                "Ranking de redes com análise IA",
                "Forecast de metas",
                "Gestão de PIX e custos",
                "Relatórios automáticos",
                "Notificações push iOS/Android",
                "Suporte por e-mail",
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground/90">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ====== TEAM ====== */}
          <div className="relative p-8 rounded-3xl border bg-gradient-to-b from-primary/15 to-card/40 border-primary shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.4)] flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wider">
              MAIS POPULAR
            </div>
            <h3 className="text-2xl font-black mb-1 text-foreground">Team</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tudo do Solo + operadores vinculados com desconto progressivo.
            </p>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-sm text-muted-foreground">R$</span>
              <span className="text-5xl font-black text-foreground">{formatBRL(teamTotal)}</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <p className="text-xs text-primary font-semibold mb-6">
              Base R$ {formatBRL(SOLO_PRICE)} + {operators} {operators === 1 ? "operador" : "operadores"}
              {currentDiscount > 0 && ` · próx. operador ${currentDiscount}% off`}
            </p>

            {/* Slider de operadores */}
            <div className="mb-6 p-4 rounded-2xl bg-background/40 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Operadores</span>
                <span className="text-lg font-black text-primary">{operators}</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={operators}
                onChange={(e) => setOperators(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1</span>
                <span>20+</span>
              </div>
            </div>

            <Link to="/login">
              <Button className="w-full rounded-full mb-8 bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                Assinar Team
              </Button>
            </Link>
            <ul className="space-y-3">
              {[
                "Tudo do Solo",
                `Operadores vinculados (R$ ${formatBRL(OPERATOR_PRICE)}/op.)`,
                "Desconto gradativo até 30% por operador",
                "Extrato individual por operador",
                "Ranking e gamificação da equipe",
                "Notificações push em massa",
                "Exportação avançada",
                "Suporte prioritário",
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground/90">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">FAQ</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Antes de você perguntar
          </h2>
        </div>
        <div className="space-y-4">
          {[
            {
              q: "Como a IA toma decisões pela minha operação?",
              a: "O Motor de Decisão IA lê seu lucro, custo e produção em tempo real e gera recomendações acionáveis no dashboard. Nada é executado automaticamente — você decide aplicar ou não.",
            },
            {
              q: "A IA de redes analisa o quê, exatamente?",
              a: "Score, variação, performance histórica e padrão de produção da rede. Você clica numa rede no ranking, abre o dialog, e a IA gera uma análise explicando o porquê do score atual.",
            },
            {
              q: "Funciona com qualquer plataforma chinesa de CPA?",
              a: "Sim. O NytzerVision não depende da plataforma — ele organiza sua operação por cima, com cadastro flexível de contas, operadores, PIX e custos.",
            },
            {
              q: "Como funciona o teste grátis?",
              a: "7 dias com acesso total ao plano escolhido, sem cartão. Depois, escolhe um plano ou cancela. Sem letras miúdas.",
            },
            {
              q: "As notificações chegam no iPhone?",
              a: "Sim. Push nativo via OneSignal, funciona como PWA no iPhone, Android e desktop. Você é avisado em segundos.",
            },
            {
              q: "Meus dados ficam seguros?",
              a: "Tudo criptografado em trânsito e em repouso, com login Google e backups automáticos. Histórico imutável e auditável.",
            },
            {
              q: "Posso migrar minhas planilhas atuais?",
              a: "Sim. Importamos seus dados históricos e fazemos onboarding nos planos Pro e Enterprise. Nenhuma operação fica pra trás.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group p-6 rounded-2xl bg-card/30 border border-primary/15 hover:border-primary/40 transition-colors"
            >
              <summary className="cursor-pointer font-bold list-none flex items-center justify-between text-foreground">
                {item.q}
                <span className="text-primary group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden p-12 md:p-16 rounded-[2rem] bg-gradient-to-br from-primary/15 via-card/40 to-[#07070a] border border-primary/40 text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-xs font-bold text-primary mb-6 uppercase tracking-widest">
              <Eye className="w-3.5 h-3.5" /> Última chamada
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5 text-foreground leading-tight">
              Continue na planilha<br />
              <span className="text-destructive">ou deixe a IA operar com você.</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
              Não existe meio termo. Ou você opera no escuro, ou você opera com visão.
            </p>
            <Link to="/login" className="inline-block">
              <Button
                size="lg"
                className="rounded-full text-base px-10 h-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_20px_50px_-15px_hsl(var(--primary)/0.7)]"
              >
                Começar grátis por 7 dias <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-5 flex items-center justify-center gap-2">
              <Globe2 className="w-3.5 h-3.5" /> Sem cartão · Cancele quando quiser · Setup em 5 minutos
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/10 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            © 2026 NytzerVision. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
