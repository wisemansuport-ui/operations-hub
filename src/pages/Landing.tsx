import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Rocket,
  Bell,
  LineChart,
  Users,
  FileSpreadsheet,
  Zap,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  Globe,
  Star,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Activity,
    title: "Tempo Real",
    desc: "Acompanhe operadores, contas e lucros em tempo real com sincronização instantânea via Firestore.",
  },
  {
    icon: Bell,
    title: "Notificações Push",
    desc: "Alertas instantâneos quando metas são atingidas, operações falham ou há atividade suspeita.",
  },
  {
    icon: FileSpreadsheet,
    title: "Planilhas Automáticas",
    desc: "Relatórios e extratos gerados automaticamente. Exporte para Excel com um clique.",
  },
  {
    icon: LineChart,
    title: "Dashboards Visuais",
    desc: "Gráficos interativos, KPIs animados e visualizações modernas para decisões rápidas.",
  },
  {
    icon: Users,
    title: "Gestão de Operadores",
    desc: "Cadastre, monitore e avalie performance individual com ranking automático e gamificação.",
  },
  {
    icon: Lock,
    title: "Segurança Total",
    desc: "Login Google, autenticação JWT e criptografia end-to-end. Seus dados protegidos 24/7.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "R$ 97",
    period: "/mês",
    desc: "Para times pequenos começando a escalar",
    features: [
      "Até 5 operadores",
      "Dashboard completo",
      "Relatórios básicos",
      "Notificações push",
      "Suporte por e-mail",
    ],
    cta: "Começar agora",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 297",
    period: "/mês",
    desc: "O mais popular — para operações em crescimento",
    features: [
      "Até 25 operadores",
      "Tudo do Starter",
      "Relatórios avançados + exportação",
      "Metas com foguete animado",
      "Gestão de custos e PIX",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "R$ 897",
    period: "/mês",
    desc: "Para operações de alta escala",
    features: [
      "Operadores ilimitados",
      "Tudo do Pro",
      "API dedicada",
      "Onboarding personalizado",
      "Gerente de conta exclusivo",
      "SLA 99.9%",
    ],
    cta: "Falar com vendas",
    highlighted: false,
  },
];

const stats = [
  { value: "+10k", label: "Operações/dia" },
  { value: "99.9%", label: "Uptime" },
  { value: "<200ms", label: "Latência" },
  { value: "+500", label: "Times ativos" },
];

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Head of Ops · TradeMax",
    text: "Migramos planilhas manuais para o NytzerVision e dobramos a produtividade em 30 dias. As notificações em tempo real são um divisor de águas.",
  },
  {
    name: "Júlia Andrade",
    role: "Gestora · AlphaGroup",
    text: "Visibilidade total sobre cada operador. O ranking gamificado aumentou o engajamento da equipe em mais de 40%.",
  },
  {
    name: "Rafael Costa",
    role: "CEO · OmniOps",
    text: "Os relatórios automáticos economizam 20 horas semanais. Pagou o investimento na primeira semana de uso.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-black tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            NYTZER<span className="text-primary">VISION</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link to="/login">
              <Button size="sm" className="rounded-full">
                Começar grátis <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          NOVO · Sistema de Metas com Foguete Animado
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.05]">
          Controle suas operações<br />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            em alta escala
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          O dashboard definitivo para times que precisam de visibilidade em tempo real,
          notificações inteligentes e relatórios automáticos. Sem planilhas, sem caos.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/login">
            <Button size="lg" className="rounded-full text-base px-8 h-12 shadow-[0_10px_40px_hsl(var(--primary)/0.3)]">
              Começar teste grátis <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#pricing">
            <Button size="lg" variant="outline" className="rounded-full text-base px-8 h-12">
              Ver planos
            </Button>
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur">
              <div className="text-3xl md:text-4xl font-black text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Recursos</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Tudo que você precisa para escalar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Construído para times que não podem perder uma operação. Cada detalhe pensado para velocidade e clareza.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-8 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all hover:shadow-[0_10px_40px_hsl(var(--primary)/0.1)] hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Planos</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Escolha o plano ideal
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sem fidelidade. Cancele quando quiser. 7 dias de teste grátis em todos os planos.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative p-8 rounded-3xl border transition-all ${
                p.highlighted
                  ? "bg-gradient-to-b from-primary/10 to-card border-primary shadow-[0_20px_60px_hsl(var(--primary)/0.25)] scale-105"
                  : "bg-card border-border/60 hover:border-primary/40"
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  MAIS POPULAR
                </div>
              )}
              <h3 className="text-2xl font-black mb-1">{p.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black">{p.price}</span>
                <span className="text-muted-foreground">{p.period}</span>
              </div>
              <Link to="/login">
                <Button
                  className={`w-full rounded-full mb-8 ${p.highlighted ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                  size="lg"
                >
                  {p.cta}
                </Button>
              </Link>
              <ul className="space-y-3">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Depoimentos</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Quem usa, recomenda
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="p-8 rounded-2xl bg-card border border-border/60">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div>
                <div className="font-bold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">FAQ</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Perguntas frequentes</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              q: "Como funciona o teste grátis?",
              a: "Você tem 7 dias para usar todos os recursos do plano escolhido, sem cartão de crédito. Após o período, escolha um plano ou cancele sem custo.",
            },
            {
              q: "Posso mudar de plano depois?",
              a: "Sim, faça upgrade ou downgrade a qualquer momento direto no painel. A cobrança é ajustada proporcionalmente.",
            },
            {
              q: "Meus dados ficam seguros?",
              a: "Todos os dados são criptografados em trânsito e em repouso. Usamos Firebase com autenticação Google e backups automáticos.",
            },
            {
              q: "Tem limite de operações?",
              a: "Não. Os planos limitam apenas o número de operadores cadastrados. Operações são ilimitadas em todos os planos.",
            },
          ].map((item) => (
            <details key={item.q} className="group p-6 rounded-2xl bg-card border border-border/60">
              <summary className="cursor-pointer font-bold list-none flex items-center justify-between">
                {item.q}
                <span className="text-primary group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden p-12 md:p-16 rounded-3xl bg-gradient-to-br from-primary/20 via-card to-accent/10 border border-primary/30 text-center">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <Rocket className="w-12 h-12 text-primary mx-auto mb-6 relative" />
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 relative">
            Pronto para decolar?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto relative">
            Junte-se a centenas de times que escalaram suas operações com o NytzerVision.
          </p>
          <Link to="/login" className="relative inline-block">
            <Button size="lg" className="rounded-full text-base px-10 h-14 shadow-[0_10px_40px_hsl(var(--primary)/0.4)]">
              Começar agora — Grátis por 7 dias <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 mt-12">
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
