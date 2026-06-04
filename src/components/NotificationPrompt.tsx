import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";
import { Bell, X, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export const NotificationPrompt = () => {
  const [user] = useLocalStorage<any>("nytzer-user", null);
  const [dismissedAt, setDismissedAt] = useLocalStorage<number | null>(
    "nytzer-notif-prompt-dismissed",
    null
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.username) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted" || Notification.permission === "denied") return;
    // re-prompt after 3 days if dismissed
    if (dismissedAt && Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) return;

    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [user?.username, dismissedAt]);

  const handleEnable = async () => {
    try {
      setLoading(true);
      await OneSignal.Notifications.requestPermission();
    } catch (e) {
      console.warn("[NotificationPrompt] error", e);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const handleLater = () => {
    setDismissedAt(Date.now());
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-6 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto"
        onClick={handleLater}
      />

      {/* Card */}
      <div className="relative w-full max-w-md pointer-events-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 fade-in duration-300">
        <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-[#0B0B0D]/95 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_hsl(var(--primary)/0.08)]">
          {/* Top hairline */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-24 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />

          {/* Close */}
          <button
            onClick={handleLater}
            aria-label="Fechar"
            className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative p-6 sm:p-7">
            {/* Icon */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/40 flex items-center justify-center shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-bold tracking-widest uppercase text-primary">
                  <Sparkles className="w-3 h-3" /> Recomendado
                </span>
              </div>
            </div>

            <h2 className="text-[22px] font-bold text-foreground leading-tight tracking-tight">
              Receba alertas em tempo real
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Ative as notificações e acompanhe metas finalizadas, remessas e
              comunicados oficiais sem precisar abrir o painel.
            </p>

            {/* Benefits */}
            <div className="mt-5 space-y-2.5">
              {[
                { icon: Zap, label: "Atualizações instantâneas das operações" },
                { icon: ShieldCheck, label: "Privacidade total — desative quando quiser" },
              ].map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <b.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-[13px] text-foreground/85">{b.label}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5">
              <button
                onClick={handleLater}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
              >
                Agora não
              </button>
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                {loading ? "Ativando..." : "Ativar notificações"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
