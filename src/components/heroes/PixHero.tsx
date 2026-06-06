import { Zap, ArrowDownRight, Activity, CheckCircle2, Gauge } from "lucide-react";

interface Props {
  totalChaves: number;
  disponiveis: number;
  usadas: number;
  taxaSucesso: number; // %
  ultimaImportacao?: string;
}

// "Central de Controle PIX" — operational treasury identity
export const PixHero = ({ totalChaves, disponiveis, usadas, taxaSucesso, ultimaImportacao }: Props) => {
  const sucesso = Math.max(0, Math.min(100, taxaSucesso));
  const bars = Array.from({ length: 14 });
  return (
    <section className="hairline-gold glass-premium rounded-3xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-primary/[0.08] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 w-[320px] h-[320px] rounded-full bg-success/[0.05] blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 p-6 md:p-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
              <Zap className="w-3 h-3" /> Central de Controle PIX
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-gold-text leading-[1.05]">
            Inteligência de Pagamentos
          </h1>
          <p className="text-sm text-muted-foreground/90 mt-3 max-w-md leading-relaxed">
            Tesouraria de chaves PIX classificadas, rastreadas e movimentadas em tempo real. Velocidade operacional sob radar.
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
            <Tile label="Volume" value={String(totalChaves)} tone="primary" icon={<Activity className="w-3 h-3" />} />
            <Tile label="Disponíveis" value={String(disponiveis)} tone="success" icon={<CheckCircle2 className="w-3 h-3" />} highlight />
            <Tile label="Movimentadas" value={String(usadas)} tone="primary" icon={<ArrowDownRight className="w-3 h-3" />} />
            <Tile label="Sucesso" value={`${sucesso.toFixed(0)}%`} tone="success" icon={<Gauge className="w-3 h-3" />} />
          </div>

          {ultimaImportacao && (
            <p className="text-[10px] text-muted-foreground mt-4">
              Última operação: <span className="text-foreground font-bold">{ultimaImportacao}</span>
            </p>
          )}
        </div>

        {/* Right — live flow visualization */}
        <div className="flex flex-col justify-center">
          <div className="surface-3 hairline-gold rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Fluxo em tempo real</span>
              <span className="text-[10px] font-bold text-success">+ ativo</span>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {bars.map((_, i) => {
                const h = 20 + ((i * 37) % 80);
                return (
                  <div key={i} className="flex-1 rounded-t-sm" style={{
                    height: `${h}%`,
                    background: `linear-gradient(180deg, hsl(var(--primary)/${0.85 - (i % 5) * 0.05}), hsl(var(--primary)/0.15))`,
                    boxShadow: i % 3 === 0 ? `0 0 8px hsl(var(--primary)/0.4)` : undefined,
                    animation: `pulse ${1.5 + (i % 4) * 0.4}s ease-in-out ${i * 0.08}s infinite`,
                  }} />
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Velocidade média</p>
                <p className="text-lg font-black tabular-nums text-foreground">2.4<span className="text-xs opacity-60">/s</span></p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Taxa de sucesso</p>
                <p className="text-lg font-black tabular-nums text-success">{sucesso.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Tile = ({ label, value, tone, icon, highlight }: { label: string; value: string; tone: "primary" | "success"; icon: React.ReactNode; highlight?: boolean }) => (
  <div className={`${highlight ? "surface-3 hairline-gold" : "surface-1"} rounded-xl p-3`}>
    <div className="flex items-center gap-1 mb-1">
      <span className={tone === "success" ? "text-success" : "text-primary"}>{icon}</span>
      <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
    </div>
    <p className={`text-sm font-black tabular-nums ${tone === "success" ? "text-success" : "text-foreground"}`}>{value}</p>
  </div>
);
