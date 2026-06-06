import { Shield, Sparkles, Lock, TrendingUp } from "lucide-react";

interface Props {
  status: "active" | "expired" | "trial";
  expDateLabel?: string;
}

export const SubscriptionHero = ({ status, expDateLabel }: Props) => {
  const dotClass = status === "active" ? "bg-success animate-pulse" : status === "trial" ? "bg-primary animate-pulse" : "bg-destructive";
  const statusLabel = status === "active" ? "Acesso liberado" : status === "trial" ? "Trial ativo" : "Acesso bloqueado";
  return (
    <section className="hairline-gold glass-premium rounded-3xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-primary/[0.10] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 w-[320px] h-[320px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 p-6 md:p-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
              <Sparkles className="w-3 h-3" /> Intelligence Access
            </span>
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} /> {statusLabel}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight gradient-gold-text leading-[1.05]">
            Nytzer Vision Pro
          </h1>
          <p className="text-base md:text-lg font-bold text-foreground mt-4 leading-snug max-w-xl">
            Transforme dados operacionais em lucro previsível.
          </p>
          <p className="text-sm text-muted-foreground/90 mt-3 max-w-xl leading-relaxed">
            Acesse o núcleo completo da inteligência operacional utilizada para maximizar resultados, identificar oportunidades e acelerar crescimento.
          </p>

          {expDateLabel && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full surface-2 ring-gold">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Plano válido até {expDateLabel}</span>
            </div>
          )}
        </div>

        {/* Right premium card */}
        <div className="flex items-center justify-center">
          <div className="relative surface-3 hairline-gold rounded-2xl p-6 w-full max-w-sm">
            <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black tracking-widest shadow">
              ELITE
            </div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-primary/80">Acesso Premium</p>
                <p className="text-sm font-black text-foreground">Decision Engine completo</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-foreground/90">
              <FeatureLine>Forecast inteligente · IA preditiva</FeatureLine>
              <FeatureLine>Análise de performance avançada</FeatureLine>
              <FeatureLine>Prioridade em novos recursos</FeatureLine>
              <FeatureLine>Insights exclusivos por operação</FeatureLine>
            </div>
            <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">ROI médio</span>
              <span className="inline-flex items-center gap-1 text-sm font-black text-success">
                <TrendingUp className="w-3.5 h-3.5" /> +312%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureLine = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2">
    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
    <span>{children}</span>
  </div>
);
