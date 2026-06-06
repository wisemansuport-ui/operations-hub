import { Trophy, Crown, Flame, Users, Target } from "lucide-react";

interface Props {
  totalOperators: number;
  totalMetas: number;
  totalContas: number;
  receitaBruta: string;
  netResult: string;
  netPositive: boolean;
  topPerformer?: { name: string; initials: string; net: string };
}

// "Performance Arena" — coliseum-inspired identity for Operators module
export const OperatorsHero = ({
  totalOperators,
  totalMetas,
  totalContas,
  receitaBruta,
  netResult,
  netPositive,
  topPerformer,
}: Props) => {
  return (
    <section className="hairline-gold glass-premium rounded-3xl relative overflow-hidden">
      {/* Arena spotlight glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/[0.08] blur-3xl" />
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 p-6 md:p-8">
        {/* Left — Arena identity */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
              <Trophy className="w-3 h-3" /> Performance Arena
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-success animate-pulse" /> Live
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-gold-text leading-[1.05]">
            Equipe Operacional
          </h1>
          <p className="text-sm text-muted-foreground/90 mt-3 max-w-md leading-relaxed">
            Coliseu de performance. Ranking, pódio e folha em tempo real — onde o resultado define a posição.
          </p>

          {topPerformer && (
            <div className="mt-5 inline-flex items-center gap-3 surface-2 rounded-xl pl-2 pr-4 py-2 ring-gold">
              <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/40 text-primary flex items-center justify-center text-xs font-black">
                {topPerformer.initials}
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary/80 inline-flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Top performer
                </p>
                <p className="text-sm font-bold text-foreground leading-tight">{topPerformer.name}</p>
              </div>
              <div className="pl-3 ml-1 border-l border-border/50">
                <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">Líquido</p>
                <p className="text-sm font-black text-success tabular-nums">{topPerformer.net}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right — Arena scoreboard */}
        <div className="grid grid-cols-2 gap-3 content-center">
          {[
            { Icon: Users, label: "Operadores", value: String(totalOperators), tone: "text-foreground" },
            { Icon: Target, label: "Metas fechadas", value: String(totalMetas), tone: "text-foreground" },
            { Icon: Flame, label: "Contas geradas", value: totalContas.toLocaleString("pt-BR"), tone: "text-primary" },
            { Icon: Trophy, label: "Receita bruta", value: receitaBruta, tone: "text-foreground" },
          ].map((s) => (
            <div key={s.label} className="surface-1 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <s.Icon className="w-3 h-3 text-primary/70" />
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground truncate">{s.label}</p>
              </div>
              <p className={`text-lg md:text-xl font-black tabular-nums tracking-tight ${s.tone}`}>{s.value}</p>
            </div>
          ))}
          <div className="surface-3 hairline-gold col-span-2 rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-widest font-bold text-primary/80">Resultado líquido da equipe</p>
            <p className={`text-2xl md:text-3xl font-black tabular-nums tracking-tight mt-1 ${netPositive ? "text-success" : "text-destructive"}`}>
              {netResult}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
