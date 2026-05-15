import { KPICard } from "@/components/dashboard/KPICard";
import { DollarSign, Target, Activity, Users, CalendarDays, ListTodo, ShieldCheck, Wrench, BarChart3, Globe, ChartNoAxesCombined, CreditCard, PlayCircle, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useFirestoreData } from "../hooks/useFirestoreData";
import { OperationMeta } from "./Tasks";
import { useMemo, useState } from "react";
import { PeriodFilter, DateFilter, buildDateFilter, isInRange } from "@/components/ui/period-filter";
import { startOfMonth, endOfMonth } from 'date-fns';

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
  const { metas, users, costs } = useFirestoreData();
  const operatorName = user?.username || 'Operador Central';
  const allowedLinks = quickLinks.filter(link => link.roles.includes(role));  

  // Period filter — default: current month
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    buildDateFilter('MES')
  );
  
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
    const chartDataByDate: Record<string, { name: string, contas: number, lucro: number, lucroOperador: number }> = {};

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
      const sal = Number(meta.salarioOperador) || 0;
      const pagOp = Number(meta.pagamentoOperador) || 0;

      remessas.forEach(r => {
        const dep = Number(r.deposito || 0);
        const saq = Number(r.saque || 0);
        const normais = (r as any).contasNormais || 0;
        const baixas = (r as any).contasBaixas || 0;
        const remessaDate = new Date(r.data || meta.createdAt);
        const inPeriod = isInRange(remessaDate, dateFilter);

        if (!meta.isAdminMeta && isFechada) {
          if (meta.modelo !== 'Recarga') {
            contasNormais += normais;
            contasBaixas += baixas;
            autoSalarioMeta += (normais * 2) + (baixas * 1);
          }
        }
        if (isFechada && inPeriod) {
          totalDepositado += dep;
          totalSacado += saq;
          contasProcessadas += Number(r.contas || 0);
        }
        metaLucro += (saq - dep);
        metaContas += Number(r.contas || 0);
      });
      
      if (isFechada) {
        totalSalarios += sal;
        if (!meta.isAdminMeta && meta.modelo === 'Recarga') {
          autoSalarioMeta += pagOp;
        }
      }
      totalAutoSalarios += autoSalarioMeta;

      if (isFechada) {
        const metaLucroLiquido = metaLucro + sal - autoSalarioMeta;
        const metaLucroOperador = !meta.isAdminMeta ? autoSalarioMeta : 0;
        
        if (metaContas === 0 || remessas.length === 0) {
          let lastDate = new Date(meta.createdAt);
          remessas.forEach(r => {
            const rd = new Date(r.data || meta.createdAt);
            if (rd > lastDate) lastDate = rd;
          });
          const dateStr = lastDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          if (!chartDataByDate[dateStr]) chartDataByDate[dateStr] = { name: dateStr, contas: 0, lucro: 0, lucroOperador: 0 };
          chartDataByDate[dateStr].lucro += metaLucroLiquido;
          chartDataByDate[dateStr].lucroOperador += metaLucroOperador;
        } else {
          const profitPerConta = metaLucroLiquido / metaContas;
          const opProfitPerConta = metaLucroOperador / metaContas;

          remessas.forEach(r => {
             const rc = Number(r.contas || 0);
             if (rc > 0) {
                const rd = new Date(r.data || meta.createdAt);
                const dateStr = rd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                if (!chartDataByDate[dateStr]) chartDataByDate[dateStr] = { name: dateStr, contas: 0, lucro: 0, lucroOperador: 0 };
                
                chartDataByDate[dateStr].contas += rc;
                chartDataByDate[dateStr].lucro += (rc * profitPerConta);
                chartDataByDate[dateStr].lucroOperador += (rc * opProfitPerConta);
             }
          });
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

    let totalCustos = 0;
    for (const cost of costs) {
       totalCustos += Number(cost.amount || 0);
    }

    const lucroBruto = totalSacado - totalDepositado;
    const lucroOperacional = lucroBruto + totalSalarios - totalAutoSalarios;
    const receitaMensal = lucroOperacional - totalCustos;
    const medioporMeta = metasFechadas > 0 ? lucroOperacional / metasFechadas : 0;
    const medioporConta = contasProcessadas > 0 ? lucroOperacional / contasProcessadas : 0;
    const roundedMedioPorConta = Math.round(medioporConta * 100) / 100;

    const rankingRedes = Object.entries(redesMap)
      .map(([nome, d]) => {
        const profitPerConta = d.contas > 0 ? d.lucro / d.contas : 0;
        let winRate = profitPerConta > 0 ? (profitPerConta / 10) * 100 : 0;
        if (winRate > 200) winRate = 200;
        
        return { 
          title: nome, 
          subtitle: `${d.metas} metas · ${d.contas} contas`,
          desc: `R$ ${(profitPerConta).toFixed(2)}/cta · ${Math.round(winRate)}% acerto`,
          val: `${d.lucro >= 0 ? '+' : ''}${formatBRL(d.lucro)}`,
          lucroRaw: d.lucro
        };
      })
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
      totalCustos,
      receitaMensal,
      metasFechadas,
      metasAtivas,
      totalMetas,
      contasProcessadas,
      contasNormais,
      contasBaixas,
      medioporMeta,
      medioporConta,
      roundedMedioPorConta,
      rankingRedes,
      chartData
    };
  }, [metas, costs, role, operatorName, dateFilter]);

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
          <KPICard title="Contas (NORMAL)" value={String(stats.contasNormais)} change="R$ 2,00 por conta" changeType="neutral" icon={Activity} color="primary" tooltip="Volume de contas normais validadas (R$ 2,00 por unidade)." />
          <KPICard title="Contas (BAIXO)" value={String(stats.contasBaixas)} change="R$ 1,00 por conta" changeType="neutral" icon={Users} color="warning" tooltip="Volume de contas com depósito baixo validadas (R$ 1,00 por unidade)." />
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
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground capitalize">Olá, {(user?.fullName || user?.name || user?.username || 'Operador').split(' ')[0]}</h1>
        <p className="text-sm text-primary/70 mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
          SINCRONIZADO VIA PLANILHAS
        </p>
      </div>
    </div>

    {/* Period filter - above KPIs */}
    <PeriodFilter value={dateFilter} onChange={setDateFilter} />

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Receita Líquida" value={formatBRL(stats.receitaMensal)} change={`+ ${formatBRL(stats.totalSalarios)} FAT`} changeType="positive" icon={DollarSign} color="success" tooltip="Lucro bruto somado ao faturamento (salários) de toda a operação." />
      <KPICard title="Metas Fechadas" value={`${stats.metasFechadas}/${stats.totalMetas}`} change="Registradas" changeType="positive" icon={Target} color="primary" tooltip="Metas concluídas com sucesso do total criado." />
      <KPICard title="Metas Ativas" value={String(stats.metasAtivas)} change="Painel de controle" changeType="neutral" icon={Activity} color="warning" tooltip="Metas atualmente em andamento aguardando o fechamento dos operadores." />
      <KPICard title="Contas Operadas" value={String(stats.contasProcessadas)} change="Volume total" changeType="neutral" icon={Users} color="primary" tooltip="O volume total de contas produzidas em toda a operação." />
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
      {/* Col 1: Fluxo */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 flex flex-col justify-between">
        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-5">Fluxo (Entradas vs Saídas)</h3>

        <div className="space-y-5">
           <div>
             <div className="flex justify-between items-end mb-2">
               <span className="text-sm text-muted-foreground">Volume Depositado</span>
               <span className="text-sm font-semibold text-foreground tabular-nums">{formatBRL(stats.totalDepositado)}</span>
             </div>
             <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
               <div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700" style={{ width: stats.totalDepositado ? '100%' : '5%' }} />
             </div>
           </div>

           <div>
             <div className="flex justify-between items-end mb-2">
               <span className="text-sm text-muted-foreground">Volume Sacado</span>
               <span className="text-sm font-semibold text-foreground tabular-nums">{formatBRL(stats.totalSacado)}</span>
             </div>
             <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
               <div className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary/90 transition-all duration-700" style={{ width: stats.totalSacado > stats.totalDepositado ? '100%' : (stats.totalSacado ? '50%' : '5%') }} />
             </div>
           </div>

           <div className="grid grid-cols-3 gap-3 pt-4 mt-1 border-t border-border/60">
             <div className="flex flex-col gap-1">
               <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Lucro Bruto</span>
               <span className={`text-base font-bold tabular-nums ${stats.lucroBruto >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatBRL(stats.lucroBruto)}</span>
             </div>
             <div className="flex flex-col gap-1 border-l border-border/60 pl-3">
               <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Faturamento</span>
               <span className="text-base font-bold text-primary tabular-nums">+{formatBRL(stats.totalSalarios)}</span>
             </div>
             <div className="flex flex-col gap-1 border-l border-border/60 pl-3">
               <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Custos op.</span>
               <span className="text-base font-bold text-destructive tabular-nums">-{formatBRL(stats.totalCustos)}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Col 2: Previsão Inteligente */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-5">Previsão Inteligente</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Lucro médio/meta</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">{formatBRL(stats.medioporMeta)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Lucro médio/conta</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">{formatBRL(stats.medioporConta)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-2">
            <span className="text-sm text-muted-foreground">Próximas 50 contas (estimativa)</span>
            <span className="text-base font-bold text-primary tabular-nums">+{formatBRL(stats.roundedMedioPorConta * 50)}</span>
          </div>
        </div>
      </div>

      {/* Col 3: Redes Mais Lucrativas */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 overflow-y-auto max-h-[400px] hide-scrollbar">
        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-5">Redes Mais Lucrativas</h3>
        <div className="divide-y divide-border/60">
           {stats.rankingRedes.length === 0 ? (
             <p className="text-xs text-muted-foreground text-center py-10">Inicie operações para ver o ranking.</p>
           ) : stats.rankingRedes.map((net, i) => (
             <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center font-bold text-foreground/80 text-[11px]">
                   {net.title}
                 </div>
                 <div>
                    <p className="font-semibold text-foreground text-sm tracking-tight">{net.subtitle}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{net.desc}</p>
                 </div>
               </div>
               <span className={`font-semibold text-sm tabular-nums ${net.lucroRaw >= 0 ? 'text-primary' : 'text-destructive'}`}>{net.val}</span>
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

