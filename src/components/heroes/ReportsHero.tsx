import { LineChart, BarChart3, FileBarChart, Sparkles } from "lucide-react";

interface Props {
  oee: string;
  qualidade: string;
  falhas: number;
  operadoresAtivos: number;
  periodoLabel?: string;
}

// "Painel Executivo" — analytical identity for Reports module
export const ReportsHero = ({ oee, qualidade, falhas, operadoresAtivos, periodoLabel }: Props) => {
  return (
    <section className="hairline-gold glass-premium rounded-3xl relative overflow-hidden">
      {/* Faint chart grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute -top-24 right-1/4 w-[420px] h-[300px] rounded-full bg-primary/[0.07] blur-3xl pointer-events-none" />

      <div className="relative p-6 md:p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
                <FileBarChart className="w-3 h-3" /> Painel Executivo
              </span>
              {periodoLabel && (
                <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">{periodoLabel}</span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-gold-text leading-[1.05]">
              Relatórios & KPIs
            </h1>
            <p className="text-sm text-muted-foreground/90 mt-3 max-w-xl leading-relaxed">
              Painel executivo de inteligência operacional. OEE, qualidade e ranking de equipe consolidados para decisão.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 surface-2 ring-gold rounded-full px-3 py-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-foreground">Visão consolidada</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="surface-3 hairline-gold rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <LineChart className="w-3 h-3 text-primary" />
              <p className="text-[9px] uppercase tracking-widest font-bold text-primary/80">OEE Geral</p>
            </div>
            <p className="text-2xl md:text-3xl font-black tabular-nums tracking-tight gradient-gold-text">{oee}</p>
          </div>
          <div className="surface-1 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="w-3 h-3 text-success" />
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Qualidade</p>
            </div>
            <p className="text-2xl md:text-3xl font-black tabular-nums tracking-tight text-foreground">{qualidade}</p>
          </div>
          <div className="surface-1 rounded-2xl p-4">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Não conformidades</p>
            <p className={`text-2xl md:text-3xl font-black tabular-nums tracking-tight ${falhas > 0 ? "text-destructive" : "text-foreground"}`}>{falhas}</p>
          </div>
          <div className="surface-1 rounded-2xl p-4">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Operadores ativos</p>
            <p className="text-2xl md:text-3xl font-black tabular-nums tracking-tight text-foreground">{operadoresAtivos}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
