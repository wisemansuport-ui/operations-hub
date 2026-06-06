import { KPICard } from "@/components/dashboard/KPICard";
import { HeroPanel } from "@/components/dashboard/HeroPanel";
import { DecisionEngine, Insight } from "@/components/dashboard/DecisionEngine";
import { DollarSign, Target, Activity, Users, CalendarDays, ListTodo, ShieldCheck, Wrench, BarChart3, Globe, ChartNoAxesCombined, CreditCard, PlayCircle, Wallet, UserCog, Receipt, Wallet2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useFirestoreData } from "../hooks/useFirestoreData";
import { OperationMeta } from "./Tasks";
import { useMemo, useState } from "react";
import { PeriodFilter, DateFilter, buildDateFilter, isInRange } from "@/components/ui/period-filter";
import { startOfMonth, endOfMonth } from 'date-fns';
import { LoadingScreen } from "@/components/LoadingScreen";
import { DataGate } from "@/components/layout/DataGate";

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
  { path: "/operators", label: "Operadores", icon: Users, desc: "Gestão de equipe", roles: ['ADMIN'] },
  { path: "/tasks", label: "Planilhas", icon: ChartNoAxesCombined, desc: "Cronograma", roles: ['ADMIN', 'OPERADOR'] },
  { path: "/networks", label: "Redes", icon: Globe, desc: "Plataformas ativas", roles: ['ADMIN'] },
  { path: "/costs", label: "Custos", icon: Receipt, desc: "Operacional", roles: ['ADMIN', 'OPERADOR'] },
  { path: "/me", label: "Extrato", icon: Wallet, desc: "Produtividade", roles: ['OPERADOR'] },
];

