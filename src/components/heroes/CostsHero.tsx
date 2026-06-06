import { TrendingDown, PiggyBank, Layers } from "lucide-react";

interface Props {
  custoPeriodo: string;
  registros: number;
  topCategory?: { label: string; value: string };
  mediaPorLancamento?: string;
}

// "Inteligência de Custos" — pure cost ledger. No revenue/efficiency here.
export const CostsHero = ({ custoPeriodo, registros, topCategory, mediaPorLancamento }: Props) => {
  return (
    <section className="hairline-gold glass-premium rounded-3xl relative overflow-hidden">
      <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-destructive/[0.05] blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 p-6 md:p-8 items-center">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
              <PiggyBank className="w-3 h-3" /> Inteligência de Custos
            </span>
            <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">
              {registros} lançamentos
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-gold-text leading-[1.05]">
            Custos Operacionais
          </h1>
          <p className="text-sm text-muted-foreground/90 mt-3 max-w-xl leading-relaxed">
            Centralize tudo que sai do caixa — proxy, SMS, bots, VPS e despesas diretas. Tesouraria limpa, sem misturar com receita.
          </p>

          {topCategory && (
            <p className="text-[10px] text-muted-foreground mt-4">
              Maior consumo: <span className="text-foreground font-bold">{topCategory.label}</span> · {topCategory.value}
            </p>
          )}
        </div>

        {/* Right — total cost panel */}
        <div className="surface-3 hairline-gold rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
                Custo total no período
              </p>
            </div>
            <p className="text-3xl md:text-4xl font-black tabular-nums text-destructive tracking-tight">
              - {custoPeriodo}
            </p>
          </div>

          {mediaPorLancamento && registros > 0 && (
            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                Média por lançamento
              </p>
              <p className="ml-auto text-sm font-black tabular-nums text-foreground">{mediaPorLancamento}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
