import { Bell, Sun, Moon, User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useState, useRef, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LogOut, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OneSignal from "react-onesignal";
import { toast } from "sonner";
import { registerDeviceTag, testPushToAdmin } from "@/lib/notifications";

export const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [user, setUser] = useLocalStorage<any>('nytzer-user', null);
  const [role, setRole] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatTime = (ts: string | Date) => {
    const d = typeof ts === 'string' ? new Date(ts) : ts;
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}m atrás`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h atrás`;
    return `${Math.floor(mins / 1440)}d atrás`;
  };

  const handleActivateAlerts = async () => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isPWA = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;

    if (isIOS && !isPWA) {
      toast.info("📲 Adicione à Tela de Início", {
        description: "No Safari: toque em Compartilhar ↗ → 'Adicionar à Tela de Início' → abra pelo ícone e tente novamente.",
        duration: 8000,
      });
      return;
    }

    if (!("Notification" in window)) {
      toast.error("Navegador não suporta notificações push.");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error("❌ Notificações bloqueadas. Vá em Configurações → Safari → Notificações e permita este site.");
      return;
    }

    if (Notification.permission === "granted") {
      if (user?.username) {
        toast.loading("Vinculando dispositivo...", { id: "link-device" });
        await registerDeviceTag(user.username, user.role || 'OPERADOR');
        toast.dismiss("link-device");
        toast.success(`✅ Dispositivo vinculado à conta "${user.username}"!`, { duration: 5000 });
      } else {
        toast.success("✅ Alertas já estão ativos neste dispositivo!");
      }
      return;
    }

    // Request permission
    toast.loading("Aguardando sua permissão...", { id: "push-request" });
    try {
      const granted = await OneSignal.Notifications.requestPermission();
      toast.dismiss("push-request");
      if (granted) {
        if (user?.username) await registerDeviceTag(user.username, user.role || 'OPERADOR');
        toast.success("✅ Alertas ativados! Você receberá notificações em tempo real.", { duration: 5000 });
      } else {
        toast.warning("Permissão negada. Ative nas configurações do aparelho.");
      }
    } catch {
      toast.dismiss("push-request");
      const result = await Notification.requestPermission().catch(() => "denied");
      if (result === "granted") {
        if (user?.username) await registerDeviceTag(user.username, user.role || 'OPERADOR');
        toast.success("✅ Alertas ativados!");
      } else {
        toast.error("Não foi possível ativar. Tente via Safari → Configurações → Notificações.");
      }
    }
  };

  const handleTestPush = async () => {
    if (!user?.username) return;
    toast.loading("Enviando push de teste...", { id: "test-push" });
    await testPushToAdmin(user.username);
    toast.dismiss("test-push");
    toast.info("📤 Push enviado! Verifique o iPhone em até 15 segundos.", { duration: 8000 });
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
                {/* Header */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-foreground">Notificações</span>
                    <div className="flex items-center gap-2">
                      {role === 'ADMIN' && user?.username && (
                        <button
                          onClick={handleTestPush}
                          className="text-[9px] font-bold text-amber-500 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded hover:bg-amber-500/20 transition-colors"
                        >
                          🧪 Testar Push
                        </button>
                      )}
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground">
                          Marcar lidas
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleActivateAlerts}
                    className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline active:opacity-70 touch-manipulation"
                  >
                    🔔 Ativar Alertas no Dispositivo
                  </button>
                </div>

                {/* Notification List */}
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">Sem notificações</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
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

          <div className="ml-2 flex items-center gap-2 pl-3 border-l border-border relative group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[120px]">{user?.username || 'Usuário'}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{user?.role || 'Operador'}</p>
            </div>
            {/* User Menu Dropdown */}
            <div className="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[160px]">
              <div className="bg-[#0A0A0B]/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl p-1.5 flex flex-col transform origin-top-right transition-transform group-hover:scale-100 scale-95">
                <div className="px-3 py-2 mb-1 border-b border-border/50 sm:hidden">
                  <p className="text-sm font-bold text-foreground truncate">{user?.username || 'Usuário'}</p>
                  <p className="text-[11px] text-muted-foreground">{user?.role || 'Operador'}</p>
                </div>

                {(user?.role === 'ADMIN') && (
                  <button
                    onClick={() => setRole(role === 'ADMIN' ? 'OPERADOR' : 'ADMIN')}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors w-full mb-1"
                  >
                    <UserCog className="w-4 h-4" />
                    Visão: {role}
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-red-400 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
