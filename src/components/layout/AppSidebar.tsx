import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Globe, ShieldCheck,
  BarChart3, ChevronLeft, ChevronRight, Zap, CreditCard, Users, Wallet, UserCog, PlayCircle,
  ChartNoAxesCombined
} from "lucide-react";
import { useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [role, setRole] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/me", label: "Extrato", icon: Wallet, roles: ['OPERADOR'] },
    { path: "/operators", label: "Operadores", icon: Users, roles: ['ADMIN'] },
    { path: "/tasks", label: "Planilhas", icon: ChartNoAxesCombined, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/networks", label: "Redes", icon: Globe, roles: ['ADMIN'] },
    { path: "/pix", label: "PIX", icon: CreditCard, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/quality", label: "Qualidade", icon: ShieldCheck, roles: ['ADMIN'] },
    { path: "/reports", label: "Relatórios", icon: BarChart3, roles: ['ADMIN'] },
    { path: "/tutorial", label: "Tutorial", icon: PlayCircle, roles: ['ADMIN', 'OPERADOR'] },
  ].filter(item => item.roles.includes(role));

  // Bottom nav items (mobile) — show only the 5 most important
  const bottomNavItems = navItems.slice(0, 5);

  return (
    <>
      {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
      <aside
        className={`hidden md:flex sticky left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 flex-col shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-foreground text-base tracking-tight">
              Nytzer<span className="text-primary">Vision</span>
            </span>
          )}
        </div>

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
          {!collapsed && (
            <div
              onClick={() => setRole(role === 'ADMIN' ? 'OPERADOR' : 'ADMIN')}
              className="mx-3 px-3 py-2 rounded-lg bg-black/20 border border-primary/20 text-xs flex justify-between items-center cursor-pointer hover:bg-black/40 transition-colors"
            >
              <span className="font-semibold text-muted-foreground">Visão: <span className="text-primary">{role}</span></span>
              <UserCog className="w-3.5 h-3.5 text-muted-foreground" />
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

      {/* ── MOBILE BOTTOM NAV (hidden on desktop) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border flex items-center justify-around px-2"
        style={{ zIndex: 200, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {bottomNavItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                active ? "text-primary" : "text-sidebar-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
              <span className="text-[9px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
