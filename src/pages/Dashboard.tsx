import { KPICard } from "@/components/dashboard/KPICard";
import { DollarSign, Target, Package, Users, TrendingUp, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { CalendarDays, ListTodo, ShieldCheck, Wrench, BarChart3 } from "lucide-react";

const barData = [
  { name: "Jan", producao: 420, meta: 400 },
  { name: "Fev", producao: 380, meta: 400 },
  { name: "Mar", producao: 450, meta: 420 },
  { name: "Abr", producao: 470, meta: 420 },
  { name: "Mai", producao: 520, meta: 450 },
  { name: "Jun", producao: 490, meta: 450 },
];

const areaData = [
  { name: "Seg", tarefas: 12 },
  { name: "Ter", tarefas: 19 },
  { name: "Qua", tarefas: 15 },
  { name: "Qui", tarefas: 22 },
  { name: "Sex", tarefas: 18 },
  { name: "Sáb", tarefas: 8 },
];

const pieData = [
  { name: "Concluído", value: 65 },
  { name: "Em andamento", value: 25 },
  { name: "Pendente", value: 10 },
];
const pieColors = ["hsl(160, 84%, 39%)", "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)"];

const quickLinks = [
  { path: "/production", label: "Produção", icon: CalendarDays, desc: "Cronograma de produção" },
  { path: "/tasks", label: "Tarefas", icon: ListTodo, desc: "Gestão de tarefas" },
  { path: "/inventory", label: "Estoque", icon: Package, desc: "Controle de estoque" },
  { path: "/quality", label: "Qualidade", icon: ShieldCheck, desc: "Controle de qualidade" },
  { path: "/maintenance", label: "Manutenção", icon: Wrench, desc: "Manutenção preventiva" },
  { path: "/reports", label: "Relatórios", icon: BarChart3, desc: "KPIs e relatórios" },
];

const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Visão geral das operações</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Receita mensal" value="R$ 84.230" change="+12.5% vs mês anterior" changeType="positive" icon={DollarSign} color="success" />
      <KPICard title="Metas atingidas" value="23/28" change="82% de conclusão" changeType="positive" icon={Target} color="primary" />
      <KPICard title="Itens em estoque" value="1.847" change="-3 abaixo do mínimo" changeType="negative" icon={Package} color="warning" />
      <KPICard title="Operadores ativos" value="18" change="2 novos este mês" changeType="positive" icon={Users} color="primary" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Produção vs Meta</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
            <Bar dataKey="producao" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="meta" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Status das tarefas</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
              {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {pieData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: pieColors[i] }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Tarefas concluídas por dia</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={areaData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
          <defs>
            <linearGradient id="colorTarefas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="tarefas" stroke="hsl(160, 84%, 39%)" fill="url(#colorTarefas)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>

    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Acesso rápido</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickLinks.map(({ path, label, icon: Icon, desc }) => (
          <Link key={path} to={path} className="glass-card rounded-xl p-4 hover:glow-primary transition-all duration-200 group text-center">
            <Icon className="w-6 h-6 text-primary mx-auto group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-foreground mt-2">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default Dashboard;
