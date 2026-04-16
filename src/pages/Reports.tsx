import { KPICard } from "@/components/dashboard/KPICard";
import { TrendingUp, CheckCircle, AlertTriangle, Clock, BarChart3, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const monthlyData = [
  { name: "Jan", eficiencia: 85, qualidade: 92, entrega: 88 },
  { name: "Fev", eficiencia: 87, qualidade: 90, entrega: 91 },
  { name: "Mar", eficiencia: 82, qualidade: 94, entrega: 85 },
  { name: "Abr", eficiencia: 90, qualidade: 96, entrega: 93 },
  { name: "Mai", eficiencia: 88, qualidade: 93, entrega: 90 },
  { name: "Jun", eficiencia: 92, qualidade: 95, entrega: 94 },
];

const Reports = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">KPIs & Relatórios</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Indicadores chave de performance</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="OEE Geral" value="87.3%" change="+2.1% vs mês anterior" changeType="positive" icon={TrendingUp} color="success" />
      <KPICard title="Taxa de qualidade" value="95.8%" change="+0.5%" changeType="positive" icon={CheckCircle} color="primary" />
      <KPICard title="Tempo parado" value="4.2h" change="-1.3h" changeType="positive" icon={Clock} color="warning" />
      <KPICard title="Não conformidades" value="3" change="+1 esta semana" changeType="negative" icon={AlertTriangle} color="destructive" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Eficiência Mensal (%)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} domain={[70, 100]} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
            <Bar dataKey="eficiencia" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Tendências de KPI</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} domain={[70, 100]} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
            <Line type="monotone" dataKey="qualidade" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="entrega" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="eficiencia" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default Reports;
