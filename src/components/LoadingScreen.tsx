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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden">
      {/* Ambient gold glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/20 blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
        {/* Favicon with halo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.4)] backdrop-blur-sm">
            <img
              src="/web-app-manifest-192x192.png"
              alt="Nytzer Vision"
              className="w-14 h-14 object-contain animate-[fade-in_0.6s_ease-out]"
            />
          </div>
          {/* Orbiting ring */}
          <div className="absolute inset-0 -m-3 rounded-full border border-primary/20 animate-spin [animation-duration:6s]">
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
        <div className="w-56 h-[3px] rounded-full bg-primary/10 overflow-hidden mb-8">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-[slide-in_1.4s_ease-in-out_infinite]" />
        </div>

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
