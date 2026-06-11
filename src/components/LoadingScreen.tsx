import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { createPortal } from "react-dom";

const QUOTES = [
  "A constância vence o talento quando o talento não é constante.",
  "Disciplina é a ponte entre metas e conquistas.",
  "Quem domina o processo, controla o resultado.",
  "Operação afiada nasce de hábitos silenciosos.",
  "Cada conta validada é um passo rumo à liberdade.",
  "Foco no que se mede. Cresce o que se acompanha.",
  "O ouro pertence a quem garimpa todos os dias.",
  "Pequenas decisões diárias constroem grandes resultados.",
  "Estratégia sem execução é só intenção.",
  "Quem controla os números, controla o jogo.",
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
  // Safety: hide loading screen after 8s to prevent permanent black screen
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    // Force-remove loading screen after 8s if still stuck
    const killTimer = setTimeout(() => setHidden(true), 8000);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      clearTimeout(t);
      clearTimeout(killTimer);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-background overflow-hidden"
      style={{
        zIndex: 9999,
        animation: "nv-loader-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both",
        willChange: "opacity",
        contain: "layout paint style",
        backfaceVisibility: "hidden",
      }}
    >
      <style>{`
        @keyframes nv-loader-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes nv-loader-content-in {
          from { opacity: 0; transform: translate3d(0, 6px, 0) scale(0.985); }
          to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes nv-divider-grow {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        @keyframes nv-pulse-soft {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
      `}</style>

      {/* Ambient gold glow */}
      <div
        className="absolute top-1/2 left-1/2 w-[520px] h-[520px] rounded-full bg-primary/[0.08] blur-3xl pointer-events-none"
        style={{ transform: "translate3d(-50%, -50%, 0)", contain: "strict" }}
        aria-hidden
      />
      <div
        className="absolute top-1/2 left-1/2 w-[260px] h-[260px] rounded-full bg-primary/[0.06] blur-2xl pointer-events-none"
        style={{ transform: "translate3d(-50%, -50%, 0)", contain: "strict" }}
        aria-hidden
      />

      <div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full"
        style={{
          animation: "nv-loader-content-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both",
          animationDelay: "60ms",
          willChange: "opacity, transform",
        }}
      >
        {/* Favicon framed: square inside circle with orbiting dot */}
        <div className="relative mb-10 w-32 h-32 flex items-center justify-center">
          {/* Outer circle ring (orbiting dot) */}
          <div
            className="absolute inset-0 rounded-full border border-primary/25 animate-spin"
            style={{ animationDuration: "8s", willChange: "transform" }}
            aria-hidden
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)),0_0_24px_hsl(var(--primary)/0.6)]" />
          </div>

          {/* Square frame around favicon */}
          <div className="relative w-[88px] h-[88px] flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-lg border border-primary/30"
              style={{ boxShadow: "inset 0 0 24px hsl(var(--primary) / 0.08)" }}
              aria-hidden
            />
            <div className="relative w-[72px] h-[72px] rounded-md bg-black/60 border border-primary/20 flex items-center justify-center overflow-hidden">
              <img
                src="/web-app-manifest-192x192.png"
                alt="Nytzer Vision"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Brand */}
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Nytzer Vision
        </h2>
        <p
          className="text-[11px] uppercase tracking-[0.4em] text-primary/80 font-semibold mb-7"
          style={{ animation: "nv-pulse-soft 2.4s ease-in-out infinite" }}
        >
          {offline ? "Aguardando conexão" : message}
        </p>

        {/* Gold divider line */}
        <div
          className="h-px w-64 max-w-full bg-gradient-to-r from-transparent via-primary/70 to-transparent mb-8 origin-center"
          style={{
            animation: "nv-divider-grow 700ms cubic-bezier(0.22, 1, 0.36, 1) both",
            animationDelay: "200ms",
          }}
          aria-hidden
        />

        {/* Quote */}
        <blockquote className="text-sm md:text-base text-muted-foreground italic leading-relaxed border-l-2 border-primary/60 pl-4 text-left max-w-sm">
          {quote}
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
