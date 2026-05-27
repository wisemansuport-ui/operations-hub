import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Crown, Rocket, Zap, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Plan {
  id: "starter" | "pro" | "enterprise";
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  badge?: string;
  icon: typeof Rocket;
  highlight?: boolean;
  features: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Para quem está começando a profissionalizar a operação.",
    priceMonthly: 97,
    priceYearly: 77,
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
    priceMonthly: 297,
    priceYearly: 237,
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
    priceMonthly: 897,
    priceYearly: 717,
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
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const handleSubscribe = (plan: Plan) => {
    toast.success(`Plano ${plan.name} selecionado`, {
      description: "Em breve você será redirecionado para o checkout.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-primary/20 bg-background">
        <div className="relative">
          {/* Ambient glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative px-8 pt-8 pb-6 text-center border-b border-border/40">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-[11px] font-bold tracking-wider text-primary mb-4">
              <Sparkles className="w-3 h-3" />
              DESBLOQUEIE TODO O PODER DO NYTZERVISION
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl md:text-4xl font-black tracking-tight">
                Pare de perder dinheiro com <span className="text-primary">operação amadora</span>.
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground mt-2 max-w-2xl mx-auto">
                Mais de 1.200 operadores já controlam suas equipes no piloto automático.
                Escolha o plano certo para sua escala — comece hoje, cancele quando quiser.
              </DialogDescription>
            </DialogHeader>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 mt-6 p-1 rounded-full bg-muted/60 border border-border/40">
              <button
                onClick={() => setBilling("monthly")}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-full transition-all",
                  billing === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Mensal
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5",
                  billing === "yearly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Anual
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] tracking-wide">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 p-6 bg-muted/20">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const price = billing === "monthly" ? plan.priceMonthly : plan.priceYearly;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border bg-card p-6 flex flex-col transition-all",
                    plan.highlight
                      ? "border-primary/60 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)] scale-[1.02]"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black tracking-widest shadow-lg">
                      {plan.badge}
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        plan.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
                  </div>

                  <p className="text-sm text-muted-foreground mb-5 min-h-[40px]">{plan.tagline}</p>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <span className="text-4xl font-black tracking-tighter">{price}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    {billing === "yearly" && (
                      <p className="text-[11px] text-primary font-semibold mt-1">
                        cobrado anualmente · economia de R$ {(plan.priceMonthly - plan.priceYearly) * 12}/ano
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mb-5",
                      plan.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_5px_20px_-5px_hsl(var(--primary)/0.6)]"
                        : "bg-foreground/5 text-foreground hover:bg-foreground/10 border border-border/60"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <ul className="space-y-2.5 text-sm">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                            plan.highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
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

          <div className="px-8 py-5 border-t border-border/40 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground bg-background">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> 7 dias grátis</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Sem fidelidade · cancele quando quiser</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Garantia de 30 dias ou seu dinheiro de volta</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
