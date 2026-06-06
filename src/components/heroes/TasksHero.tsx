// "Airy linear" — clean editorial hero for Planilhas. Title + KPI strip on a
// hairline track, breathing room over heavy cards.

interface Props {
  totalMetas: number;
  abertas: number;
  fechadas: number;
  progressoMedio?: number; // 0-100
  resultadoLabel?: string;
  resultadoValue?: string;
  resultadoPositive?: boolean;
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

export const TasksHero = ({
  totalMetas,
  abertas,
  fechadas,
  progressoMedio = 0,
  resultadoLabel,
  resultadoValue,
  resultadoPositive,
}: Props) => {
  const progress = Math.max(0, Math.min(100, progressoMedio));

  return (
    <section className="relative">
      {/* Soft background glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/[0.05] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col gap-10 px-1 sm:px-2">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-7 border-b border-primary/10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-primary/60 font-semibold">
                Operational Workspace
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-[1.02]">
              Planilhas<span className="text-primary">.</span>
            </h1>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              Workspace tático de metas. Crie, acompanhe progresso e analise cada remessa em tempo real.
            </p>
          </div>

          {progress > 0 && (
            <div className="flex flex-col md:items-end gap-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Progresso médio
                </span>
                <span className="text-2xl font-bold text-primary tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="group">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-primary transition-colors">
              Total de metas
            </p>
            <p className="text-3xl font-black tabular-nums text-foreground">{totalMetas}</p>
            <div className="mt-4 w-8 h-px bg-primary/30" />
          </div>

          <div className="group">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-primary transition-colors">
              Abertas
            </p>
            <p className="text-3xl font-black tabular-nums text-foreground">{pad2(abertas)}</p>
            <div className="mt-4 w-8 h-px bg-primary/30" />
          </div>

          <div className="group">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-primary transition-colors">
              Fechadas
            </p>
            <p className="text-3xl font-black tabular-nums text-foreground">{fechadas}</p>
            <div className="mt-4 w-8 h-px bg-primary/30" />
          </div>

          {resultadoValue ? (
            <div className="group">
              <p className="text-[10px] uppercase tracking-widest text-primary mb-1">
                {resultadoLabel || "Lucro consolidado"}
              </p>
              <p
                className={`text-3xl font-black tabular-nums tracking-tight ${
                  resultadoPositive === false ? "text-destructive" : "text-primary"
                }`}
              >
                {resultadoValue}
              </p>
              <div className="mt-4 w-full h-px bg-primary/10" />
            </div>
          ) : (
            <div className="group">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Lucro consolidado
              </p>
              <p className="text-3xl font-black tabular-nums text-muted-foreground/60">—</p>
              <div className="mt-4 w-full h-px bg-primary/10" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
