import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Crown, Rocket, Zap, Sparkles, ArrowRight, Shield, Star, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Plan {
  id: "starter" | "pro" | "enterprise";
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  annualTotal: number;
  badge?: string;
  icon: typeof Rocket;
  highlight?: boolean;
  color: string;
  iconBg: string;
  iconColor: string;
  features: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Para quem está começando a profissionalizar a operação.",
    priceMonthly: 19.9,
    priceYearly: 15.92, // 20% off
    annualTotal: 191.04,
    color: "border-border/30",
    iconBg: "bg-zinc-800",
    iconColor: "text-zinc-300",
    icon: Rocket,
    features: [
      "Até 5 operadores ativos",
      "Planilhas automáticas ilimitadas",
      "Dashboard em tempo real",
      "Notificações push básicas",
      "Suporte por e-mail (48h)",
    ],
    cta: "Começar agora",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "O plano dos times que querem escalar de verdade.",
    priceMonthly: 37.0,
    priceYearly: 29.6, // 20% off
    annualTotal: 355.20,
    color: "border-yellow-500/50",
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    badge: "MAIS ESCOLHIDO",
    icon: Zap,
    highlight: true,
    features: [
      "Até 25 operadores ativos",
      "Tudo do Starter +",
      "Sistema de metas com foguete animado",
      "Relatórios avançados e ranking",
      "Notificações push em massa",
      "Integração com PIX e custos",
      "Suporte prioritário (4h)",
    ],
    cta: "Assinar o Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Para operações de alta escala que não podem parar.",
    priceMonthly: 69.9,
    priceYearly: 55.92, // 20% off
    annualTotal: 671.04,
    color: "border-violet-500/30",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    icon: Crown,
    features: [
      "Operadores ilimitados",
      "Tudo do Pro +",
      "Gerente de conta dedicado",
      "SLA de 99,9% garantido",
      "Onboarding e treinamento 1:1",
      "API e webhooks personalizados",
      "Suporte 24/7 via WhatsApp",
    ],
    cta: "Falar com vendas",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SubscriptionModal = ({ open, onOpenChange }: Props) => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const handleSubscribe = (plan: Plan) => {
    toast.success(`Plano ${plan.name} selecionado`, {
      description: "Em breve você será redirecionado para o checkout.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="relative">
          {/* Ambient glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

          {/* ── HEADER ── */}
          <div className="relative px-8 pt-10 pb-8 text-center border-b border-border/30">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold text-yellow-500 uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              DESBLOQUEIE TODO O PODER DO NYTZERVISION
            </div>
            
            <DialogHeader className="sm:text-center">
              <DialogTitle className="w-full text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight text-center">
                Pare de perder dinheiro com <span className="text-yellow-500">operação amadora</span>.
              </DialogTitle>
              <DialogDescription className="text-sm md:text-base text-muted-foreground mt-4 max-w-2xl mx-auto text-center">
                Mais de 1.200 operadores já controlam suas equipes no piloto automático.
                Escolha o plano certo para sua escala — comece hoje, cancele quando quiser.
              </DialogDescription>
            </DialogHeader>

            {/* ── BILLING TOGGLE ── */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={cn("text-sm font-medium transition-colors", billing === "monthly" ? "text-foreground" : "text-muted-foreground")}>
                Mensal
              </span>
              <button
                onClick={() => setBilling(b => b === "monthly" ? "yearly" : "monthly")}
                className={cn("relative w-12 h-6 rounded-full transition-colors", billing === "yearly" ? "bg-yellow-500" : "bg-zinc-700")}
              >
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", billing === "yearly" ? "left-6" : "left-0.5")} />
              </button>
              <span className={cn("text-sm font-medium transition-colors", billing === "yearly" ? "text-foreground" : "text-muted-foreground")}>
                Anual
              </span>
              <span className="bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                -20%
              </span>
            </div>
          </div>

          {/* ── PLAN CARDS ── */}
          <div className="grid md:grid-cols-3 gap-5 p-6 md:p-8 bg-black/20">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const displayPrice = billing === "yearly" ? plan.priceYearly : plan.priceMonthly;
              const priceStr = displayPrice.toFixed(2).replace(".", ",");
              
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-card transition-all duration-300 overflow-hidden",
                    plan.color,
                    plan.highlight
                      ? "shadow-[0_0_40px_-5px_rgba(234,179,8,0.2)] md:scale-[1.03] md:-translate-y-1 z-10"
                      : "hover:border-border/60 hover:-translate-y-0.5"
                  )}
                >
                  {/* Pro top accent line */}
                  {plan.highlight && (
                    <div className="h-[2px] w-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />
                  )}

                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 translate-y-[-50%] mt-px">
                      <div className="bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap shadow-lg shadow-yellow-500/30">
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex flex-col gap-5 flex-1">
                    {/* Plan header */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border border-white/5", plan.iconBg)}>
                          <Icon className={cn("w-4.5 h-4.5", plan.iconColor)} />
                        </div>
                        <h3 className="font-bold text-foreground text-base leading-none">{plan.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{plan.tagline}</p>
                    </div>

                    {/* Price */}
                    <div className="space-y-0.5">
                      <div className="flex items-end gap-1">
                        <span className="text-xs text-muted-foreground font-medium self-start mt-1.5">R$</span>
                        <span className="text-4xl font-black text-foreground tracking-tight leading-none">{priceStr.split(',')[0]}</span>
                        <span className="text-xl font-black text-foreground/60 leading-none mb-0.5">,{priceStr.split(',')[1]}</span>
                        <span className="text-xs text-muted-foreground mb-0.5">/mês</span>
                      </div>
                      {billing === "yearly" && (
                        <p className={cn("text-[10px] font-semibold", plan.highlight ? "text-yellow-500/80" : "text-muted-foreground")}>
                          cobrado anualmente · R$ {plan.annualTotal.toFixed(2).replace('.', ',')}/ano
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSubscribe(plan)}
                      className={cn(
                        "w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 mt-2 mb-2",
                        plan.highlight
                          ? "bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98]"
                          : "bg-zinc-800 hover:bg-zinc-700 text-foreground border border-white/5 hover:border-white/10 hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-border/30 w-full my-2" />

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                          <div className={cn("mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0", plan.highlight ? "bg-yellow-500/15" : "bg-white/5")}>
                            <Check className={cn("w-2.5 h-2.5", plan.highlight ? "text-yellow-400" : "text-muted-foreground")} />
                          </div>
                          <span className="leading-tight text-foreground/90">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── TRUST BAR ── */}
          <div className="px-8 py-5 border-t border-border/30 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground bg-black/40">
            <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-muted-foreground/60" /> 7 dias grátis</span>
            <span className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-muted-foreground/60" /> Sem fidelidade · cancele quando quiser</span>
            <span className="flex items-center gap-2"><Headphones className="w-3.5 h-3.5 text-muted-foreground/60" /> Garantia de 30 dias ou seu dinheiro de volta</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
