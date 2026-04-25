import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, ListTodo, Globe, ShieldCheck,
  BarChart3, ChevronLeft, ChevronRight, Zap, CreditCard, Users, Wallet, UserCog, PlayCircle,
  ChartNoAxesCombined
} from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [role, setRole] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/me", label: "Meu Extrato", icon: Wallet, roles: ['OPERADOR'] },
    { path: "/operators", label: "Gestão de Operadores", icon: Users, roles: ['ADMIN'] },
    { path: "/production", label: "Tarefas", icon: CalendarDays, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/tasks", label: "Planilhas", icon: ChartNoAxesCombined, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/networks", label: "Redes", icon: Globe, roles: ['ADMIN'] },
    { path: "/pix", label: "Chaves PIX", icon: CreditCard, roles: ['ADMIN', 'OPERADOR'] },
    { path: "/quality", label: "Qualidade", icon: ShieldCheck, roles: ['ADMIN'] },
    { path: "/reports", label: "Relatórios", icon: BarChart3, roles: ['ADMIN'] },
    { path: "/tutorial", label: "Tutorial", icon: PlayCircle, roles: ['ADMIN', 'OPERADOR'] },
  ].filter(item => item.roles.includes(role));

  return (
    <aside
      className={`sticky left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 flex flex-col shrink-0 ${
        collapsed ? "w-16" : "w-16 md:w-60"
      }`}
    >
      <div
        className="flex items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 10px)`, paddingBottom: "10px", minHeight: "56px" }}
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold text-foreground text-base tracking-tight hidden md:inline">
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-primary" : ""}`} />
              {!collapsed && <span className="hidden md:inline">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        {!collapsed && (
          <div 
            onClick={() => setRole(role === 'ADMIN' ? 'OPERADOR' : 'ADMIN')}
            className="mx-3 px-3 py-2 rounded-lg bg-black/20 border border-primary/20 text-xs hidden md:flex justify-between items-center cursor-pointer hover:bg-black/40 transition-colors"
          >
            <span className="font-semibold text-muted-foreground">Visão: <span className={role === 'ADMIN' ? 'text-primary' : 'text-primary/80'}>{role}</span></span>
            <UserCog className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-2 mb-3 hidden md:flex items-center justify-center h-8 rounded-lg text-muted-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
