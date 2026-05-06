import { KPICard } from "@/components/dashboard/KPICard";
import { DollarSign, Target, Activity, Users, CalendarDays, ListTodo, ShieldCheck, Wrench, BarChart3, Globe, ChartNoAxesCombined, CreditCard, PlayCircle, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { OperationMeta } from "./Tasks";
import { useMemo } from "react";

const areaData = [
  { name: "Seg", tarefas: 12 },
  { name: "Ter", tarefas: 19 },
  { name: "Qua", tarefas: 15 },
  { name: "Qui", tarefas: 22 },
  { name: "Sex", tarefas: 28 },
  { name: "Sáb", tarefas: 14 },
];

const pieColors = ["hsl(var(--primary))", "hsl(var(--primary) / 0.4)", "hsl(var(--muted))"];

const quickLinks = [
  { path: "/production", label: "Planilhas", icon: ChartNoAxesCombined, desc: "Cronograma", roles: ['ADMIN', 'OPERADOR'] },
  { path: "/tasks", label: "Tarefas", icon: CalendarDays, desc: "Gestão", roles: ['ADMIN', 'OPERADOR'] },
  { path: "/reports", label: "Relatórios", icon: BarChart3, desc: "Avançado", roles: ['ADMIN'] },
  { path: "/pix", label: "Chaves PIX", icon: CreditCard, desc: "Financeiro", roles: ['ADMIN', 'OPERADOR'] },
  { path: "/extrato", label: "Extrato", icon: Wallet, desc: "Produtividade", roles: ['OPERADOR'] },
];

const formatBRL = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

const Dashboard = () => {
  const [role] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const [users] = useLocalStorage<any[]>('nytzer-users', []);
  const operatorName = user?.username || 'Operador Central';
  const [metas] = useLocalStorage<OperationMeta[]>('nytzer-metas', []);
  const allowedLinks = quickLinks.filter(link => link.roles.includes(role));  
  
  const stats = useMemo(() => {
    let totalDepositado = 0;
    let totalSacado = 0;
    let totalSalarios = 0;
    let totalAutoSalarios = 0;
    let metasFechadas = 0;
    let contasProcessadas = 0;
    let contasNormais = 0;
    let contasBaixas = 0;
    const redesMap: Record<string, { lucro: number, contas: number, metas: number, acertos: number }> = {};
    const chartDataByDate: Record<string, { name: string, contas: number, lucro: number }> = {};

    let metasAtivas = 0;
    let totalMetas = 0;

    for (const meta of metas) {
      if (meta.status === 'lixeira') continue;
      
      let isVisible = false;
      if (role === 'ADMIN') {
        isVisible = meta.operador === operatorName || 
                    (users.find(u => u.username === meta.operador)?.affiliatedTo === operatorName) ||
                    (!meta.operador && operatorName === 'wiseman');
      } else {
        isVisible = meta.operador === operatorName;
      }
      
      if (!isVisible) continue;
      totalMetas++;
      const isFechada = meta.status === 'fechada';
      if (isFechada) metasFechadas++;
      else metasAtivas++;
      
      const remessas = meta.remessas || [];
      let metaLucro = 0;
      let metaContas = 0;
      let autoSalarioMeta = 0;
      remessas.forEach(r => {
        const dep = Number(r.deposito || 0);
        const saq = Number(r.saque || 0);
        const normais = (r as any).contasNormais || 0;
        const baixas = (r as any).contasBaixas || 0;

        if (!meta.isAdminMeta && isFechada) {
          if (meta.modelo !== 'Recarga') {
            contasNormais += normais;
            contasBaixas += baixas;
            autoSalarioMeta += (normais * 2) + (baixas * 1);
          }
        }
        if (isFechada) {
          totalDepositado += dep;
          totalSacado += saq;
          contasProcessadas += Number(r.contas || 0);
        }
        metaLucro += (saq - dep);
        metaContas += Number(r.contas || 0);
      });
      
      const sal = Number(meta.salarioOperador) || 0;
      const pagOp = Number(meta.pagamentoOperador) || 0;
      if (isFechada) {
        totalSalarios += sal;
        if (!meta.isAdminMeta && meta.modelo === 'Recarga') {
          autoSalarioMeta += pagOp;
        }
      }
      totalAutoSalarios += autoSalarioMeta;

      if (isFechada) {
        const d = new Date(meta.createdAt);
        const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!chartDataByDate[dateStr]) chartDataByDate[dateStr] = { name: dateStr, contas: 0, lucro: 0, lucroOperador: 0 };
        chartDataByDate[dateStr].contas += metaContas;
        chartDataByDate[dateStr].lucro += (metaLucro + sal - autoSalarioMeta);
        if (!meta.isAdminMeta) {
          chartDataByDate[dateStr].lucroOperador += autoSalarioMeta;
        }
      }

      // Track by Network (Rede)
      if (isFechada && meta.rede && meta.rede !== 'Selecione') {
        if (!redesMap[meta.rede]) redesMap[meta.rede] = { lucro: 0, contas: 0, metas: 0, acertos: 0 };
        redesMap[meta.rede].lucro += (metaLucro + sal - autoSalarioMeta);
        redesMap[meta.rede].contas += metaContas;
        redesMap[meta.rede].metas += 1;
        if (metaLucro + sal > 0) redesMap[meta.rede].acertos += 1;
      }
    }

    const lucroBruto = totalSacado - totalDepositado;
    const receitaMensal = lucroBruto + totalSalarios - totalAutoSalarios;
    const medioporMeta = metasFechadas > 0 ? receitaMensal / metasFechadas : 0;
    const medioporConta = contasProcessadas > 0 ? receitaMensal / contasProcessadas : 0;

    const rankingRedes = Object.entries(redesMap)
      .map(([nome, d]) => ({ 
        title: nome, 
        subtitle: `${d.metas} metas · ${d.contas} contas`,
        desc: `R$ ${(d.lucro / (d.contas || 1)).toFixed(2)}/cta · ${Math.round((d.acertos/d.metas)*100)}% acerto`,
        val: `${d.lucro >= 0 ? '+' : ''}${formatBRL(d.lucro)}`,
        lucroRaw: d.lucro
      }))
      .sort((a, b) => b.lucroRaw - a.lucroRaw)
      .slice(0, 4);

    let chartData = Object.values(chartDataByDate).sort((a, b) => {
      const [da, ma] = a.name.split('/');
      const [db, mb] = b.name.split('/');
      return new Date(2026, Number(ma)-1, Number(da)).getTime() - new Date(2026, Number(mb)-1, Number(db)).getTime();
    }).slice(-7);

    if (chartData.length === 0) {
      chartData = [{ name: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), contas: 0, lucro: 0, lucroOperador: 0 }];
    }

    return {
      totalDepositado,
      totalSacado,
      lucroBruto,
      totalSalarios,
      totalAutoSalarios,
      receitaMensal,
      metasFechadas,
      metasAtivas,
      totalMetas,
      contasProcessadas,
      contasNormais,
      contasBaixas,
      medioporMeta,
      medioporConta,
      rankingRedes,
      chartData
    };
  }, [metas, role, operatorName]);

  // Dynamic Chart Data
  const barData = stats.chartData;

  const pieData = [
    { name: "Fechado", value: stats.metasFechadas },
    { name: "Em Andamento", value: stats.metasAtivas },
  ].filter(d => d.value > 0);
  
  if (pieData.length === 0) pieData.push({ name: "Sem Dados", value: 1 });

  if (role === 'OPERADOR') {
    return (
      <div className="space-y-6 relative z-10 pb-20 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Meu Painel</h1>
            <p className="text-sm text-primary/70 mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
              Sincronizado via Metas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Saldo Total" value={formatBRL(stats.totalAutoSalarios)} change={`${stats.contasProcessadas} contas operadas`} changeType="positive" icon={DollarSign} color="success" tooltip="O valor total a receber (salário + comissões) baseado na sua produção validada." />
          <KPICard title="Metas Fechadas" value={`${stats.metasFechadas}/${stats.totalMetas}`} change="Registradas" changeType="positive" icon={Target} color="primary" tooltip="Quantidade de metas concluídas em relação ao total atribuído a você." />
          <KPICard title="Contas (NORMAL)" value={stats.contasNormais} change="R$ 2,00 por conta" changeType="neutral" icon={Activity} color="primary" tooltip="Volume de contas normais validadas (R$ 2,00 por unidade)." />
          <KPICard title="Contas (BAIXO)" value={stats.contasBaixas} change="R$ 1,00 por conta" changeType="neutral" icon={Users} color="warning" tooltip="Volume de contas com depósito baixo validadas (R$ 1,00 por unidade)." />
        </div>

        {/* Proporção Operacional - Simple Chart for Operator */}
        <div className="glass-card rounded-2xl p-6 border-primary/10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="w-full md:w-1/2">
            <h3 className="text-xl font-bold text-foreground mb-2">Desempenho Geral</h3>
            <p className="text-sm text-muted-foreground mb-6">Acompanhamento das suas metas finalizadas e pendentes.</p>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-border/30 pb-3">
                <span className="text-sm font-medium text-muted-foreground">Ganhos Acumulados</span>
                <span className="font-bold text-emerald-400 tracking-tight text-2xl">{formatBRL(stats.totalAutoSalarios)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-border/30 pb-3">
                <span className="text-sm font-medium text-muted-foreground">Total de Contas</span>
                <span className="font-bold text-foreground tracking-tight text-xl">{stats.contasProcessadas}</span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
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
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-foreground font-medium">
                  <div className="w-3 h-3 rounded-md" style={{ background: pieColors[i] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Evolução do Faturamento - Operator */}
        <div className="glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden group mt-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-all duration-700" />
          <h3 className="text-base font-bold text-foreground mb-1">Evolução do Faturamento</h3>
          <p className="text-xs text-muted-foreground mb-6">Métricas fiéis ligadas ao seu processamento.</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLucroOp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background/95 backdrop-blur-md border border-primary/20 p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                        <p className="text-foreground font-bold mb-2">{label}</p>
                        <p className="text-sm font-medium text-muted-foreground">Contas criadas: <span className="text-foreground font-bold">{payload[0].payload.contas}</span></p>
                        <p className="text-sm font-medium text-primary mt-1">Lucro contabilizado: <span className="font-extrabold">{formatBRL(payload[0].payload.lucroOperador)}</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="lucroOperador" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorLucroOp)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-bold text-foreground mb-4 tracking-wide uppercase">Comandos Rápidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {allowedLinks.map(({ path, label, icon: Icon, desc }) => (
              <Link key={path} to={path} className="flex items-center gap-4 p-4 rounded-[12px] border border-border/30 bg-background/40 hover:bg-muted/20 transition-all group shadow-sm">
                <div className="w-10 h-10 rounded-md shrink-0 bg-primary/5 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-bold text-foreground/90">{label}</p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="space-y-6 relative z-10 pb-20 md:pb-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard Geral</h1>
        <p className="text-sm text-primary/70 mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
          Sincronizado via Metas
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Receita Mês Líquida" value={formatBRL(stats.receitaMensal)} change={`+ ${formatBRL(stats.totalSalarios)} FAT`} changeType="positive" icon={DollarSign} color="success" tooltip="Lucro bruto somado ao faturamento (salários) de toda a operação." />
      <KPICard title="Metas Fechadas" value={`${stats.metasFechadas}/${stats.totalMetas}`} change="Registradas" changeType="positive" icon={Target} color="primary" tooltip="Metas concluídas com sucesso do total criado." />
      <KPICard title="Metas Ativas" value={stats.metasAtivas} change="Painel de controle" changeType="neutral" icon={Activity} color="warning" tooltip="Metas atualmente em andamento aguardando o fechamento dos operadores." />
      <KPICard title="Contas Operadas" value={stats.contasProcessadas} change="Volume total" changeType="neutral" icon={Users} color="primary" tooltip="O volume total de contas produzidas em toda a operação." />
    </div>

    {/* Modernized Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      <div className="lg:col-span-2 glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-all duration-700" />
        <h3 className="text-base font-bold text-foreground mb-1">Evolução do Faturamento</h3>
        <p className="text-xs text-muted-foreground mb-6">Métricas fiéis ligadas ao seu processamento.</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background/95 backdrop-blur-md border border-primary/20 p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                      <p className="text-foreground font-bold mb-2">{label}</p>
                      <p className="text-sm font-medium text-muted-foreground">Contas criadas: <span className="text-foreground font-bold">{payload[0].payload.contas}</span></p>
                      <p className="text-sm font-medium text-primary mt-1">Lucro contabilizado: <span className="font-extrabold">{formatBRL(payload[0].payload.lucro)}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorLucro)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-2xl p-6 border-primary/10 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
        <div className="w-full">
          <h3 className="text-base font-bold text-foreground mb-1">Proporção Operacional</h3>
          <p className="text-xs text-muted-foreground mb-4">Volume vs Status Real.</p>
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
              {d.name}
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
               <span className="text-sm font-medium text-muted-foreground">Volume Depositado</span>
               <span className="font-bold text-foreground tracking-tight">{formatBRL(stats.totalDepositado)}</span>
             </div>
             <div className="w-full bg-emerald-950/30 rounded-full h-2.5 overflow-hidden">
               <div className="bg-emerald-400 h-full rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000" style={{ width: stats.totalDepositado ? '100%' : '5%' }} />
             </div>
           </div>

           <div>
             <div className="flex justify-between items-end mb-2">
               <span className="text-sm font-medium text-muted-foreground">Volume Sacado</span>
               <span className="font-bold text-foreground tracking-tight">{formatBRL(stats.totalSacado)}</span>
             </div>
             <div className="w-full bg-primary/10 rounded-full h-2.5 overflow-hidden">
               <div className="bg-primary h-full rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.5)] transition-all duration-1000" style={{ width: stats.totalSacado > stats.totalDepositado ? '100%' : (stats.totalSacado ? '50%' : '5%') }} />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-border/20">
             <div className="flex flex-col gap-1">
               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Lucro Bruto</span>
               <span className={`text-2xl font-black drop-shadow-md ${stats.lucroBruto >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>{formatBRL(stats.lucroBruto)}</span>
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">SALÁRIO (FAT)</span>
               <span className="text-2xl font-black text-emerald-400 drop-shadow-md">+ {formatBRL(stats.totalSalarios)}</span>
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
            <span className="text-sm font-bold text-emerald-400">{formatBRL(stats.medioporMeta)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Lucro medio/conta</span>
            <span className="text-sm font-bold text-emerald-400">{formatBRL(stats.medioporConta)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/40 pt-5 mt-3">
            <span className="text-sm font-medium text-muted-foreground">Proximas 50 contas (estimativa)</span>
            <span className="text-base font-extrabold text-emerald-400">+{formatBRL(stats.medioporConta * 50)}</span>
          </div>
        </div>
      </div>

      {/* Col 3: Redes Mais Lucrativas */}
      <div className="glass-card rounded-2xl p-6 border-primary/10 overflow-y-auto max-h-[400px] hide-scrollbar">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.1em] mb-6">Redes Mais Lucrativas</h3>
        <div className="space-y-5">
           {stats.rankingRedes.length === 0 ? (
             <p className="text-xs text-muted-foreground text-center py-10">Inicie operações para ver o ranking.</p>
           ) : stats.rankingRedes.map((net, i) => (
             <div key={i} className="flex items-center justify-between border-b border-border/20 pb-4 last:border-0 last:pb-0">
               <div className="flex items-center gap-4">
                 <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-black text-primary text-xs shadow-inner">
                   {net.title}
                 </div>
                 <div>
                    <p className="font-extrabold text-foreground text-[13px] tracking-tight">{net.subtitle}</p>
                    <p className="text-[10px] font-medium text-muted-foreground mt-1">{net.desc}</p>
                 </div>
               </div>
               <span className={`font-bold text-sm tracking-tight ${net.lucroRaw >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>{net.val}</span>
             </div>
           ))}
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-bold text-foreground mb-4 tracking-wide uppercase">Comandos Rápidos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {allowedLinks.map(({ path, label, icon: Icon, desc }) => (
          <Link key={path} to={path} className="flex items-center gap-4 p-4 rounded-[12px] border border-border/30 bg-background/40 hover:bg-muted/20 transition-all group shadow-sm">
            <div className="w-10 h-10 rounded-md shrink-0 bg-primary/5 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-foreground/90">{label}</p>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
  );
};

export default Dashboard;

