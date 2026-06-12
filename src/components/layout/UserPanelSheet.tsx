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
                <InfoRow icon={Clock} label="Expira em" value={formatDate(plan.planExpiry)} />
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
              <Row
                icon={theme === "dark" ? Sun : Moon}
                label={theme === "dark" ? "Tema claro" : "Tema escuro"}
                onClick={toggleTheme}
              />
              <Row
                icon={Bell}
                label="Notificações"
                onClick={openNotifications}
                right={unreadCount > 0 ? (
                  <span className="min-w-[20px] h-5 px-1.5 text-[10px] font-extrabold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : undefined}
              />
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
