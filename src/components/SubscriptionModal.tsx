import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, ArrowRight, Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Plan {
  id: "starter" | "pro" | "enterprise";
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  annualTotal: number;
  highlight?: boolean;
  badge?: string;
  features: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Para quem está saindo do caos da planilha manual.",
    priceMonthly: 29.9,
    priceYearly: 23.92,
    annualTotal: 287.04,
    cta: "Começar agora",
    features: [
      "Até 5 operadores ativos",
      "Dashboard em tempo real",
      "Planilhas automáticas ilimitadas",
      "Notificações push básicas",
      "Suporte por e-mail (48h)",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Para times que precisam crescer sem perder o controle.",
    priceMonthly: 69.9,
    priceYearly: 55.92,
    annualTotal: 671.04,
    highlight: true,
    badge: "Mais popular",
    cta: "Assinar Pro",
    features: [
      "Até 25 operadores ativos",
      "Tudo do Starter",
      "Metas com acompanhamento visual",
      "Relatórios avançados e ranking",
      "Notificações push em massa",
      "Integração com PIX e custos",
      "Suporte prioritário (4h)",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Para operações de alta escala que não podem parar.",
    priceMonthly: 149.9,
    priceYearly: 119.92,
    annualTotal: 1439.04,
    cta: "Falar com vendas",
    features: [
      "Operadores ilimitados",
      "Tudo do Pro",
      "Gerente de conta dedicado",
      "SLA de 99,9% garantido",
      "Onboarding e treinamento 1:1",
      "API e webhooks personalizados",
      "Suporte 24/7 via WhatsApp",
    ],
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
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-border/40 bg-background">
        <div className="relative max-h-[92vh] overflow-y-auto">
          {/* Subtle ambient */}
          <div className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-gradient-to-b from-foreground/[0.04] to-transparent" />

          {/* HEADER */}
          <div className="relative px-6 md:px-10 pt-10 pb-8 text-center">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-5">
              Planos & preços
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05] max-w-3xl mx-auto">
              Controle total da sua operação,
              <br className="hidden md:block" />
              <span className="text-muted-foreground"> sem complicação.</span>
            </h2>
            <p className="text-sm md:text-[15px] text-muted-foreground mt-5 max-w-xl mx-auto leading-relaxed">
              Escolha o plano que cabe no tamanho do seu time hoje. Atualize ou cancele a qualquer momento.
            </p>

            {/* TOGGLE */}
            <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full border border-border bg-card">
              {(["monthly", "yearly"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBilling(opt)}
                  className={cn(
                    "relative px-4 py-1.5 text-xs font-medium rounded-full transition-all",
                    billing === opt
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt === "monthly" ? "Mensal" : "Anual"}
                  {opt === "yearly" && (
                    <span
                      className={cn(
                        "ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                        billing === "yearly"
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-emerald-500/15 text-emerald-500"
                      )}
                    >
                      -20%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* PLAN CARDS */}
          <div className="grid md:grid-cols-3 gap-4 px-6 md:px-10 pb-8">
            {PLANS.map((plan) => {
              const price = billing === "yearly" ? plan.priceYearly : plan.priceMonthly;
              const [int, dec] = price.toFixed(2).replace(".", ",").split(",");

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-6 transition-all duration-300",
                    plan.highlight
                      ? "border-primary/40 bg-card shadow-[0_0_40px_-12px_hsl(var(--primary)/0.45)]"
                      : "border-border/60 bg-card/40 hover:border-border"
                  )}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-6 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                      {plan.badge}
                    </span>
                  )}

                  {/* Header */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-muted-foreground font-medium">R$</span>
                      <span className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                        {int}
                      </span>
                      <span className="text-lg font-semibold text-foreground/70 tabular-nums">
                        ,{dec}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">/mês</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 h-4">
                      {billing === "yearly"
                        ? `R$ ${plan.annualTotal.toFixed(2).replace(".", ",")} cobrado anualmente`
                        : "Cobrado mensalmente"}
                    </p>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleSubscribe(plan)}
                    className={cn(
                      "w-full py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all group",
                      plan.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border bg-transparent text-foreground hover:bg-muted/50"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-border/60 my-6" />

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((f, i) => {
                      const isUnlimited = /ilimitad/i.test(f);
                      const Icon = isUnlimited ? InfinityIcon : Check;
                      return (
                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-foreground/80">
                          <Icon
                            className={cn(
                              "w-3.5 h-3.5 mt-0.5 shrink-0",
                              plan.highlight ? "text-foreground" : "text-muted-foreground"
                            )}
                            strokeWidth={2.5}
                          />
                          <span className="leading-snug">{f}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* TRUST BAR */}
          <div className="px-6 md:px-10 pb-8 pt-2">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
              <span>7 dias grátis</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Sem fidelidade · cancele quando quiser</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Garantia de 30 dias</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
