import { LayoutGrid, Activity, Target, CheckCircle2, Layers } from "lucide-react";

interface Props {
  totalMetas: number;
  abertas: number;
  fechadas: number;
  progressoMedio?: number; // 0-100
  resultadoLabel?: string;
  resultadoValue?: string;
  resultadoPositive?: boolean;
}

// "Operational Workspace" — terminal/grid identity for Tasks (Planilhas) module
export const TasksHero = ({
  totalMetas,
  abertas,
  fechadas,
  progressoMedio = 0,
  resultadoLabel,
  resultadoValue,
  resultadoPositive,
}: Props) => {
  return (
    <section className="hairline-gold glass-premium rounded-3xl relative overflow-hidden">
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute -top-16 -left-12 w-[360px] h-[260px] rounded-full bg-primary/[0.07] blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 p-5 md:p-7">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
              <LayoutGrid className="w-3 h-3" /> Operational Workspace
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-success animate-pulse" /> Em operação
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-gold-text leading-[1.05]">
            Planilhas
          </h1>
          <p className="text-sm text-muted-foreground/90 mt-3 max-w-md leading-relaxed">
            Workspace tático de metas. Crie, acompanhe progresso e analise cada remessa em tempo real.
          </p>

          {progressoMedio > 0 && (
            <div className="mt-5 surface-2 ring-gold rounded-xl p-3.5 max-w-md">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground inline-flex items-center gap-1">
                  <Activity className="w-3 h-3 text-primary" /> Progresso médio
                </p>
                <p className="text-xs font-black tabular-nums text-primary">{Math.round(progressoMedio)}%</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, progressoMedio)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 content-center">
          <div className="surface-1 rounded-xl p-3 text-center">
            <Layers className="w-3.5 h-3.5 text-primary/70 mx-auto mb-1" />
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Metas</p>
            <p className="text-xl font-black tabular-nums text-foreground mt-0.5">{totalMetas}</p>
          </div>
          <div className="surface-1 rounded-xl p-3 text-center">
            <Target className="w-3.5 h-3.5 text-success mx-auto mb-1" />
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Abertas</p>
            <p className="text-xl font-black tabular-nums text-success mt-0.5">{abertas}</p>
          </div>
          <div className="surface-1 rounded-xl p-3 text-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Fechadas</p>
            <p className="text-xl font-black tabular-nums text-foreground mt-0.5">{fechadas}</p>
          </div>
          {resultadoValue && (
            <div className="surface-3 hairline-gold col-span-3 rounded-xl p-3.5">
              <p className="text-[9px] uppercase tracking-widest font-bold text-primary/80">{resultadoLabel || "Resultado consolidado"}</p>
              <p className={`text-xl md:text-2xl font-black tabular-nums tracking-tight mt-1 ${resultadoPositive ? "text-success" : "text-destructive"}`}>
                {resultadoValue}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
