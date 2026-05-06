import React, { useState, useMemo } from 'react';
import { Wallet, Target, Activity, CheckCircle2, History, Filter, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { DataTable, Column } from "@/components/spreadsheet/DataTable";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useFirestoreData } from "../hooks/useFirestoreData";
import { OperationMeta } from "./Tasks";

const columns: Column[] = [
  { key: "data", label: "Data" },
  { key: "plataforma", label: "Plataforma" },
  { key: "rede", label: "Rede" },
  { key: "contas", label: "Contas Realizadas" },
  { key: "valor", label: "Pagamento (R$)", type: "number" },
  { key: "status", label: "Status" },
];

export default function OperatorExtract() {
  const [timeFilter, setTimeFilter] = useState<'HOJE' | 'SEMANA' | 'MES'>('HOJE');
  const [platformFilter, setPlatformFilter] = useState<string>('TODAS');
  const [networkFilter, setNetworkFilter] = useState<string>('TODAS');
  const { metas } = useFirestoreData();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const operatorName = user?.username || 'Operador Central';

  const { stats, extratoData, chartData, availablePlatforms, availableNetworks } = useMemo(() => {
    const now = new Date();
    const isSameDay = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const isThisWeek = (d: Date) => (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    const isThisMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

    const newStats = {
      HOJE: { normal: 0, depBaixo: 0, salarioManual: 0 },
      SEMANA: { normal: 0, depBaixo: 0, salarioManual: 0 },
      MES: { normal: 0, depBaixo: 0, salarioManual: 0 },
    };

    const extrato: any[] = [];
    const productionByDate: Record<string, { date: string, normal: number, baixas: number }> = {};
    const platforms = new Set<string>();
    const networks = new Set<string>();

    metas.forEach(meta => {
      if (meta.status === 'lixeira' || meta.operador !== operatorName || meta.isAdminMeta) return;
      
      let normais = 0;
      let baixas = 0;
      let lastDate = new Date(meta.createdAt);
      
      const pName = meta.plataforma || 'N/A';
      const rName = meta.rede && meta.rede !== 'Selecione' ? meta.rede : 'N/A';

      platforms.add(pName);
      if (rName !== 'N/A') networks.add(rName);

      // Apply Filters
      const matchPlatform = platformFilter === 'TODAS' || pName === platformFilter;
      const matchNetwork = networkFilter === 'TODAS' || rName === networkFilter;

      if (matchPlatform && matchNetwork) {
        (meta.remessas || []).forEach(r => {
          const d = new Date(r.data || meta.createdAt);
          if (d > lastDate) lastDate = d;

          const rn = r.contasNormais || 0;
          const rb = r.contasBaixas || 0;
          normais += rn;
          baixas += rb;

          if (meta.modelo !== 'Recarga') {
            if (isSameDay(d)) { newStats.HOJE.normal += rn; newStats.HOJE.depBaixo += rb; }
            if (isThisWeek(d)) { newStats.SEMANA.normal += rn; newStats.SEMANA.depBaixo += rb; }
            if (isThisMonth(d)) { newStats.MES.normal += rn; newStats.MES.depBaixo += rb; }
          }
        });

        const totalContas = normais + baixas;
        let pagamentoTotal = 0;
        const manualSalario = Number(meta.pagamentoOperador) || 0;

        if (meta.modelo === 'Recarga') {
          pagamentoTotal = manualSalario;
        } else {
          pagamentoTotal = (normais * 2) + (baixas * 1) + manualSalario;
        }

        if (manualSalario > 0) {
          if (isSameDay(lastDate)) newStats.HOJE.salarioManual += manualSalario;
          if (isThisWeek(lastDate)) newStats.SEMANA.salarioManual += manualSalario;
          if (isThisMonth(lastDate)) newStats.MES.salarioManual += manualSalario;
        }

        extrato.push({
          id: meta.id,
          data: lastDate.toLocaleDateString(),
          plataforma: pName,
          rede: rName,
          contas: totalContas.toString(),
          valor: pagamentoTotal.toFixed(2),
          status: meta.status === 'fechada' ? 'Finalizada' : 'Em Andamento',
          timestamp: lastDate.getTime()
        });
        
        // Group for chart (by day)
        const dateStr = lastDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!productionByDate[dateStr]) productionByDate[dateStr] = { date: dateStr, normal: 0, baixas: 0 };
        productionByDate[dateStr].normal += normais;
        productionByDate[dateStr].baixas += baixas;
      }
    });

    extrato.sort((a, b) => b.timestamp - a.timestamp);
    
    // Sort chart data by date
    const cData = Object.values(productionByDate).sort((a, b) => {
      const [da, ma] = a.date.split('/');
      const [db, mb] = b.date.split('/');
      return new Date(2026, Number(ma)-1, Number(da)).getTime() - new Date(2026, Number(mb)-1, Number(db)).getTime();
    }).slice(-7); // Last 7 days

    return { 
      stats: newStats, 
      extratoData: extrato,
      chartData: cData,
      availablePlatforms: Array.from(platforms).sort(),
      availableNetworks: Array.from(networks).sort()
    };
  }, [metas, operatorName, platformFilter, networkFilter]);

  const currentStats = stats[timeFilter];
  const lucroTotal = (currentStats.normal * 2) + (currentStats.depBaixo * 1) + (currentStats.salarioManual || 0);

  const exportToCSV = () => {
    if (extratoData.length === 0) return;
    const headers = ["Data", "Plataforma", "Rede", "Contas Realizadas", "Pagamento (R$)", "Status"];
    const rows = extratoData.map(e => [e.data, e.plataforma, e.rede || 'N/A', e.contas, e.valor.replace('.', ','), e.status]);
    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for UTF-8 BOM
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Extrato_${operatorName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10 w-full max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-start gap-4 mb-2">
        <div className="p-3 bg-emerald-500/10 rounded-xl relative overflow-hidden shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
           <Wallet className="w-6 h-6 text-emerald-500 relative z-10" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Relatório de Produtividade</h1>
          <p className="text-sm text-muted-foreground mt-1">Fechamento de contas validadas e estimativa de acerto individual</p>
        </div>
      </div>

      {/* Tempo Filtro e Exportação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-2 p-1.5 bg-black/20 rounded-lg w-fit border border-border/40">
            {(['HOJE', 'SEMANA', 'MES'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${timeFilter === f ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-border/50 hidden md:block mx-2" />

          {/* Filtros Avançados */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/20 border border-border/40 rounded-lg px-3 py-1.5 h-full">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select 
                value={platformFilter} 
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none max-w-[120px] cursor-pointer appearance-none"
              >
                <option value="TODAS">Todas Plataformas</option>
                {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-black/20 border border-border/40 rounded-lg px-3 py-1.5 h-full">
              <select 
                value={networkFilter} 
                onChange={(e) => setNetworkFilter(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none max-w-[100px] cursor-pointer appearance-none"
              >
                <option value="TODAS">Todas Redes</option>
                {availableNetworks.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-background border border-border hover:bg-muted/50 text-foreground px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* KPIs Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Normal */}
        <div className="glass-card rounded-2xl p-6 border-primary/20 relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.2)] transition-all">
          <Target className="w-8 h-8 text-primary shadow-sm mb-3 opacity-80 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-semibold text-muted-foreground">Contas Concluídas (NORMAL)</h3>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-4xl font-extrabold text-foreground">{currentStats.normal}</span>
            <span className="text-xs text-primary font-bold mb-1.5 bg-primary/10 px-2 py-0.5 rounded">R$ 2,00 / un</span>
          </div>
        </div>

        {/* Card Dep Baixo */}
        <div className="glass-card rounded-2xl p-6 border-muted relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.05)] transition-all">
          <Activity className="w-8 h-8 text-muted-foreground shadow-sm mb-3 opacity-60 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-semibold text-muted-foreground">Contas Concluídas (DEP BAIXO)</h3>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-4xl font-extrabold text-foreground">{currentStats.depBaixo}</span>
            <span className="text-xs text-muted-foreground font-bold mb-1.5 bg-muted px-2 py-0.5 rounded">R$ 1,00 / un</span>
          </div>
        </div>

        {/* Card Lucro */}
        <div className="glass-card rounded-2xl p-6 border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/20 transition-colors" />
          <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-sm mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-semibold text-emerald-400/80">Total a Receber ({timeFilter})</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-extrabold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
              R$ {lucroTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico de Produção */}
      <div className="mt-6 glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <h3 className="text-sm font-bold text-foreground mb-4">Produção (Últimos 7 dias em atividade)</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barGap={4}>
              <defs>
                <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="colorBaixas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
              <RechartsTooltip 
                cursor={{ fill: 'hsl(var(--muted)/0.4)', radius: 8 }}
                contentStyle={{ background: "rgba(10, 10, 10, 0.95)", border: "1px solid hsl(var(--primary)/0.2)", borderRadius: 12, boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)" }} 
                itemStyle={{ color: "hsl(var(--foreground))", fontSize: '13px', fontWeight: 'bold' }}
              />
              <Bar dataKey="normal" name="Normais" fill="url(#colorNormal)" radius={[6, 6, 0, 0]} maxBarSize={30} />
              <Bar dataKey="baixas" name="Baixas" fill="url(#colorBaixas)" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            Nenhuma produção registrada nos filtros selecionados.
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" /> Histórico de Processamento
        </h3>
        <DataTable 
          title="Extrato de Operações" 
          subtitle="Registros validados pelo controle de qualidade"
          columns={columns} 
          data={extratoData} 
          dynamicData={true}
        />
      </div>

    </div>
  );
}
