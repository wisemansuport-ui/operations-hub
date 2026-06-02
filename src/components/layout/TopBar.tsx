import { Bell, Sun, Moon, User, Check, Trash2, Info, AlertTriangle, XCircle, CheckCircle2, Zap, RefreshCw } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications, AppNotification } from "@/contexts/NotificationContext";
import { useState, useRef, useEffect, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LogOut, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OneSignal from "react-onesignal";
import { toast } from "sonner";
import { registerDeviceTag, testPushToAdmin } from "@/lib/notifications";

// ─── Type config ───────────────────────────────────────────────────────────────
type FilterTab = "all" | AppNotification["type"];

const TYPE_META: Record<AppNotification["type"], {
  label: string;
  icon: React.ElementType;
  pillClass: string;
  glowClass: string;
  badgeClass: string;
}> = {
  info: {
    label: "Info",
    icon: Info,
    pillClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    glowClass: "shadow-blue-500/10",
    badgeClass: "bg-blue-500/20 text-blue-300",
  },
  success: {
    label: "Sucesso",
    icon: CheckCircle2,
    pillClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    glowClass: "shadow-emerald-500/10",
    badgeClass: "bg-emerald-500/20 text-emerald-300",
  },
  warning: {
    label: "Aviso",
    icon: AlertTriangle,
    pillClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    glowClass: "shadow-amber-500/10",
    badgeClass: "bg-amber-500/20 text-amber-300",
  },
  error: {
    label: "Erro",
    icon: XCircle,
    pillClass: "bg-red-500/15 text-red-400 border-red-500/30",
    glowClass: "shadow-red-500/10",
    badgeClass: "bg-red-500/20 text-red-300",
  },
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "info", label: "Info" },
  { key: "success", label: "Sucesso" },
  { key: "warning", label: "Aviso" },
  { key: "error", label: "Erro" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatRelativeTime = (ts: string | Date) => {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `${mins} min atrás`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h atrás`;
  const days = Math.floor(mins / 1440);
  if (days === 1) return "ontem";
  if (days < 7) return `${days} dias atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

// ─── Notification Card ─────────────────────────────────────────────────────────
const NotifCard = ({
  n,
  onRead,
  onDelete,
}: {
  n: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const meta = TYPE_META[n.type] ?? TYPE_META.info;
  const Icon = meta.icon;

  return (
    <div
      className={`
        group relative flex gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-0
        transition-all duration-200
        ${!n.read ? "bg-white/[0.03]" : "hover:bg-white/[0.015]"}
      `}
      onClick={() => !n.read && onRead(n.id)}
      style={{ cursor: !n.read ? "pointer" : "default" }}
    >
      {/* Unread accent bar */}
      {!n.read && (
        <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full bg-primary/70" />
      )}

      {/* Icon */}
      <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border ${meta.pillClass}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Type pill + title row */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`inline-flex text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${meta.pillClass}`}>
            {meta.label}
          </span>
          {!n.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
          )}
        </div>
        <p className={`text-[13px] font-bold leading-snug truncate ${!n.read ? "text-foreground" : "text-foreground/70"}`}>
          {n.title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {n.message}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium">
          {formatRelativeTime(n.timestamp)}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/15 text-muted-foreground/40 hover:text-red-400 mt-0.5"
        title="Remover"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

// ─── Main TopBar ───────────────────────────────────────────────────────────────
export const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotification } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const ref = useRef<HTMLDivElement>(null);
  const [user, setUser] = useLocalStorage<any>("nytzer-user", null);
  const [role, setRole] = useLocalStorage<"ADMIN" | "OPERADOR">("nytzer-role", "ADMIN");
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset tab when panel opens
  useEffect(() => {
    if (showNotifs) setActiveTab("all");
  }, [showNotifs]);

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  const filtered = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((n) => n.type === activeTab);
  }, [notifications, activeTab]);

  const tabCount = useMemo(() => {
    const counts: Partial<Record<FilterTab, number>> = { all: notifications.filter(n => !n.read).length };
    (["info", "success", "warning", "error"] as AppNotification["type"][]).forEach(t => {
      counts[t] = notifications.filter(n => n.type === t && !n.read).length;
    });
    return counts;
  }, [notifications]);

  const handleActivateAlerts = async () => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

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
      toast.error("❌ Notificações bloqueadas. Permita nas configurações do navegador.");
      return;
    }
    if (Notification.permission === "granted") {
      if (user?.username) {
        toast.loading("Vinculando dispositivo...", { id: "link-device" });
        await registerDeviceTag(user.username, user.role || "OPERADOR");
        toast.dismiss("link-device");
        toast.success(`✅ Dispositivo vinculado à conta "${user.username}"!`, { duration: 5000 });
      } else {
        toast.success("✅ Alertas já estão ativos neste dispositivo!");
      }
      return;
    }
    toast.loading("Aguardando sua permissão...", { id: "push-request" });
    try {
      const granted = await OneSignal.Notifications.requestPermission();
      toast.dismiss("push-request");
      if (granted) {
        if (user?.username) await registerDeviceTag(user.username, user.role || "OPERADOR");
        toast.success("✅ Alertas ativados! Você receberá notificações em tempo real.", { duration: 5000 });
      } else {
        toast.warning("Permissão negada. Ative nas configurações do aparelho.");
      }
    } catch {
      toast.dismiss("push-request");
      const result = await Notification.requestPermission().catch(() => "denied");
      if (result === "granted") {
        if (user?.username) await registerDeviceTag(user.username, user.role || "OPERADOR");
        toast.success("✅ Alertas ativados!");
      } else {
        toast.error("Não foi possível ativar. Tente via configurações do navegador.");
      }
    }
  };

  const handleTestPush = async () => {
    if (!user?.username) return;
    toast.loading("Enviando push de teste...", { id: "test-push" });
    await testPushToAdmin(user.username);
    toast.dismiss("test-push");
    toast.info("📤 Push enviado! Verifique o dispositivo em até 15s.", { duration: 8000 });
  };

  return (
    <header
      className="border-b border-border bg-card/80 backdrop-blur-xl flex flex-col sticky top-0 z-30"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="h-14 flex items-center justify-between px-4 md:px-6">
        {/* Left: status pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
            ● Sistema ativo
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* ── Notification Bell ── */}
          <div className="relative" ref={ref}>
            <button
              id="notif-bell-btn"
              onClick={() => setShowNotifs((v) => !v)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 relative
                ${showNotifs
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted"
                }`}
            >
              <Bell className={`w-4 h-4 transition-transform duration-300 ${showNotifs ? "scale-90" : ""}`} />

              {/* Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 text-[9px] font-extrabold bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/40 animate-in zoom-in-75 duration-200">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* ── Notification Panel ── */}
            {showNotifs && (
              <div
                className="absolute -right-14 sm:-right-4 md:right-0 top-12 w-[340px] sm:w-[380px]
                  bg-[#0D0D0F]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl
                  shadow-2xl shadow-black/60 overflow-hidden
                  animate-in fade-in-0 slide-in-from-top-2 duration-200 z-50"
              >
                {/* ── Panel Header ── */}
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-foreground tracking-tight">Notificações</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                          {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {role === "ADMIN" && user?.username && (
                        <button
                          onClick={handleTestPush}
                          className="text-[9px] font-bold text-amber-400 border border-amber-500/25 bg-amber-500/8 px-2 py-1 rounded-lg hover:bg-amber-500/15 transition-colors flex items-center gap-1"
                        >
                          <Zap className="w-2.5 h-2.5" />
                          Testar Push
                        </button>
                      )}
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/[0.05] transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Marcar lidas
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Activate alerts button */}
                  <button
                    onClick={handleActivateAlerts}
                    className="w-full flex items-center gap-2 text-[11px] font-semibold text-primary/80 hover:text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-primary/5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Ativar alertas neste dispositivo
                  </button>

                  {/* ── Filter Tabs ── */}
                  <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-0.5 no-scrollbar">
                    {TABS.map((tab) => {
                      const count = tabCount[tab.key] ?? 0;
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150
                            ${isActive
                              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
                            }`}
                        >
                          {tab.label}
                          {count > 0 && (
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full leading-none
                              ${isActive ? "bg-white/20 text-white" : "bg-primary/15 text-primary"}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Notification List ── */}
                <div className="max-h-[420px] overflow-y-auto overscroll-contain">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted/30 border border-white/[0.06] flex items-center justify-center">
                        <Bell className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-semibold text-muted-foreground/60">
                        {activeTab === "all" ? "Nenhuma notificação" : `Sem notificações de "${TABS.find(t => t.key === activeTab)?.label}"`}
                      </p>
                      <p className="text-[11px] text-muted-foreground/40 text-center">
                        {activeTab === "all"
                          ? "Você está em dia com tudo."
                          : "Tente outra categoria."}
                      </p>
                    </div>
                  ) : (
                    filtered.map((n) => (
                      <NotifCard
                        key={n.id}
                        n={n}
                        onRead={markAsRead}
                        onDelete={deleteNotification}
                      />
                    ))
                  )}
                </div>

                {/* ── Panel Footer ── */}
                {filtered.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/50">
                      {filtered.length} notificaç{filtered.length === 1 ? "ão" : "ões"}
                    </span>
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-semibold text-muted-foreground/60 hover:text-primary transition-colors"
                    >
                      Limpar todas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── User Menu ── */}
          <div className="ml-2 flex items-center gap-2 pl-3 border-l border-border relative group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[120px]">
                {user?.username || "Usuário"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">{user?.role || "Operador"}</p>
            </div>

            {/* Dropdown */}
            <div className="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[160px]">
              <div className="bg-[#0A0A0B]/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl p-1.5 flex flex-col transform origin-top-right transition-transform group-hover:scale-100 scale-95">
                <div className="px-3 py-2 mb-1 border-b border-border/50 sm:hidden">
                  <p className="text-sm font-bold text-foreground truncate">{user?.username || "Usuário"}</p>
                  <p className="text-[11px] text-muted-foreground">{user?.role || "Operador"}</p>
                </div>

                {user?.role === "ADMIN" && (
                  <button
                    onClick={() => setRole(role === "ADMIN" ? "OPERADOR" : "ADMIN")}
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
