import { Bell, Sun, Moon, User, Check, Trash2, Info, AlertTriangle, XCircle, CheckCircle2, Zap, RefreshCw, ArrowDownRight, ArrowUpRight, Trophy, PlayCircle, Megaphone, Receipt, TrendingUp, Settings } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { TriggerProfitModal } from "@/components/TriggerProfitModal";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications, AppNotification } from "@/contexts/NotificationContext";
import { useState, useRef, useEffect, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LogOut, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OneSignal from "react-onesignal";
import { toast } from "sonner";
import { registerDeviceTag, testPushToAdmin } from "@/lib/notifications";

// ─── Types & Tabs ──────────────────────────────────────────────────────────────
type FilterTab = "all" | AppNotification["type"];

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "info", label: "Info" },
  { key: "success", label: "Sucesso" },
  { key: "warning", label: "Aviso" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatRelativeTime = (ts: string | Date) => {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  const days = Math.floor(mins / 1440);
  if (days === 1) return "ontem";
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const formatCount = (n: number) => (n > 99 ? "99+" : String(n));

type Category = "remessa" | "meta_finalizada" | "meta_iniciada" | "info_oficial" | "resumo_lucro" | "generic";

interface ParsedNotif {
  category: Category;
  operator?: string;
  value?: number;
  detail?: string;
  headline: string;
}

const parseValue = (text: string): number | undefined => {
  const m = text.match(/R\$\s*(-?[\d.,]+)/i);
  if (!m) return undefined;
  let raw = m[1];
  if (/,\d{2}$/.test(raw)) raw = raw.replace(/\./g, "").replace(",", ".");
  else raw = raw.replace(/,/g, "");
  const v = parseFloat(raw);
  return isNaN(v) ? undefined : v;
};

const parseOperator = (text: string): string | undefined => {
  const m = text.match(/\[([^\]]+)\]/);
  return m ? m[1].trim() : undefined;
};

const parseNotif = (n: AppNotification): ParsedNotif => {
  const title = (n.title || "").toLowerCase();
  const msg = n.message || "";
  const operator = parseOperator(msg) || parseOperator(n.title || "");
  const value = parseValue(msg);

  let category: Category = "generic";
  let headline = n.title || "Notificação";

  if (title.includes("resumo") || title.includes("lucro do") || title.includes("lucro da")) {
    category = "resumo_lucro";
    headline = n.title || "Resumo de lucro";
  } else if (title.includes("remessa")) {
    category = "remessa";
    headline = "Remessa registrada";
  } else if (title.includes("meta") && (title.includes("final") || title.includes("conclu"))) {
    category = "meta_finalizada";
    headline = "Meta finalizada";
  } else if (title.includes("meta") && (title.includes("inici") || title.includes("nova"))) {
    category = "meta_iniciada";
    headline = "Meta iniciada";
  } else if (n.type === "info") {
    category = "info_oficial";
    headline = n.title || "Comunicado oficial";
  }

  const detail = msg
    .replace(/\[[^\]]+\]\s*/, "")
    .replace(/Operador registrou:?\s*/i, "")
    .replace(/Lucro\/Prej\.\s*R\$\s*-?[\d.,]+/i, "")
    .replace(/R\$\s*-?[\d.,]+/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { category, operator, value, detail, headline };
};

const CATEGORY_META: Record<Category, { icon: React.ElementType; tint: string; bar: string; chip: string; label: string }> = {
  remessa:         { icon: Receipt,    tint: "text-amber-300",        bar: "bg-amber-400/70",   chip: "bg-amber-500/10 text-amber-300 border-amber-500/20",     label: "Remessa" },
  meta_finalizada: { icon: Trophy,     tint: "text-emerald-300",      bar: "bg-emerald-400/70", chip: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", label: "Meta finalizada" },
  meta_iniciada:   { icon: PlayCircle, tint: "text-sky-300",          bar: "bg-sky-400/70",     chip: "bg-sky-500/10 text-sky-300 border-sky-500/20",           label: "Meta iniciada" },
  info_oficial:    { icon: Megaphone,  tint: "text-violet-300",       bar: "bg-violet-400/70",  chip: "bg-violet-500/10 text-violet-300 border-violet-500/20",   label: "Comunicado" },
  resumo_lucro:    { icon: TrendingUp,  tint: "text-primary",          bar: "bg-primary/70",     chip: "bg-primary/10 text-primary border-primary/20",            label: "Resumo" },
  generic:         { icon: Info,       tint: "text-muted-foreground", bar: "bg-white/20",       chip: "bg-white/5 text-muted-foreground border-white/10",       label: "Aviso" },
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

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
  const p = useMemo(() => parseNotif(n), [n]);
  const meta = CATEGORY_META[p.category];
  const Icon = meta.icon;
  const isNeg = typeof p.value === "number" && p.value < 0;
  const isPos = typeof p.value === "number" && p.value > 0;

  return (
    <div
      onClick={() => !n.read && onRead(n.id)}
      className={`group relative flex gap-3 pl-4 pr-3 py-3 border-b border-white/[0.04] last:border-0 transition-colors
        ${!n.read ? "bg-white/[0.025]" : "hover:bg-white/[0.015]"}`}
      style={{ cursor: !n.read ? "pointer" : "default" }}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full transition-opacity
          ${!n.read ? "opacity-100" : "opacity-30"} ${meta.bar}`}
      />

      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-white/[0.03] ${meta.tint}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${meta.chip}`}>
              {meta.label}
            </span>
            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
          </div>
          <span className="text-[10px] text-muted-foreground/60 tabular-nums flex-shrink-0">
            {formatRelativeTime(n.timestamp)}
          </span>
        </div>

        <p className={`mt-1 text-[13px] font-semibold leading-tight ${!n.read ? "text-foreground" : "text-foreground/80"}`}>
          {p.headline}
        </p>

        {(p.operator || typeof p.value === "number") && (
          <div className="mt-1.5 flex items-center justify-between gap-2">
            {p.operator ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] min-w-0">
                <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                  {p.operator.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium text-foreground/80 truncate">{cap(p.operator)}</span>
              </span>
            ) : <span />}

            {typeof p.value === "number" && (
              <span className={`inline-flex items-center gap-1 text-[12px] font-bold tabular-nums flex-shrink-0
                ${isNeg ? "text-red-400" : isPos ? "text-emerald-400" : "text-foreground/80"}`}>
                {isNeg ? <ArrowDownRight className="w-3 h-3" /> : isPos ? <ArrowUpRight className="w-3 h-3" /> : null}
                {fmtBRL(p.value)}
              </span>
            )}
          </div>
        )}

        {p.detail && p.category === "info_oficial" && (
          <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {p.detail}
          </p>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
        className="self-start flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/15 text-muted-foreground/40 hover:text-red-400"
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
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const ref = useRef<HTMLDivElement>(null);
  const [user, setUser] = useLocalStorage<any>("nytzer-user", null);
  const [role, setRole] = useLocalStorage<"ADMIN" | "OPERADOR">("nytzer-role", "ADMIN");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (showNotifs) setActiveTab("all");
  }, [showNotifs]);

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  // Refined filtering — Sucesso = somente metas finalizadas; Info = somente comunicados oficiais
  const filtered = useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "success") {
      return notifications.filter((n) => parseNotif(n).category === "meta_finalizada");
    }
    if (activeTab === "info") {
      return notifications.filter((n) => {
        const c = parseNotif(n).category;
        return c === "info_oficial" || c === "resumo_lucro";
      });
    }
    return notifications.filter((n) => n.type === activeTab);
  }, [notifications, activeTab]);

  const tabCount = useMemo(() => {
    const counts: Partial<Record<FilterTab, number>> = {
      all: notifications.filter((n) => !n.read).length,
      success: notifications.filter((n) => !n.read && parseNotif(n).category === "meta_finalizada").length,
      info: notifications.filter((n) => {
        if (n.read) return false;
        const c = parseNotif(n).category;
        return c === "info_oficial" || c === "resumo_lucro";
      }).length,
      warning: notifications.filter((n) => !n.read && n.type === "warning").length,
    };
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
      <div className="h-12 flex items-center justify-end px-3 md:px-5 gap-0.5">
        <button
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
        </button>


          {/* ── Notification Bell ── */}
          <div className="relative" ref={ref}>
            <button
              id="notif-bell-btn"
              onClick={() => setShowNotifs((v) => !v)}
              aria-label="Notificações"
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors relative
                ${showNotifs
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/60"
                }`}
            >
              <Bell className="w-[15px] h-[15px]" />


              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[9px] font-extrabold bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/40 animate-in zoom-in-75 duration-200">
                  {formatCount(unreadCount)}
                </span>
              )}
            </button>

            {/* ── Notification Panel ── */}
            {showNotifs && (
              <div
                className="fixed left-2 right-2 top-[calc(env(safe-area-inset-top)+3.5rem)] w-auto
                  sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[400px]
                  bg-[#0B0B0D]/95 backdrop-blur-2xl border border-primary/15 rounded-2xl
                  shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_hsl(var(--primary)/0.05)] overflow-hidden
                  animate-in fade-in-0 slide-in-from-top-2 duration-200 z-50"
              >
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground tracking-tight leading-none">Central de alertas</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {unreadCount > 0
                            ? `${formatCount(unreadCount)} pendente${unreadCount > 1 ? "s" : ""} de leitura`
                            : "Tudo em dia"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {role === "ADMIN" && user?.username && (
                        <button
                          onClick={handleTestPush}
                          className="text-[9px] font-bold text-primary border border-primary/25 bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                          title="Enviar push de teste"
                        >
                          <Zap className="w-2.5 h-2.5" />
                          Teste
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

                  <button
                    onClick={handleActivateAlerts}
                    className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold text-primary/80 hover:text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-primary/5 border border-dashed border-primary/20"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Ativar alertas neste dispositivo
                  </button>

                  {/* Tabs */}
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
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full leading-none tabular-nums
                              ${isActive ? "bg-white/20 text-white" : "bg-primary/15 text-primary"}`}>
                              {formatCount(count)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[440px] overflow-y-auto overscroll-contain">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted/30 border border-white/[0.06] flex items-center justify-center">
                        <Bell className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-semibold text-muted-foreground/60">
                        {activeTab === "all" ? "Nenhuma notificação" : `Sem registros em "${TABS.find(t => t.key === activeTab)?.label}"`}
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

                {/* Footer */}
                {filtered.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.015]">
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                      {formatCount(filtered.length)} {filtered.length === 1 ? "registro" : "registros"}
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
          <div className="ml-1.5 flex items-center gap-2 pl-2 relative group">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
              {user?.photoURL
                ? <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-3.5 h-3.5 text-primary" />}
            </div>

            <div className="hidden sm:block leading-tight">
              <p className="text-[13px] font-medium text-foreground truncate max-w-[120px]">
                {user?.username || "Usuário"}
              </p>
              <p className="text-[10px] text-muted-foreground/70">{user?.role || "Operador"}</p>
            </div>

            <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[160px]">
              <div className="bg-[#0A0A0B]/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl p-1.5 flex flex-col">
                <div className="px-3 py-2 mb-1 border-b border-border/50 sm:hidden">
                  <p className="text-sm font-bold text-foreground truncate">{user?.username || "Usuário"}</p>
                  <p className="text-[11px] text-muted-foreground">{user?.role || "Operador"}</p>
                </div>

                {user?.role === "ADMIN" && (
                  <>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors w-full"
                    >
                      <Settings className="w-4 h-4" />
                      Configurações
                    </button>
                    <button
                      onClick={() => setRole(role === "ADMIN" ? "OPERADOR" : "ADMIN")}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors w-full mb-1"
                    >
                      <UserCog className="w-4 h-4" />
                      Visão: {role}
                    </button>
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-red-400 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </div>
            </div>
          </div>
        </div>

      {user?.id && (
        <SettingsModal open={showSettings} onOpenChange={setShowSettings} adminUserId={user.id} />
      )}
    </header>
  );
};
