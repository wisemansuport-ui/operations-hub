import { GraduationCap, Sparkles, Trophy, BookOpen } from "lucide-react";

interface Props {
  trilhas: number;
  modulos: number; // total de passos
  conclusao: number; // %
}

export const TutorialHero = ({ trilhas, modulos, conclusao }: Props) => (
  <section className="hairline-gold glass-premium rounded-3xl relative overflow-hidden">
    <div className="absolute -top-24 -left-24 w-[440px] h-[440px] rounded-full bg-primary/[0.08] blur-3xl pointer-events-none" />
    <div className="absolute -bottom-24 -right-16 w-[320px] h-[320px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

    <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 p-6 md:p-10">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
            <GraduationCap className="w-3 h-3" /> Universidade Nytzer
          </span>
          <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">{trilhas} trilhas · {modulos} passos</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-gold-text leading-[1.05]">
          Academia Nytzer
        </h1>
        <p className="text-sm text-muted-foreground/90 mt-3 max-w-xl leading-relaxed">
          Aprenda a extrair o máximo da plataforma. Metodologia proprietária organizada em trilhas para transformar operadores em arquitetos de performance.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2 max-w-md">
          <Tile label="Trilhas" value={String(trilhas)} icon={<BookOpen className="w-3 h-3" />} />
          <Tile label="Passos" value={String(modulos)} icon={<Sparkles className="w-3 h-3" />} />
          <Tile label="Progresso" value={`${conclusao}%`} icon={<Trophy className="w-3 h-3" />} highlight />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative w-44 h-44">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--border))" strokeWidth="6" opacity="0.5" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - conclusao / 100)}`}
              style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary)/0.5))", transition: "stroke-dashoffset 1.2s ease-out" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Maestria</span>
            <span className="text-4xl font-black tabular-nums gradient-gold-text leading-none mt-1">{conclusao}<span className="text-base opacity-60">%</span></span>
            <span className="text-[10px] text-muted-foreground mt-1">nível operador</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Tile = ({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) => (
  <div className={`${highlight ? "surface-3 hairline-gold" : "surface-1"} rounded-xl p-3`}>
    <div className="flex items-center gap-1 mb-1 text-primary">{icon}
      <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
    </div>
    <p className="text-sm font-black tabular-nums text-foreground">{value}</p>
  </div>
);
