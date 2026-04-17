import { KPICard } from "@/components/dashboard/KPICard";
import { TrendingUp, CheckCircle, AlertTriangle, Clock, Users, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const monthlyData = [
  { name: "Jan", eficiencia: 85, qualidade: 92, entrega: 88 },
  { name: "Fev", eficiencia: 87, qualidade: 90, entrega: 91 },
  { name: "Mar", eficiencia: 82, qualidade: 94, entrega: 85 },
  { name: "Abr", eficiencia: 90, qualidade: 96, entrega: 93 },
  { name: "Mai", eficiencia: 88, qualidade: 93, entrega: 90 },
  { name: "Jun", eficiencia: 92, qualidade: 95, entrega: 94 },
];

const operatorPerformance = [
  { rank: 1, name: "Ana Silva", avatar: "AS", dia: 45, semana: 210, mes: 840, status: "Em Alta" },
  { rank: 2, name: "Carlos Mendes", avatar: "CM", dia: 38, semana: 195, mes: 790, status: "Consistente" },
  { rank: 3, name: "Beatriz Costa", avatar: "BC", dia: 35, semana: 180, mes: 720, status: "Estável" },
  { rank: 4, name: "Diego Santos", avatar: "DS", dia: 28, semana: 150, mes: 610, status: "Atenção" },
  { rank: 5, name: "Fernanda Lima", avatar: "FL", dia: 22, semana: 125, mes: 490, status: "Treinamento" },
];

const Reports = () => (
  <div className="space-y-6 relative z-10">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">KPIs & Relatórios</h1>
        <p className="text-sm text-primary/70 mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
          Indicadores chave de performance
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="OEE Geral" value="87.3%" change="+2.1% vs anterior" changeType="positive" icon={TrendingUp} color="success" />
      <KPICard title="Taxa de Qualidade" value="95.8%" change="+0.5%" changeType="positive" icon={CheckCircle} color="primary" />
      <KPICard title="Tempo Parado" value="4.2h" change="-1.3h" changeType="positive" icon={Clock} color="warning" />
      <KPICard title="Não Conformidades" value="3" change="+1 esta semana" changeType="negative" icon={AlertTriangle} color="destructive" />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
      <div className="glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden group">
        <h3 className="text-base font-bold text-foreground mb-1">Eficiência Mensal (%)</h3>
        <p className="text-xs text-muted-foreground mb-6">Comparativo histórico de capacidade produtiva.</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} domain={[70, 100]} />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
              contentStyle={{ background: "rgba(10, 10, 10, 0.9)", backdropFilter: "blur(12px)", border: "1px solid hsl(var(--primary)/0.2)", borderRadius: 12 }} 
            />
            <Bar dataKey="eficiencia" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden">
        <h3 className="text-base font-bold text-foreground mb-1">Tendências de Linha</h3>
        <p className="text-xs text-muted-foreground mb-6">Correlação de dados sobre qualidade (ouro), entrega (marrom) e eficiência (slate).</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthlyData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} domain={[70, 100]} />
            <Tooltip 
              contentStyle={{ background: "rgba(10, 10, 10, 0.9)", backdropFilter: "blur(12px)", border: "1px solid hsl(var(--primary)/0.2)", borderRadius: 12 }} 
            />
            <Line type="monotone" dataKey="qualidade" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            <Line type="monotone" dataKey="entrega" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="eficiencia" stroke="hsl(var(--border))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Operator Performance Ranking */}
    <div className="glass-card rounded-2xl p-6 border-primary/20 mt-6 bg-card/60 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Performance de Operadores</h3>
            <p className="text-xs text-muted-foreground">Volume de contas finalizadas por período</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-muted/40 border border-border">
          <Users className="w-3.5 h-3.5 text-primary" />
          {operatorPerformance.length} Operadores Ativos
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-black/20 border-b border-border">
            <tr>
              <th className="px-5 py-4 font-semibold text-center w-16">Rank</th>
              <th className="px-5 py-4 font-semibold">Colaborador</th>
              <th className="px-5 py-4 font-semibold text-center border-l border-border/30">Hoje</th>
              <th className="px-5 py-4 font-semibold text-center">Esta Semana</th>
              <th className="px-5 py-4 font-semibold text-center">Este Mês</th>
              <th className="px-5 py-4 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {operatorPerformance.map((op, i) => (
              <tr key={i} className="border-b border-border/10 hover:bg-white/[0.02] transition-colors last:border-0 group">
                <td className="px-5 py-4 text-center">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/30' : 
                    i === 1 ? 'bg-slate-300/20 text-slate-300 ring-1 ring-slate-300/30' : 
                    i === 2 ? 'bg-orange-700/20 text-orange-500 ring-1 ring-orange-500/30' : 
                    'bg-muted/50 text-muted-foreground'
                  }`}>
                    {op.rank}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20 shadow-inner group-hover:scale-105 transition-transform">
                      {op.avatar}
                    </div>
                    <span className="font-semibold text-foreground">{op.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-center border-l border-border/20">
                  <span className="text-primary font-bold">{op.dia}</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="text-foreground/90 font-semibold">{op.semana}</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="text-muted-foreground font-medium">{op.mes}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className={`inline-flex text-[10px] px-2.5 py-1 rounded bg-card/80 border font-bold uppercase tracking-wider ${
                    op.status === 'Em Alta' ? 'text-primary border-primary/30' : 
                    op.status === 'Consistente' ? 'text-blue-400 border-blue-500/30' : 
                    op.status === 'Estável' ? 'text-primary/80 border-primary/30' :
                    'text-orange-400 border-orange-500/30'
                  }`}>
                    {op.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Reports;
