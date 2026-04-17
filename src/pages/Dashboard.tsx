import { KPICard } from "@/components/dashboard/KPICard";
import { DollarSign, Target, Activity, Users, CalendarDays, ListTodo, ShieldCheck, Wrench, BarChart3, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";

const barData = [
  { name: "Jan", producao: 420, meta: 400 },
  { name: "Fev", producao: 380, meta: 400 },
  { name: "Mar", producao: 450, meta: 420 },
  { name: "Abr", producao: 470, meta: 420 },
  { name: "Mai", producao: 520, meta: 450 },
  { name: "Jun", producao: 580, meta: 450 },
];

const areaData = [
  { name: "Seg", tarefas: 12 },
  { name: "Ter", tarefas: 19 },
  { name: "Qua", tarefas: 15 },
  { name: "Qui", tarefas: 22 },
  { name: "Sex", tarefas: 28 },
  { name: "Sáb", tarefas: 14 },
];

const pieData = [
  { name: "Concluído", value: 65 },
  { name: "Em andamento", value: 25 },
  { name: "Pendente", value: 10 },
];
const pieColors = ["hsl(var(--primary))", "hsl(var(--primary) / 0.4)", "hsl(var(--muted))"];

const quickLinks = [
  { path: "/production", label: "Produção", icon: CalendarDays, desc: "Cronograma", roles: ['ADMIN', 'OPERADOR'] },
  { path: "/tasks", label: "Tarefas", icon: ListTodo, desc: "Gestão", roles: ['ADMIN', 'OPERADOR'] },
  { path: "/networks", label: "Redes", icon: Activity, desc: "Performance", roles: ['ADMIN'] },
  { path: "/quality", label: "Qualidade", icon: ShieldCheck, desc: "Auditoria", roles: ['ADMIN'] },
  { path: "/reports", label: "Relatórios", icon: BarChart3, desc: "Avançado", roles: ['ADMIN'] },
  { path: "/pix", label: "Chaves PIX", icon: CreditCard, desc: "Financeiro", roles: ['ADMIN', 'OPERADOR'] },
];

const Dashboard = () => {
  const [role] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');
  const allowedLinks = quickLinks.filter(link => link.roles.includes(role));

  return (
  <div className="space-y-6 relative z-10">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard Geral</h1>
        <p className="text-sm text-primary/70 mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
          Operações em Tempo Real
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Receita Mês" value="R$ 84.230" change="+12.5% vs anterior" changeType="positive" icon={DollarSign} color="success" />
      <KPICard title="Metas Atingidas" value="23/28" change="82% de fechamento" changeType="positive" icon={Target} color="primary" />
      <KPICard title="Links em Andamento" value="5" change="Operadores em metas ativas" changeType="warning" icon={Activity} color="warning" />
      <KPICard title="Operadores Online" value="18" change="Turno da Tarde" changeType="neutral" icon={Users} color="primary" />
    </div>

    {/* Modernized Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      <div className="lg:col-span-2 glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-all duration-700" />
        <h3 className="text-base font-bold text-foreground mb-1">Volume vs Metas</h3>
        <p className="text-xs text-muted-foreground mb-6">Acompanhamento do rendimento em relação aos objetivos estabelecidos.</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProducao" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(12px)", border: "1px solid hsl(var(--primary)/0.2)", borderRadius: 12, color: "hsl(var(--foreground))" }} 
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area type="monotone" dataKey="meta" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorMeta)" />
            <Area type="monotone" dataKey="producao" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorProducao)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-2xl p-6 border-primary/10 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
        <div className="w-full">
          <h3 className="text-base font-bold text-foreground mb-1">Status Atribuições</h3>
          <p className="text-xs text-muted-foreground mb-4">Progressão visual de volume.</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie 
              data={pieData} 
              cx="50%" cy="50%" 
              innerRadius={70} 
              outerRadius={90} 
              paddingAngle={5}
              dataKey="value" 
              strokeWidth={0}
            >
              {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
            </Pie>
            <Tooltip 
              contentStyle={{ background: "rgba(10, 10, 10, 0.9)", border: "1px solid hsl(var(--primary)/0.2)", borderRadius: 12 }} 
              itemStyle={{ color: "hsl(var(--foreground))", fontSize: '14px', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {pieData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-sm text-foreground font-medium">
              <div className="w-3 h-3 rounded-md" style={{ background: pieColors[i] }} />
              {d.name} <span className="text-muted-foreground ml-1">({d.value}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Col 1: Core Stats Graph */}
      <div className="glass-card rounded-2xl p-6 border-primary/10 flex flex-col justify-between">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Fluxo (Entradas vs Saídas)</h3>
        
        <div className="space-y-6">
           <div>
             <div className="flex justify-between items-end mb-2">
               <span className="text-sm font-medium text-muted-foreground">Total depositado</span>
               <span className="font-bold text-foreground tracking-tight">R$ 8.000,00</span>
             </div>
             <div className="w-full bg-emerald-950/30 rounded-full h-2.5 overflow-hidden">
               <div className="bg-emerald-400 h-full rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000" style={{ width: '45%' }} />
             </div>
           </div>

           <div>
             <div className="flex justify-between items-end mb-2">
               <span className="text-sm font-medium text-muted-foreground">Total sacado</span>
               <span className="font-bold text-foreground tracking-tight">R$ 9.450,00</span>
             </div>
             <div className="w-full bg-primary/10 rounded-full h-2.5 overflow-hidden">
               <div className="bg-primary h-full rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.5)] transition-all duration-1000" style={{ width: '55%' }} />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-border/20">
             <div className="flex flex-col gap-1">
               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total metas</span>
               <span className="text-2xl font-black text-foreground drop-shadow-md">8</span>
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Depositantes</span>
               <span className="text-2xl font-black text-foreground drop-shadow-md">140</span>
             </div>
           </div>
        </div>
      </div>

      {/* Col 2: Previsão Inteligente */}
      <div className="glass-card rounded-2xl p-6 border-primary/10">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-6">Previsao Inteligente</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Lucro medio/meta</span>
            <span className="text-sm font-bold text-emerald-400">R$ 165,94</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Lucro medio/conta</span>
            <span className="text-sm font-bold text-emerald-400">R$ 5,93</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/40 pt-5 mt-3">
            <span className="text-sm font-medium text-muted-foreground">Proximas 50 contas (estimativa)</span>
            <span className="text-base font-extrabold text-emerald-400">+R$ 296,32</span>
          </div>
        </div>
      </div>

      {/* Col 3: Redes Mais Lucrativas */}
      <div className="glass-card rounded-2xl p-6 border-primary/10">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.1em] mb-6">Redes Mais Lucrativas</h3>
        <div className="space-y-5">
           {[
             { title: 'VOY', subtitle: '1 metas · 50 contas', desc: 'R$ 6,26/conta · 100% acerto', val: '+R$ 312,80' },
             { title: 'DY', subtitle: '1 metas · 30 contas', desc: 'R$ 7,49/conta · 100% acerto', val: '+R$ 224,60' },
             { title: 'W1', subtitle: '1 metas · 20 contas', desc: 'R$ 7,41/conta · 100% acerto', val: '+R$ 148,20' },
             { title: 'OKOK', subtitle: '2 metas · 40 contas', desc: 'R$ 3,60/conta · 50% acerto', val: '+R$ 144,10' }
           ].map((net, i) => (
             <div key={i} className="flex items-center justify-between border-b border-border/20 pb-4 last:border-0 last:pb-0">
               <div className="flex items-center gap-4">
                 <div className="w-11 h-11 rounded-lg bg-red-950/30 border border-red-900/50 flex items-center justify-center font-black text-red-500 text-xs shadow-inner">
                   {net.title}
                 </div>
                 <div>
                    <p className="font-extrabold text-foreground text-[13px] tracking-tight">{net.subtitle}</p>
                    <p className="text-[10px] font-medium text-muted-foreground mt-1">{net.desc}</p>
                 </div>
               </div>
               <span className="font-bold text-emerald-400 text-sm tracking-tight">{net.val}</span>
             </div>
           ))}
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-bold text-foreground mb-3 tracking-wide uppercase">Comandos Rápidos</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {allowedLinks.map(({ path, label, icon: Icon, desc }) => (
          <Link key={path} to={path} className="glass-card rounded-xl p-4 hover:bg-primary/5 border border-transparent hover:border-primary/30 transition-all duration-300 group text-center flex flex-col items-center justify-center h-full">
            <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors mb-3">
              <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform shadow-sm" />
            </div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  </div>
  );
};

export default Dashboard;

