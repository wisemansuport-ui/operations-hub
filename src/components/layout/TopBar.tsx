import { Bell, Sun, Moon, User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useState, useRef, useEffect } from "react";

export const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatTime = (d: Date) => {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}m atrás`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h atrás`;
    return `${Math.floor(mins / 1440)}d atrás`;
  };

  return (
    <header
      className="border-b border-border bg-card/80 backdrop-blur-xl flex flex-col sticky top-0 z-30"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="h-14 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
          ● Sistema ativo
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute -right-14 sm:-right-4 md:right-0 top-11 w-[300px] sm:w-80 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">Notificações</span>
                  <button 
                    onClick={() => {
                      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
                      const isPWA = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;

                      // iOS Safari: only works as installed PWA
                      if (isIOS && !isPWA) {
                        alert("📲 Para ativar alertas no iPhone:\n\n1. Toque em Compartilhar ↗\n2. Toque em \"Adicionar à Tela de Início\"\n3. Abra o app pelo ícone criado\n4. Volte aqui e clique em Ativar Alertas");
                        return;
                      }

                      // Standard Web Push (Chrome, Firefox, PWA no iOS 16.4+)
                      if (!("Notification" in window)) {
                        alert("Seu navegador não suporta notificações push.");
                        return;
                      }

                      if (Notification.permission === "granted") {
                        alert("✅ Alertas já estão ativos neste dispositivo!");
                        return;
                      }

                      if (Notification.permission === "denied") {
                        alert("❌ Notificações bloqueadas. Vá em Configurações do navegador → Notificações e permita este site.");
                        return;
                      }

                      // This must be synchronous from a user gesture
                      Notification.requestPermission().then((result) => {
                        if (result === "granted") {
                          new Notification("✅ NytzerVision Alertas Ativados!", {
                            body: "Você vai receber alertas de remessas e operações.",
                            icon: "/favicon.ico"
                          });
                        } else {
                          alert("Permissão negada. Ative nas configurações do seu navegador.");
                        }
                      });
                    }} 
                    className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    🔔 Ativar Alertas no Dispositivo
                  </button>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground">
                    Marcar lidas
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">Sem notificações</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatTime(n.timestamp)}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="ml-2 flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-tight">Admin</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Administrador</p>
          </div>
        </div>
      </div>
    </div>
    </header>
  );
};