const formatBRL = (val: number) => `R$ ${Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatBRLSigned = (val: number) => `${val < 0 ? '-' : '+'}R$ ${Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DashboardSkeleton = ({ role }: { role: 'ADMIN' | 'OPERADOR' }) => {
  return (
    <div className="space-y-6 relative z-10 pb-20 md:pb-6 animate-pulse">
      {/* Title */}
      <div>
        <div className="h-9 w-48 bg-muted/40 rounded-lg" />
        <div className="h-4 w-64 bg-muted/20 rounded mt-2" />
      </div>

      {/* Period Filter Placeholder */}
      {role === 'ADMIN' && (
        <div className="h-10 w-full sm:w-80 bg-muted/30 rounded-xl" />
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 border-primary/5 flex flex-col gap-3 min-h-[120px]">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-muted/30 rounded" />
              <div className="w-8 h-8 rounded-lg bg-muted/30" />
            </div>
            <div className="h-8 w-32 bg-muted/40 rounded-lg mt-1" />
            <div className="h-3 w-40 bg-muted/20 rounded" />
          </div>
        ))}
      </div>

      {role === 'OPERADOR' ? (
        <>
          {/* Operador Layout */}
          <div className="glass-card rounded-2xl p-6 border-primary/5 flex flex-col md:flex-row items-center justify-between gap-6 min-h-[220px]">
            <div className="w-full md:w-1/2 space-y-4">
              <div className="h-6 w-36 bg-muted/40 rounded" />
              <div className="h-4 w-56 bg-muted/25 rounded" />
              <div className="h-4 w-full bg-muted/20 rounded mt-4" />
              <div className="h-4 w-full bg-muted/20 rounded" />
            </div>
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="w-36 h-36 rounded-full border-[10px] border-muted/10 flex items-center justify-center" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border-primary/5 min-h-[280px]">
            <div className="h-5 w-40 bg-muted/40 rounded mb-2" />
            <div className="h-3 w-56 bg-muted/20 rounded mb-6" />
            <div className="h-48 w-full bg-muted/10 rounded-lg" />
          </div>
        </>
      ) : (
        <>
          {/* Admin Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 border-primary/5 min-h-[350px]">
              <div className="h-5 w-40 bg-muted/40 rounded mb-2" />
              <div className="h-3 w-56 bg-muted/20 rounded mb-6" />
              <div className="h-48 w-full bg-muted/10 rounded-lg" />
            </div>
            <div className="glass-card rounded-2xl p-6 border-primary/5 flex flex-col items-center justify-center min-h-[350px] gap-6">
              <div className="w-full">
                <div className="h-5 w-36 bg-muted/40 rounded mb-2" />
                <div className="h-3 w-28 bg-muted/20 rounded" />
              </div>
              <div className="w-40 h-40 rounded-full border-[10px] border-muted/10 flex items-center justify-center" />
              <div className="flex gap-4">
                <div className="h-4 w-16 bg-muted/30 rounded" />
                <div className="h-4 w-16 bg-muted/30 rounded" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/40 p-5 min-h-[220px] flex flex-col gap-4">
                <div className="h-4 w-32 bg-muted/40 rounded mb-2" />
                <div className="space-y-3 mt-2">
                  <div className="h-4 w-full bg-muted/20 rounded" />
                  <div className="h-4 w-full bg-muted/20 rounded" />
                  <div className="h-4 w-full bg-muted/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Comandos Rápidos */}
      <div>
        <div className="h-5 w-40 bg-muted/40 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-background/20">
              <div className="w-10 h-10 rounded-lg bg-muted/20 shrink-0" />
              <div className="space-y-2 w-full">
                <div className="h-4 w-20 bg-muted/30 rounded" />
                <div className="h-3 w-28 bg-muted/20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [role] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const { metas, users, costs, loading } = useFirestoreData();
  const operatorName = user?.username || 'Operador Central';
  const allowedLinks = quickLinks.filter(link => link.roles.includes(role));

  // Period filter — default: current month (must be before any early return)
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    buildDateFilter('MES')
  );
  const [activeTab, setActiveTab] = useState<'financeira' | 'inteligencia'>('financeira');

  const stats = useMemo(() => {
    let totalDepositado = 0;
    let totalSacado = 0;
    let totalSalarios = 0;
    let totalAutoSalarios = 0;
    let metasFechadas = 0;
    let metasFechadasInPeriod = 0;
    let metasAtivasInPeriod = 0;
    let contasProcessadas = 0;
    let contasNormais = 0;
    let contasBaixas = 0;
    const redesMap: Record<string, { lucro: number, contas: number, metas: number, acertos: number }> = {};
    const chartDataByDate: Record<string, { name: string, contas: number, lucro: number, lucroOperador: number }> = {};

    let metasAtivas = 0;
    let totalMetas = 0;


    // ----- SINGLE SOURCE OF TRUTH -----
    // For every fechada meta: calculate totals from ALL remessas (for chart),
    // but only accumulate KPI values for remessas whose date falls in dateFilter.
    // Salary and autoSalario are split proportionally across remessas by conta count.

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
      const sal = Number(meta.salarioOperador) || 0;
      const pagOp = Number(meta.pagamentoOperador) || 0;

      // Total contas in the meta (used for proportional autoSalario/FAT split)
      const totalContasMeta = remessas.reduce((acc, r) => acc + Number(r.contas || 0), 0);

      let metaTotalDep = 0, metaTotalSaq = 0, metaTotalAutoSal = 0;
      // Per-meta accumulators restricted to dateFilter — used for ranking de redes
      let metaInPeriodDep = 0, metaInPeriodSaq = 0, metaInPeriodAutoSal = 0, metaInPeriodSal = 0, metaInPeriodContas = 0;
      let metaHasRemessaInPeriod = false;

      remessas.forEach(r => {
        const dep = Number(r.deposito || 0);
        const saq = Number(r.saque || 0);
        let rc = Number(r.contas || 0);
        let normais = Number((r as any).contasNormais || 0);
        let baixas = Number((r as any).contasBaixas || 0);

        const originalRc = rc;
        if (meta.modelo === 'Recarga') {
          rc = 0;
          normais = 0;
          baixas = 0;
        }
        if ((r as any).naoContabilizarSalario) {
          normais = 0;
          baixas = 0;
        }

        metaTotalDep += dep;
        metaTotalSaq += saq;

        // Proporção dessa remessa para dividir o FAT e o autoSalario
        const prop = totalContasMeta > 0 ? originalRc / totalContasMeta : (remessas.length > 0 ? 1 / remessas.length : 1);
        
        // FAT distribuído proporcionalmente para a remessa
        const remSal = sal * prop;

        // autoSalario is still per-remessa (based on conta counts)
        let remAutoSal = 0;
        if (!meta.isAdminMeta && !(r as any).naoContabilizarSalario) {
          if (meta.modelo === 'Recarga') {
            remAutoSal = pagOp * prop;
          } else {
            remAutoSal = (normais * 2) + (baixas * 1);
          }
        }
        metaTotalAutoSal += remAutoSal;

        const remessaDate = new Date(r.data || meta.createdAt);
        const inPeriod = isInRange(remessaDate, dateFilter);
        const dateStr = remessaDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        if (isFechada && inPeriod) {
          totalDepositado += dep;
          totalSacado += saq;
          totalSalarios += remSal; // FAT rateado
          totalAutoSalarios += remAutoSal;
          contasProcessadas += rc;
          if (!meta.isAdminMeta && meta.modelo !== 'Recarga') {
            contasNormais += normais;
            contasBaixas += baixas;
          }
          // Rede ranking — acumular apenas o que está no período
          metaHasRemessaInPeriod = true;
          metaInPeriodDep += dep;
          metaInPeriodSaq += saq;
          metaInPeriodSal += remSal;
          metaInPeriodAutoSal += remAutoSal;
          metaInPeriodContas += originalRc;
        }

        // Chart: always add to the chart regardless of dateFilter
        if (isFechada) {
          if (!chartDataByDate[dateStr]) chartDataByDate[dateStr] = { name: dateStr, contas: 0, lucro: 0, lucroOperador: 0 };
          chartDataByDate[dateStr].contas += rc;
          chartDataByDate[dateStr].lucro += (saq - dep) + remSal - remAutoSal; // Aplica o FAT distribuído ao dia exato da remessa
          chartDataByDate[dateStr].lucroOperador += !meta.isAdminMeta ? remAutoSal : 0;
        }
      });

      // Handle metas with 0 contas (no remessas counted) — put full amount on createdAt date
      if (isFechada && totalContasMeta === 0 && remessas.length === 0) {
        const metaDate = new Date(meta.createdAt);
        const dateStr = metaDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!chartDataByDate[dateStr]) chartDataByDate[dateStr] = { name: dateStr, contas: 0, lucro: 0, lucroOperador: 0 };
        const metaAutoSal = !meta.isAdminMeta ? (meta.modelo === 'Recarga' ? pagOp : 0) : 0;
        chartDataByDate[dateStr].lucro += (metaTotalSaq - metaTotalDep) + sal - metaAutoSal;
        chartDataByDate[dateStr].lucroOperador += !meta.isAdminMeta ? metaAutoSal : 0;

        // Para ranking de redes, se a meta (sem remessas) cair dentro do filtro de data, contabilizar
        if (isInRange(metaDate, dateFilter)) {
          metaHasRemessaInPeriod = true;
          metaInPeriodDep += metaTotalDep;
          metaInPeriodSaq += metaTotalSaq;
          metaInPeriodSal += sal;
          metaInPeriodAutoSal += metaAutoSal;
        }
      }

      // Track by Network (Rede) — apenas se houve atividade dentro do período selecionado
      if (isFechada && meta.rede && meta.rede !== 'Selecione' && metaHasRemessaInPeriod) {
        const metaLiquido = (metaInPeriodSaq - metaInPeriodDep) + metaInPeriodSal - metaInPeriodAutoSal;
        if (!redesMap[meta.rede]) redesMap[meta.rede] = { lucro: 0, contas: 0, metas: 0, acertos: 0 };
        redesMap[meta.rede].lucro += metaLiquido;
        redesMap[meta.rede].contas += metaInPeriodContas;
        redesMap[meta.rede].metas += 1;
        if (metaLiquido > 0) redesMap[meta.rede].acertos += 1;
      }

      // Proporção Operacional respeita filtro de data
      if (isFechada && metaHasRemessaInPeriod) metasFechadasInPeriod++;
      if (!isFechada && isInRange(new Date(meta.createdAt), dateFilter)) metasAtivasInPeriod++;
    }


    let totalCustos = 0;
    const costsByDate: Record<string, number> = {};
    for (const cost of costs) {
       let isVisible = false;
       if (role === 'ADMIN') {
         isVisible = cost.operador === operatorName || 
                     (users.find(u => u.username === cost.operador)?.affiliatedTo === operatorName) ||
                     (!cost.operador && operatorName === 'wiseman');
       } else {
         isVisible = cost.operador === operatorName;
       }
       if (!isVisible) continue;

       const costDate = cost.date ? new Date(cost.date + 'T12:00:00') : new Date(cost.createdAt);
       if (isInRange(costDate, dateFilter)) {
         const amt = Number(cost.amount || 0);
         totalCustos += amt;
         const dateStr = costDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
         costsByDate[dateStr] = (costsByDate[dateStr] || 0) + amt;
       }
    }

    // Subtract costs from chart per day so chart bars = KPI contribution
    for (const [dateStr, costAmt] of Object.entries(costsByDate)) {
      if (chartDataByDate[dateStr]) {
        chartDataByDate[dateStr].lucro -= costAmt;
      }
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

    // Chart only shows dates within the selected period — bars sum = KPI Receita Líquida
    let chartData = Object.values(chartDataByDate)
      .filter(d => {
        const [day, month] = d.name.split('/');
        const dt = new Date(2026, Number(month) - 1, Number(day));
        return isInRange(dt, dateFilter);
      })
      .sort((a, b) => {
        const [da, ma] = a.name.split('/');
        const [db, mb] = b.name.split('/');
        return new Date(2026, Number(ma)-1, Number(da)).getTime() - new Date(2026, Number(mb)-1, Number(db)).getTime();
      });

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
      metasFechadasInPeriod,
      metasAtivasInPeriod,
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
    { name: "Fechado", value: stats.metasFechadasInPeriod },
    { name: "Em Andamento", value: stats.metasAtivasInPeriod },
  ].filter(d => d.value > 0);
  
  if (pieData.length === 0) pieData.push({ name: "Sem Dados", value: 1 });

  // ----- Motor de Decisão insights (heuristics from real stats) -----
  const insights: Insight[] = useMemo(() => {
    const arr: Insight[] = [];
    const top = stats.rankingRedes[0];
    const bottom = [...stats.rankingRedes].reverse().find(r => r.lucroRaw < 0);

    if (top && top.lucroRaw > 0) {
      arr.push({
        type: "opportunity",
        title: `Aumente alocação em ${top.title}`,
        description: `É a rede com maior lucro líquido no período. Reforçar capital aqui tende a maximizar retorno.`,
        metric: top.val,
        confidence: Math.min(97, 70 + Math.round((top.lucroRaw / Math.max(stats.receitaMensal, 1)) * 100)),
      });
    }
    if (bottom) {
      arr.push({
        type: "risk",
        title: `Revisar operação em ${bottom.title}`,
        description: `Rede operando no negativo no período. Avaliar pausa, troca de operador ou ajuste de modelo.`,
        metric: bottom.val,
        confidence: 88,
      });
    }
    if (stats.metasAtivas > 0 && stats.medioporMeta > 0) {
      const forecast = stats.medioporMeta * stats.metasAtivas;
      arr.push({
        type: "forecast",
        title: `Previsão das ${stats.metasAtivas} metas ativas`,
        description: `Baseado no lucro médio por meta fechada no período (${formatBRL(stats.medioporMeta)}).`,
        metric: `+${formatBRL(forecast)}`,
        confidence: 76,
      });
    }
    if (stats.totalCustos > 0 && stats.receitaMensal > 0) {
      const ratio = (stats.totalCustos / (stats.receitaMensal + stats.totalCustos)) * 100;
      if (ratio > 35) {
        arr.push({
          type: "recommendation",
          title: "Custos consumindo margem",
          description: `Custos representam ${ratio.toFixed(0)}% do bruto. Considere auditar fornecedores e plataformas.`,
          metric: `-${formatBRL(stats.totalCustos)}`,
          confidence: 82,
        });
      }
    }
    if (stats.contasProcessadas > 0 && stats.medioporConta > 0) {
      arr.push({
        type: "recommendation",
        title: "Foco em volume",
        description: `Cada conta processada gera ${formatBRL(stats.medioporConta)} líquido. Escalar volume mantém ROI estável.`,
        metric: `${stats.contasProcessadas} contas`,
        confidence: 71,
      });
    }
    return arr.slice(0, 6);
  }, [stats]);

  // Standard pattern: gate via <DataGate> in JSX (NEVER early-return on loading
  // before hooks — see src/components/layout/DataGate.tsx for the convention).

  if (role === 'OPERADOR') {
    const esforcoTotal = stats.contasNormais * 2 + stats.contasBaixas * 1;
    const projecaoMes = stats.totalAutoSalarios > 0
      ? stats.totalAutoSalarios * (stats.metasAtivas > 0 ? 1 + (stats.metasAtivas / Math.max(stats.metasFechadas, 1)) * 0.6 : 1.1)
      : stats.totalAutoSalarios;

    // IA motivacional dinâmica
    const motivational: { icon: any; title: string; body: string; tone: 'primary' | 'success' | 'warning' }[] = [];
    if (stats.contasProcessadas > 0) {
      motivational.push({
        icon: Activity,
        title: 'Você está produzindo',
        body: `${stats.contasProcessadas} contas operadas no período. Cada conta soma — mantenha o ritmo.`,
        tone: 'success',
      });
    } else {
      motivational.push({
        icon: Target,
        title: 'Comece o ciclo',
        body: 'Nenhuma conta validada neste período. Abrir a primeira remessa destrava o fluxo do dia.',
        tone: 'warning',
      });
    }
    if (stats.metasAtivas > 0) {
      motivational.push({
        icon: ListTodo,
        title: `${stats.metasAtivas} metas ativas`,
        body: 'Fechar as metas em andamento aumenta seu saldo e libera novas alocações.',
        tone: 'primary',
      });
    }
    if (esforcoTotal > 0) {
      motivational.push({
        icon: DollarSign,
        title: 'Esforço vira renda',
        body: `Seu esforço acumulado é de ${esforcoTotal} pts — disciplina diária é o que constrói grandes saldos.`,
        tone: 'success',
      });
    }

    return (
      <DataGate loading={loading} message="Sincronizando seus dados">
      <div className="space-y-6 md:space-y-8 relative z-10 pb-20 md:pb-6">
        {/* Greeting strip */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              MEU PAINEL · SINCRONIZADO VIA METAS
            </p>
            <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-foreground capitalize">
              Olá, {(user?.fullName || user?.name || user?.username || 'Operador').split(' ')[0]}
              <span className="text-primary">.</span>
            </h1>
          </div>
          <PeriodFilter value={dateFilter} onChange={setDateFilter} />
        </div>

        {/* HERO — Painel do operador */}
        <div data-tour="operator-hero">
        <HeroPanel
          status={{ label: "Operação ao vivo", tone: "live" }}
          primaryLabel="Saldo do período"
          primaryValue={`+${formatBRL(stats.totalAutoSalarios)}`}
          primaryDelta={
            stats.contasProcessadas > 0
              ? { value: `${stats.contasProcessadas} contas operadas · esforço ${esforcoTotal} pts`, positive: true }
              : { value: "Nenhuma conta validada no período", positive: false }
          }
          title="Painel do Operador"
          subtitle="Visão consolidada da sua operação — produção, saldo e projeção."
          forecastLabel="Projeção fim do período"
          forecastValue={`+${formatBRL(projecaoMes)}`}
          aiInsight={
            stats.contasProcessadas > 0
              ? `Você fechou ${stats.metasFechadas}/${stats.totalMetas} metas e gerou ${formatBRL(stats.totalAutoSalarios)} no período. ${stats.metasAtivas > 0 ? `Há ${stats.metasAtivas} metas ativas para destravar.` : 'Tudo finalizado — bom trabalho.'}`
              : "Nenhuma produção registrada ainda no período. Comece a fechar metas para ver seu saldo aqui."
          }
          trendData={barData.map(d => ({ name: d.name, value: d.lucroOperador }))}
          sideStats={[
            { label: "Normais", value: String(stats.contasNormais), tone: "primary" },
            { label: "Baixas", value: String(stats.contasBaixas), tone: "success" },
            { label: "Metas", value: `${stats.metasFechadas}/${stats.totalMetas}`, tone: "primary" },
          ]}
        />
        </div>

        {/* KPIs estratégicos do operador */}
        <div data-tour="operator-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KPICard highlight title="Saldo do Período" value={formatBRL(stats.totalAutoSalarios)} change={`${stats.contasProcessadas} contas operadas`} changeType="positive" icon={DollarSign} color="success" tooltip="Salário + comissões estimadas da sua produção validada." />
          <KPICard title="Metas Fechadas" value={`${stats.metasFechadas}/${stats.totalMetas}`} change={`${stats.metasAtivas} em andamento`} changeType="positive" icon={Target} color="primary" tooltip="Metas concluídas vs total atribuído." />
          <KPICard title="Contas Normais" value={String(stats.contasNormais)} change={`${stats.contasNormais * 2} pts · R$ 2,00/un`} changeType="neutral" icon={Activity} color="primary" tooltip="Volume de contas normais validadas (R$ 2,00 por unidade)." />
          <KPICard title="Contas Baixo" value={String(stats.contasBaixas)} change={`${stats.contasBaixas} pts · R$ 1,00/un`} changeType="neutral" icon={Users} color="warning" tooltip="Volume de contas com depósito baixo (R$ 1,00 por unidade)." />
        </div>


        {/* Gráfico + IA Motivacional */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div data-tour="operator-chart" className="lg:col-span-2 rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Evolução do Faturamento</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Saldo gerado pela sua produção por dia de atividade.</p>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-primary/70">Período</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLucroOp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dx={-6} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background/95 backdrop-blur-md border border-primary/20 p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                          <p className="text-foreground font-bold mb-2">{label}</p>
                          <p className="text-sm font-medium text-muted-foreground">Contas: <span className="text-foreground font-bold">{payload[0].payload.contas}</span></p>
                          <p className="text-sm font-medium text-primary mt-1">Saldo: <span className="font-extrabold">{formatBRL(payload[0].payload.lucroOperador)}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="lucroOperador" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorLucroOp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* IA Motivacional */}
          <div data-tour="operator-ai" className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card/80 to-primary/[0.03] backdrop-blur p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-primary/80">IA Motivacional</p>
                <h3 className="text-sm font-bold text-foreground">Sua leitura do período</h3>
              </div>
            </div>
            {motivational.map((ins, i) => {
              const Icon = ins.icon;
              const toneRing = ins.tone === 'success' ? 'border-success/30 bg-success/5' : ins.tone === 'warning' ? 'border-warning/30 bg-warning/5' : 'border-primary/20 bg-primary/5';
              const toneText = ins.tone === 'success' ? 'text-success' : ins.tone === 'warning' ? 'text-warning' : 'text-primary';
              return (
                <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${toneRing}`}>
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${toneText}`} />
                  <div className="min-w-0">
                    <p className={`text-[11px] font-bold ${toneText} mb-0.5`}>{ins.title}</p>
                    <p className="text-[11px] text-foreground/80 leading-snug">{ins.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comandos rápidos */}
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary/70 mb-3">Comandos Rápidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {allowedLinks.map(({ path, label, icon: Icon, desc }) => (
              <Link key={path} to={path} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur hover:border-primary/40 hover:bg-card/80 transition-all group">
                <div className="w-10 h-10 rounded-lg shrink-0 bg-primary/5 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 group-hover:border-primary/50 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-bold text-foreground/90 truncate">{label}</p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      </DataGate>
    );
  }



  // Hero forecast = previsão fim de período (extrapola média diária)
  const heroForecastValue = stats.medioporMeta > 0
    ? stats.receitaMensal + (stats.medioporMeta * stats.metasAtivas * 0.6)
    : stats.receitaMensal;

  const heroDeltaPct = stats.totalCustos > 0
    ? ((stats.receitaMensal / (stats.receitaMensal + stats.totalCustos)) * 100).toFixed(0)
    : "100";

  return (
  <DataGate loading={loading} message="Sincronizando seus dados">
  <div className="space-y-6 md:space-y-8 relative z-10 pb-20 md:pb-6">
    {/* Greeting strip */}
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary/70 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          ECOSSISTEMA DE ANÁLISE FINANCEIRA · SINCRONIZADO
        </p>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-foreground capitalize">
          Olá, {(user?.fullName || user?.name || user?.username || 'Operador').split(' ')[0]}
          <span className="text-primary">.</span>
        </h1>
      </div>
      <div data-tour="period-filter">
        <PeriodFilter value={dateFilter} onChange={setDateFilter} />
      </div>
    </div>

    {/* Sub-tabs: minimalist underline navigation */}
    <div className="border-b border-border/40">
      <div className="flex items-center gap-1 -mb-px">
        {[
          { id: 'financeira' as const, label: 'Visão Financeira', icon: Wallet2 },
          { id: 'inteligencia' as const, label: 'Inteligência & IA', icon: Brain },
        ].map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold tracking-tight transition-all rounded-t-lg",
                active
                  ? "text-foreground"
                  : "text-muted-foreground/70 hover:text-foreground/90"
              )}
            >
              <Icon className={cn("w-4 h-4 transition-colors", active ? "text-primary" : "text-muted-foreground/60")} />
              {label}
              {active && (
                <span className="absolute left-2 right-2 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.5)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>

    {activeTab === 'financeira' && (
      <div className="space-y-6 md:space-y-8 animate-fade-in">
    {/* LEVEL 1 — Hero Central de Comando */}
    <div data-tour="hero-lucro">
      <HeroPanel
        status={{ label: "Operação ao vivo", tone: "live" }}
        primaryLabel="Receita líquida — período"
        primaryValue={formatBRLSigned(stats.receitaMensal)}
        primaryDelta={
          stats.receitaMensal >= 0
            ? { value: `${heroDeltaPct}% de margem sobre o bruto`, positive: true }
            : { value: "Margem negativa no período", positive: false }
        }
        title="Central de Comando"
        subtitle="Visão consolidada de toda a operação — entradas, custos e projeção."
        forecastLabel="Projeção fim do período"
        forecastValue={formatBRLSigned(heroForecastValue)}
        aiInsight={
          insights[0]
            ? `${insights[0].title}. ${insights[0].description}`
            : "Sem sinais críticos no momento. Operação dentro dos parâmetros."
        }
        trendData={barData.map(d => ({ name: d.name, value: d.lucro }))}
        sideStats={[
          { label: "Bruto", value: formatBRL(stats.lucroBruto), tone: stats.lucroBruto >= 0 ? "primary" : "destructive" },
          { label: "FAT", value: formatBRL(stats.totalSalarios), tone: "success" },
          { label: "Custos", value: formatBRL(stats.totalCustos), tone: "destructive" },
        ]}
      />
    </div>

    {/* LEVEL 2 — Strategic KPIs */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <KPICard highlight title="Metas Fechadas" value={`${stats.metasFechadas}/${stats.totalMetas}`} change="Conversão consolidada" changeType="positive" icon={Target} color="primary" tooltip="Metas concluídas com sucesso do total criado." />
      <KPICard title="Metas Ativas" value={String(stats.metasAtivas)} change="Em andamento" changeType="neutral" icon={Activity} color="warning" tooltip="Metas atualmente em andamento aguardando o fechamento dos operadores." />
      <KPICard title="Contas Operadas" value={String(stats.contasProcessadas)} change="Volume total" changeType="neutral" icon={Users} color="primary" tooltip="O volume total de contas produzidas em toda a operação." />
      <KPICard title="Lucro / Conta" value={formatBRL(stats.medioporConta)} change={`Média sobre ${stats.contasProcessadas}`} changeType={stats.medioporConta >= 0 ? "positive" : "negative"} icon={DollarSign} color="success" tooltip="Lucro líquido médio gerado por cada conta operada no período." />
    </div>


    {/* Evolução do Faturamento (full width, financeira) */}
    <div className="hairline-gold surface-3 rounded-2xl p-4 md:p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-all duration-700" />
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-foreground tracking-tight">Evolução do Faturamento</h3>
        <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">série temporal</span>
      </div>
      <p className="text-xs text-muted-foreground mb-6">Métricas fiéis ligadas ao seu processamento.</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
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
                  <div className="bg-background/95 backdrop-blur-md border border-primary/25 p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                    <p className="text-foreground font-bold mb-2">{label}</p>
                    <p className="text-sm font-medium text-muted-foreground">Contas criadas: <span className="text-foreground font-bold tabular-nums">{payload[0].payload.contas}</span></p>
                    <p className="text-sm font-medium text-primary mt-1">Lucro contabilizado: <span className="font-extrabold tabular-nums">{formatBRL(payload[0].payload.lucro)}</span></p>
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

    {/* Fluxo + Previsão (financeira) */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <div className="hairline-gold surface-2 rounded-2xl p-4 md:p-5 relative overflow-hidden">
        <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-5">Fluxo (Entradas vs Saídas)</h3>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm text-muted-foreground">Faturamento</span>
              <span className="text-sm font-semibold text-success tabular-nums">+{formatBRL(stats.totalSalarios)} FAT</span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-success/70 to-success transition-all duration-700" style={{ width: stats.totalSalarios ? '100%' : '5%' }} />
            </div>
          </div>
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
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Bruto</span>
              <span className={`text-base font-bold tabular-nums ${stats.lucroBruto >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatBRL(stats.lucroBruto)}</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-border/60 pl-3">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">FAT</span>
              <span className="text-base font-bold text-success tabular-nums">+{formatBRL(stats.totalSalarios)}</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-border/60 pl-3">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Custos</span>
              <span className="text-base font-bold text-destructive tabular-nums">-{formatBRL(stats.totalCustos)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hairline-gold surface-2 rounded-2xl p-4 md:p-5 relative overflow-hidden">
        <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-5">Previsão Inteligente</h3>
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
          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <span className="text-sm text-muted-foreground">Projeção fim do período</span>
            <span className="text-base font-bold gradient-gold-text tabular-nums">{formatBRL(heroForecastValue)}</span>
          </div>
        </div>
      </div>
    </div>
      </div>
    )}

    {activeTab === 'inteligencia' && (
      <div className="space-y-6 md:space-y-8 animate-fade-in">
        {/* Motor de Decisão */}
        <div data-tour="decision-engine"><DecisionEngine insights={insights} /></div>

        {/* Proporção + Redes lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="hairline-gold surface-3 rounded-2xl p-4 md:p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-foreground tracking-tight">Proporção Operacional</h3>
                <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">status</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Volume vs status real.</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={5} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card) / 0.95)", border: "1px solid hsl(var(--primary)/0.25)", borderRadius: 12 }} itemStyle={{ color: "hsl(var(--foreground))", fontSize: '14px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-3">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-foreground font-medium">
                  <div className="w-3 h-3 rounded-md" style={{ background: pieColors[i] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>

          <div className="hairline-gold surface-2 rounded-2xl p-4 md:p-5 overflow-y-auto max-h-[460px] hide-scrollbar relative">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-5">Redes Mais Lucrativas</h3>
            <div className="divide-y divide-border/60">
              {stats.rankingRedes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">Inicie operações para ver o ranking.</p>
              ) : stats.rankingRedes.map((net, i) => (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-[11px] shrink-0 transition-colors ${i === 0 ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-secondary border-border text-foreground/80'}`}>
                      {i === 0 ? '★' : i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm tracking-tight truncate">{net.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{net.subtitle} · {net.desc}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm tabular-nums shrink-0 ml-2 ${net.lucroRaw >= 0 ? 'text-primary' : 'text-destructive'}`}>{net.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Quick links */}
    <div>
      <h3 className="text-[10px] font-bold text-muted-foreground mb-4 tracking-[0.18em] uppercase">Comandos Rápidos</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {allowedLinks.map(({ path, label, icon: Icon, desc }) => (
          <Link key={path} to={path} className="surface-1 hover:surface-2 flex items-center gap-3 p-3.5 rounded-xl transition-all group hover:border-primary/40 hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-lg shrink-0 bg-primary/5 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-bold text-foreground/90 truncate">{label}</p>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
  </DataGate>
  );
};

export default Dashboard;


