import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

const QUOTES = [
  "A constância vence o talento quando o talento não é constante.",
  "Disciplina é a ponte entre metas e conquistas.",
  "Quem domina o processo, controla o resultado.",
  "Operação afiada nasce de hábitos silenciosos.",
  "Cada conta validada é um passo rumo à liberdade.",
  "Foco no que se mede. Cresce o que se acompanha.",
  "O ouro pertence a quem garimpa todos os dias.",
];

export const LoadingScreen = ({
  message = "Sincronizando seus dados",
}: {
  message?: string;
}) => {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [slow, setSlow] = useState(false);
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      clearTimeout(t);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-background overflow-hidden animate-[fade-in_0.4s_ease-out]"
      style={{ zIndex: 9999, willChange: "opacity" }}
    >
      {/* Ambient gold glow — single soft layer, GPU friendly */}
      <div
        className="absolute top-1/2 left-1/2 w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl pointer-events-none"
        style={{ transform: "translate3d(-50%, -50%, 0)" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
        {/* Favicon with halo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.25)]">
            <img
              src="/web-app-manifest-192x192.png"
              alt="Nytzer Vision"
              className="w-14 h-14 object-contain"
            />
          </div>
          {/* Orbiting ring */}
          <div
            className="absolute inset-0 -m-3 rounded-full border border-primary/20 animate-spin"
            style={{ animationDuration: "6s", willChange: "transform" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
          </div>
        </div>

        {/* Brand */}
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Nytzer Vision
        </h2>
        <p className="text-xs uppercase tracking-[0.3em] text-primary/70 font-semibold mb-8">
          {offline ? "Aguardando conexão" : message}
        </p>

        {/* Progress bar */}
        <div className="w-56 h-[2px] rounded-full bg-primary/10 overflow-hidden mb-8 relative">
          <div
            className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
            style={{
              animation: "loader-sweep 1.6s ease-in-out infinite",
              willChange: "transform",
            }}
          />
        </div>
        <style>{`@keyframes loader-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>


        {/* Quote */}
        <blockquote className="text-sm md:text-base text-muted-foreground italic leading-relaxed border-l-2 border-primary/40 pl-4 text-left">
          “{quote}”
        </blockquote>

        {/* Slow / offline hint */}
        {(slow || offline) && (
          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/80 animate-fade-in">
            <WifiOff className="w-3.5 h-3.5 text-primary/60" />
            <span>
              {offline
                ? "Você está offline. Reconectaremos automaticamente."
                : "Sinal fraco detectado. Continuamos tentando…"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
