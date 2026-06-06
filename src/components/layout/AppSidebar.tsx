import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, CalendarDays, Globe2, ShieldCheck,
  BarChart3, ChevronLeft, ChevronRight, Zap, CreditCard, UsersRound, Wallet, UserCog, CirclePlay,
  LineChart, ReceiptText, Crosshair, WandSparkles, Crown
} from "lucide-react";
import { useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { SubscriptionModal } from "../SubscriptionModal";

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');
  const [user] = useLocalStorage<any>('nytzer-user', null);

  const navItems = [
    { path: "/app", label: "Dashboard", icon: LayoutDashboard, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/me", label: "Extrato", icon: Wallet, roles: ['OPERADOR'] },
    { path: "/operators", label: "Operadores", icon: Users, roles: ['ADMIN'] },
    { path: "/tasks", label: "Planilhas", icon: ChartNoAxesCombined, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/networks", label: "Redes", icon: Globe, roles: ['ADMIN'] },
    { path: "/pix", label: "PIX", icon: CreditCard, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/reports", label: "Relatórios", icon: BarChart3, roles: ['ADMIN'] },
    { path: "/costs", label: "Custos", icon: Receipt, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/goals", label: "Objetivos", icon: Target, roles: ['ADMIN'] },
    { path: "/subscription", label: "Assinatura", icon: Sparkles, roles: ['ADMIN'] },
    { path: "/tutorial", label: "Tutorial", icon: PlayCircle, roles: ['ADMIN', 'OPERADOR'] },
    ...(user?.username === 'nytzer' ? [{ path: "/master", label: "Mestre", icon: Crown, roles: ['ADMIN', 'OPERADOR'] }] : []),
  ].filter(item => item.roles.includes(role));

  // Removed bottomNavItems restriction to show all items on mobile

  return (
    <>
      {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
      <aside
        className={`hidden md:flex sticky left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 flex-col shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <Link
          to="/app"
          className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border shrink-0 group transition-all duration-300 hover:-translate-y-0.5 hover:bg-sidebar-accent/40 hover:shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.45)]"
        >
          <img
            src="/sidebar-logo.png"
            alt="NytzerVision"
            className="w-9 h-9 rounded-[10px] object-cover shrink-0 block transition-transform duration-300 group-hover:scale-105"
          />
          {!collapsed && (
            <span className="text-base font-semibold tracking-[-0.02em] text-foreground leading-none">
              <span className="font-light">Nytzer</span><span className="font-extrabold gradient-gold-text">Vision</span>
            </span>
          )}
        </Link>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-primary" : ""}`} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 pb-2">
          {!collapsed && role === 'ADMIN' && (
            <button
              onClick={() => navigate('/subscription')}
              className="mx-2 px-3 py-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 hover:border-primary/60 transition-all text-left group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-black text-primary tracking-wider">UPGRADE</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">Desbloqueie todo o poder do NytzerVision</p>
            </button>
          )}
          {collapsed && role === 'ADMIN' && (
            <button
              onClick={() => navigate('/subscription')}
              className="mx-2 h-9 rounded-lg bg-primary/15 hover:bg-primary/25 border border-primary/30 flex items-center justify-center text-primary transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          {!collapsed && (user?.role === 'ADMIN' || user?.username?.toUpperCase() === 'NYTZER' || user?.username?.toUpperCase() === 'WISEMAN') && (
            <div
              onClick={() => setRole(role === 'ADMIN' ? 'OPERADOR' : 'ADMIN')}
              className="mx-3 px-3 py-2 rounded-lg bg-black/20 border border-primary/20 text-xs flex justify-between items-center cursor-pointer hover:bg-black/40 transition-colors"
            >
              <span className="font-semibold text-muted-foreground">Visão: <span className="text-primary">{role}</span></span>
              <UserCog className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
          {!collapsed && user?.role === 'OPERADOR' && user?.username?.toUpperCase() !== 'NYTZER' && user?.username?.toUpperCase() !== 'WISEMAN' && (
            <div className="mx-3 px-3 py-2 rounded-lg bg-black/10 border border-border/10 text-xs flex justify-between items-center opacity-70">
              <span className="font-semibold text-muted-foreground">Visão: <span className="text-muted-foreground">{role}</span></span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mx-2 flex items-center justify-center h-8 rounded-lg text-muted-foreground hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border flex items-center justify-start gap-2 px-3 overflow-x-auto hide-scrollbar"
        style={{ zIndex: 200, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all shrink-0 min-w-[70px] ${
                active ? "text-primary bg-primary/5" : "text-sidebar-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
              <span className="text-[9px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>

      <SubscriptionModal open={planModalOpen} onOpenChange={setPlanModalOpen} />
    </>
  );
};
