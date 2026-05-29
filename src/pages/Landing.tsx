import { Link } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AIDA Landing — NytzerVision
 * A — Attention: dor visceral de quem opera CPA em plataformas chinesas
 * I — Interest: o que muda quando você troca planilha por sistema real
 * D — Desire: prova social, recursos, números, transformação
 * A — Action: planos + CTA final
 */

const painPoints = [
  {
    icon: FileSpreadsheet,
    title: "Planilhas que travam toda hora",
    desc: "10 abas abertas, fórmulas quebradas, células sobrescritas por engano. Cada erro custa dinheiro de verdade.",
  },
  {
    icon: Clock,
    title: "Horas perdidas fechando o dia",
    desc: "Você termina às 2h da manhã consolidando números que o operador já te mandou errado pelo WhatsApp.",
  },
  {
    icon: XCircle,
    title: "Operador sumiu? Você só descobre depois",
    desc: "Sem visibilidade em tempo real, um operador parado é prejuízo silencioso por horas até alguém perceber.",
  },
  {
    icon: AlertTriangle,
    title: "Plataforma chinesa mudou regra de novo",
    desc: "CPA flutuando, conta bloqueada, PIX trocado às pressas. E você manualmente atualizando 7 planilhas diferentes.",
  },
];

const transformations = [
  {
    icon: Activity,
    title: "Tempo real, de verdade",
    desc: "Cada operação aparece no seu dashboard no instante em que acontece. Sem refresh, sem planilha, sem atraso.",
  },
  {
    icon: Bell,
    title: "Push no celular, sempre",
    desc: "Operador parou? Meta batida? Saldo acumulado? Você recebe no iPhone antes do problema virar problema.",
  },
  {
    icon: Users,
    title: "Operadores sob controle",
    desc: "Ranking, performance individual, extrato por pessoa. Quem produz mais aparece. Quem trava, também.",
  },
  {
    icon: FileSpreadsheet,
    title: "Planilha automática — sem você tocar",
    desc: "Relatórios diários, semanais, mensais gerados sozinhos. Exporta pra Excel quando quiser. Auditoria pronta.",
  },
  {
    icon: LineChart,
    title: "CPA, custo e lucro num lugar só",
    desc: "Margem real, custo por conta, custo por PIX. O número que importa, calculado em tempo real.",
  },
  {
    icon: ShieldCheck,
    title: "Histórico imutável e seguro",
    desc: "Tudo salvo na nuvem, criptografado, com login Google. Adeus arquivo corrompido. Adeus 'sumiu a aba'.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "R$ 97",
    period: "/mês",
    desc: "Pra quem está saindo da planilha agora",
    features: [
      "Até 5 operadores",
      "Dashboard em tempo real",
      "Notificações push",
      "Relatórios automáticos",
      "Suporte por e-mail",
    ],
    cta: "Começar agora",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 297",
    period: "/mês",
    desc: "Pra quem opera sério e quer escalar",
    features: [
      "Até 25 operadores",
      "Tudo do Starter",
      "Gestão de PIX e custos",
      "Metas com foguete animado",
      "Ranking e gamificação",
      "Exportação avançada",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "R$ 897",
    period: "/mês",
    desc: "Pra operações de alta escala",
    features: [
      "Operadores ilimitados",
      "Tudo do Pro",
      "API dedicada",
      "Onboarding 1:1",
      "Gerente de conta exclusivo",
      "SLA 99.9%",
    ],
    cta: "Falar com vendas",
    highlighted: false,
  },
];

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
    text: "Saí de 14 planilhas pra um único painel. Dobrei a produção em 30 dias e parei de dormir tarde fechando relatório.",
  },
  {
    name: "Júlia Andrade",
    role: "Gestora · AlphaGroup",
    text: "O push avisa antes do operador parar. Antes eu descobria horas depois. Hoje, em segundos. Engajamento subiu 40%.",
  },
  {
    name: "Rafael Costa",
    role: "CEO · OmniOps",
    text: "Pagou o investimento na primeira semana. As planilhas manuais eram um buraco invisível de dinheiro.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#07070a] text-foreground overflow-x-hidden">
      {/* Ambient gold glow background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1400px] h-[700px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute top-[600px] left-[-200px] w-[600px] h-[600px] bg-primary/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-[-200px] w-[700px] h-[700px] bg-primary/[0.05] rounded-full blur-[140px]" />
        {/* subtle grid */}
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
            <a href="#solucao" className="hover:text-foreground transition-colors">A solução</a>
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

      {/* ============ ATTENTION — HERO ============ */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Feito para operações CPA em plataformas chinesas
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.02] text-foreground">
          Pare de operar CPA<br />
          <span className="bg-gradient-to-r from-primary via-[#fde68a] to-primary bg-clip-text text-transparent">
            no improviso de planilha.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
          Sua operação fatura milhões mas é controlada por <span className="text-foreground font-semibold">Excel quebrado, áudio no WhatsApp e print de tela</span>.
        </p>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          O NytzerVision substitui tudo isso por um painel único, em tempo real, com push no seu celular sempre que algo acontece.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/login">
            <Button
              size="lg"
              className="rounded-full text-base px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)]"
            >
              Quero parar de perder dinheiro <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#dor">
            <Button size="lg" variant="outline" className="rounded-full text-base px-8 h-12 border-primary/30 hover:bg-primary/5">
              Ver como funciona
            </Button>
          </a>
        </div>

        {/* Hero stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
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

      {/* ============ INTEREST — A DOR ============ */}
      <section id="dor" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <TrendingDown className="w-4 h-4" /> O custo invisível da planilha
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-foreground">
            Toda noite a mesma cena:<br />
            <span className="text-primary">você fechando relatório no escuro.</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Enquanto seus concorrentes dormem, você está conferindo célula por célula. E ainda assim, o número fecha errado.
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

        {/* Pain bottom line */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-destructive/10 via-card/40 to-transparent border border-destructive/20 text-center">
          <p className="text-xl md:text-2xl font-bold text-foreground">
            Cada hora gasta em planilha é{" "}
            <span className="text-destructive">uma hora a menos operando</span>.
            <br className="hidden md:block" />
            E uma hora a mais para o erro chegar até você.
          </p>
        </div>
      </section>

      {/* ============ DESIRE — A SOLUÇÃO ============ */}
      <section id="solucao" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" /> A virada de chave
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-foreground">
            Imagina abrir o painel pela manhã e<br />
            <span className="bg-gradient-to-r from-primary to-[#fde68a] bg-clip-text text-transparent">
              já saber tudo que aconteceu na madrugada.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Cada operador, cada conta, cada PIX, cada CPA — consolidado, auditado, e pronto pra você decidir.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {transformations.map((f) => (
            <div
              key={f.title}
              className="group p-7 rounded-2xl bg-card/40 border border-primary/15 hover:border-primary/50 hover:bg-card/60 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.4)]"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ DESIRE — ANTES vs DEPOIS ============ */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Antes vs Depois</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            A diferença entre <span className="text-destructive">caos</span> e{" "}
            <span className="text-primary">controle</span>.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Antes */}
          <div className="p-8 rounded-3xl bg-card/30 border border-destructive/20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider mb-6">
              <XCircle className="w-3.5 h-3.5" /> Sem NytzerVision
            </div>
            <ul className="space-y-4">
              {[
                "Planilhas espalhadas em 5 PCs diferentes",
                "Operador some e ninguém percebe por 3h",
                "Fechamento manual até de madrugada",
                "Erro de digitação vira prejuízo real",
                "Sem histórico confiável de quem fez o quê",
                "Push? Só do grupo de WhatsApp",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-muted-foreground">
                  <XCircle className="w-5 h-5 text-destructive/70 flex-shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Depois */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-card/40 border border-primary/40 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.3)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Check className="w-3.5 h-3.5" /> Com NytzerVision
            </div>
            <ul className="space-y-4">
              {[
                "Um único painel sincronizado em tempo real",
                "Push instantâneo quando o operador trava",
                "Relatório fechado sozinho, todo dia",
                "Tudo auditado, nada se perde",
                "Ranking, extrato e histórico por operador",
                "Notificação no iPhone, antes do problema",
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

      {/* ============ DESIRE — DEPOIMENTOS ============ */}
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

      {/* ============ ACTION — PLANOS ============ */}
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
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative p-8 rounded-3xl border transition-all ${
                p.highlighted
                  ? "bg-gradient-to-b from-primary/15 to-card/40 border-primary shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.4)] md:scale-105"
                  : "bg-card/30 border-primary/15 hover:border-primary/40"
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wider">
                  MAIS POPULAR
                </div>
              )}
              <h3 className="text-2xl font-black mb-1 text-foreground">{p.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black text-foreground">{p.price}</span>
                <span className="text-muted-foreground">{p.period}</span>
              </div>
              <Link to="/login">
                <Button
                  className={`w-full rounded-full mb-8 ${
                    p.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  size="lg"
                >
                  {p.cta}
                </Button>
              </Link>
              <ul className="space-y-3">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground/90">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
              q: "Funciona com qualquer plataforma chinesa de CPA?",
              a: "Sim. O NytzerVision não depende da plataforma — ele organiza sua operação por cima, com cadastro flexível de contas, operadores, PIX e custos.",
            },
            {
              q: "Como funciona o teste grátis?",
              a: "Você tem 7 dias com acesso total ao plano escolhido, sem cartão. Depois, escolhe um plano ou cancela. Sem letras miúdas.",
            },
            {
              q: "As notificações chegam no iPhone?",
              a: "Sim. Push nativo via OneSignal, funciona como PWA no iPhone, Android e desktop. Você é avisado em segundos.",
            },
            {
              q: "Meus dados ficam seguros?",
              a: "Tudo criptografado em trânsito e em repouso, com login Google e backups automáticos. Histórico imutável.",
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

      {/* ============ ACTION — CTA FINAL ============ */}
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
              <span className="text-destructive">ou assuma o controle hoje.</span>
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
