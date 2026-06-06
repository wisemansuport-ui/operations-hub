import { Rocket, Trophy, Target, TrendingUp, Sparkles, Zap } from "lucide-react";

interface Props {
  ativas: number;
  concluidas: number;
  taxaConclusao: number; // %
  lucroGerado: string;
  progressoGlobal: number; // %
}

// Central de Missões 3D Hero — premium launch scene
export const GoalsHero = ({ ativas, concluidas, taxaConclusao, lucroGerado, progressoGlobal }: Props) => {
  const stars = Array.from({ length: 60 });
  const orbital = Math.max(0, Math.min(100, progressoGlobal));
  return (
    <section className="hairline-gold glass-premium rounded-3xl relative overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background:
            "radial-gradient(ellipse at 80% 100%, hsl(var(--primary)/0.10) 0%, transparent 55%), radial-gradient(ellipse at 20% 0%, hsl(var(--primary)/0.06) 0%, transparent 60%)",
        }} />
        {stars.map((_, i) => {
          const top = (i * 37) % 100;
          const left = (i * 53) % 100;
          const size = (i % 3 === 0 ? 1.8 : 0.9);
          const dur = 2 + (i % 5);
          return (
            <span key={i} className="absolute rounded-full bg-foreground/40" style={{
              top: `${top}%`, left: `${left}%`, width: `${size}px`, height: `${size}px`,
              opacity: 0.15 + ((i * 7) % 50) / 200,
              boxShadow: i % 4 === 0 ? `0 0 6px hsl(var(--primary)/0.6)` : undefined,
              animation: `pulse ${dur}s ease-in-out ${i * 0.07}s infinite`,
            }} />
          );
        })}
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 p-6 md:p-10">
        {/* Left: copy + KPIs */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
              <Rocket className="w-3 h-3" /> Central de Missões
            </span>
            <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">
              {ativas} missões ativas
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-gold-text leading-[1.05]">
            Central de Comando de Metas
          </h1>
          <p className="text-sm text-muted-foreground/90 mt-3 max-w-md leading-relaxed">
            Lance missões operacionais, monitore trajetória em tempo real e converta dados em conquistas mensuráveis.
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
            <KpiTile icon={<Rocket className="w-3 h-3" />} label="Ativas" value={String(ativas)} tone="primary" />
            <KpiTile icon={<Trophy className="w-3 h-3" />} label="Concluídas" value={String(concluidas)} tone="success" />
            <KpiTile icon={<Target className="w-3 h-3" />} label="Taxa" value={`${taxaConclusao.toFixed(0)}%`} tone="primary" />
            <KpiTile icon={<TrendingUp className="w-3 h-3" />} label="Lucro Gerado" value={lucroGerado} tone="success" highlight />
          </div>

          <div className="mt-5 flex items-center gap-3 p-3.5 rounded-xl surface-2 border-primary/15">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-primary/80 mb-0.5">Motor de Decisão</p>
              <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
                Progresso global da operação: <span className="text-primary font-bold">{orbital.toFixed(1)}%</span> · Em rota para escala sustentada.
              </p>
            </div>
          </div>
        </div>

        {/* Right: 3D launch scene */}
        <div className="relative min-h-[280px] lg:min-h-[340px] flex items-end justify-center">
          {/* Orbit rings */}
          <div className="absolute inset-x-0 top-6 flex items-center justify-center">
            <div className="relative w-[220px] h-[220px]">
              {[0, 1, 2].map(i => (
                <div key={i} className="absolute inset-0 rounded-full border border-primary/15"
                  style={{ transform: `scale(${0.55 + i * 0.22}) rotate(${i * 18}deg)`, opacity: 0.6 - i * 0.18 }} />
              ))}
              <div className="absolute inset-0 rounded-full"
                style={{ boxShadow: "0 0 80px hsl(var(--primary)/0.18)" }} />
            </div>
          </div>

          {/* Rocket */}
          <div className="relative z-10 -mb-2" style={{ animation: "pulse 3s ease-in-out infinite" }}>
            <svg width="120" height="170" viewBox="0 0 120 170" className="drop-shadow-[0_0_30px_hsl(var(--primary)/0.45)]">
              <defs>
                <linearGradient id="rk-body" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(44 90% 78%)" />
                  <stop offset="50%" stopColor="hsl(44 70% 55%)" />
                  <stop offset="100%" stopColor="hsl(38 60% 38%)" />
                </linearGradient>
                <linearGradient id="rk-fin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(44 80% 55%)" />
                  <stop offset="100%" stopColor="hsl(38 60% 32%)" />
                </linearGradient>
                <radialGradient id="rk-win" cx="0.5" cy="0.4" r="0.6">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="hsl(44 90% 70%)" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="hsl(44 70% 30%)" stopOpacity="0.4" />
                </radialGradient>
                <linearGradient id="rk-flame" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="hsl(44 95% 65%)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(20 90% 50%)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Fins */}
              <path d="M30 100 L18 130 L42 118 Z" fill="url(#rk-fin)" />
              <path d="M90 100 L102 130 L78 118 Z" fill="url(#rk-fin)" />
              {/* Body */}
              <path d="M60 10 C42 30 38 60 38 90 L38 120 L82 120 L82 90 C82 60 78 30 60 10 Z" fill="url(#rk-body)" />
              {/* Highlight stripe */}
              <path d="M50 30 C46 50 44 75 44 100 L44 118" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              {/* Window */}
              <circle cx="60" cy="55" r="11" fill="url(#rk-win)" stroke="hsl(var(--primary))" strokeOpacity="0.6" strokeWidth="1.2" />
              <circle cx="56" cy="51" r="3" fill="#ffffff" opacity="0.7" />
              {/* Nozzle */}
              <rect x="40" y="120" width="40" height="6" rx="2" fill="hsl(44 50% 30%)" />
              {/* Flame */}
              <path d="M48 126 Q60 175 72 126 Z" fill="url(#rk-flame)" style={{ animation: "pulse 0.6s ease-in-out infinite" }} />
            </svg>

            {/* Launch pad */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-40 h-6">
              <div className="w-full h-full rounded-full"
                style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary)/0.35), transparent 70%)" }} />
            </div>
          </div>

          {/* Progress halo */}
          <div className="absolute bottom-3 right-3 px-3 py-2 rounded-xl surface-3 hairline-gold">
            <p className="text-[9px] uppercase tracking-widest font-bold text-primary/80">Progresso Global</p>
            <p className="text-2xl font-black tabular-nums gradient-gold-text leading-none mt-0.5">{orbital.toFixed(1)}<span className="text-sm opacity-70">%</span></p>
          </div>
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full surface-2 ring-gold">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">Em rota</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const KpiTile = ({ icon, label, value, tone, highlight }: { icon: React.ReactNode; label: string; value: string; tone: "primary" | "success"; highlight?: boolean }) => (
  <div className={`${highlight ? "surface-3 hairline-gold" : "surface-1"} rounded-xl p-3`}>
    <div className="flex items-center gap-1 mb-1">
      <span className={tone === "success" ? "text-success" : "text-primary"}>{icon}</span>
      <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
    </div>
    <p className={`text-sm font-black tabular-nums ${tone === "success" ? "text-success" : "text-foreground"}`}>{value}</p>
  </div>
);
