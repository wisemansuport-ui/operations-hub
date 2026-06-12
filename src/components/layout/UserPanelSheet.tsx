import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Settings, Megaphone, UserCog, LogOut, Sun, Moon, Bell, User, Calendar, ShieldCheck, Clock, Crown, Unlink } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import { SettingsModal } from "@/components/SettingsModal";
import { TriggerProfitModal } from "@/components/TriggerProfitModal";
import { usePlan } from "@/hooks/usePlan";
import { useState } from "react";


interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const UserPanelSheet = ({ open, onOpenChange }: Props) => {
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [user, setUser] = useLocalStorage<any>("nytzer-user", null);
  const [role, setRole] = useLocalStorage<"ADMIN" | "OPERADOR">("nytzer-role", "ADMIN");
  const [showSettings, setShowSettings] = useState(false);
  const [showTrigger, setShowTrigger] = useState(false);
  const plan = usePlan();
  const navigate = useNavigate();


  const isAdmin = user?.role === "ADMIN" || user?.username?.toUpperCase() === "NYTZER" || user?.username?.toUpperCase() === "WISEMAN";

  const handleLogout = () => {
    setUser(null);
    onOpenChange(false);
    navigate("/login");
  };

  const openNotifications = () => {
    onOpenChange(false);
    setTimeout(() => {
      const btn = document.getElementById("notif-bell-btn") as HTMLButtonElement | null;
      btn?.click();
    }, 150);
  };

  const Row = ({
    icon: Icon, label, onClick, right, danger,
  }: { icon: any; label: string; onClick: () => void; right?: React.ReactNode; danger?: boolean }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 bg-card/40 hover:bg-card/80 hover:border-primary/40 transition-all text-left ${danger ? "text-destructive hover:text-red-400 hover:border-destructive/40" : "text-foreground"}`}
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {right}
    </button>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[88vw] sm:max-w-sm p-0 flex flex-col bg-background border-l border-border/60">
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/40">
            <SheetTitle className="sr-only">Painel do usuário</SheetTitle>
            <SheetDescription className="sr-only">Configurações e ações da conta</SheetDescription>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-primary/40 bg-primary/10 shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground truncate">{user?.username || "Usuário"}</p>
                <p className="text-[11px] text-muted-foreground">{user?.role || "Operador"}</p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {isAdmin && (
              <div className="rounded-2xl border border-border/40 bg-card/40 p-4 space-y-2.5">
                <InfoRow icon={Calendar} label="Membro desde" value={formatDate(user?.createdAt)} />
                <InfoRow
                  icon={ShieldCheck}
                  label="Status da Assinatura"
                  value={planStatusLabel(plan.status)}
                  valueClass={planStatusColor(plan.status)}
                />
                <InfoRow icon={Clock} label="Expira em" value={plan.status === "eternal" ? "∞ Infinito" : formatDate(plan.planExpiry)} valueClass={plan.status === "eternal" ? "text-success font-bold" : ""} />
                <InfoRow icon={Crown} label="Plano" value={plan.planName} valueClass="text-foreground font-bold" />
              </div>
            )}

            {user?.method === "Google SSO" && (
              <div className="rounded-2xl border border-border/40 bg-card/40 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <GoogleIcon />
                  <span className="text-sm font-bold text-foreground">Conta Google</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-success font-semibold">
                    <span className="w-2 h-2 rounded-full bg-success" /> Vinculada
                  </span>
                  <span className="text-muted-foreground truncate">({user?.email || `${user?.username}@gmail.com`})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-all"
                >
                  <Unlink className="w-3.5 h-3.5" /> Desvincular
                </button>
              </div>
            )}

            <div className="space-y-2">
              {isAdmin && (
                <>
                  <Row icon={Settings} label="Configurações" onClick={() => setShowSettings(true)} />
                  <Row icon={Megaphone} label="Disparar lucros" onClick={() => setShowTrigger(true)} />
                  <Row
                    icon={UserCog}
                    label={`Visão: ${role}`}
                    onClick={() => setRole(role === "ADMIN" ? "OPERADOR" : "ADMIN")}
                  />
                </>
              )}
            </div>
          </div>


          <div className="px-4 py-3 border-t border-border/40">
            <Row icon={LogOut} label="Sair da conta" onClick={handleLogout} danger />
          </div>
        </SheetContent>
      </Sheet>

      {user?.id && (
        <SettingsModal open={showSettings} onOpenChange={setShowSettings} adminUserId={user.id} />
      )}
      <TriggerProfitModal open={showTrigger} onOpenChange={setShowTrigger} />
    </>
  );
};

const InfoRow = ({ icon: Icon, label, value, valueClass }: { icon: any; label: string; value: string; valueClass?: string }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
    <span className={`text-xs font-semibold text-foreground truncate ${valueClass || ""}`}>{value}</span>
  </div>
);

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
};

const planStatusLabel = (s: string) =>
  s === "eternal" ? "🟢 Online" : s === "active" ? "Ativa" : s === "trial" ? "Trial" : s === "expired" ? "Expirada" : "Sem plano";

const planStatusColor = (s: string) =>
  s === "eternal" ? "text-success" : s === "active" ? "text-success" : s === "trial" ? "text-primary" : s === "expired" ? "text-destructive" : "text-muted-foreground";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
    <path fill="#34A853" d="M3.9 7.5l3.2 2.3C8 7.9 9.8 6.5 12 6.5c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 8.3 2.4 5.1 4.5 3.9 7.5z" opacity=".0"/>
  </svg>
);

