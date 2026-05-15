import React, { useState, useMemo, useEffect } from 'react';
import { Wallet, Target, Activity, CheckCircle2, History, Filter, Download, Calendar as CalendarIcon, User as UserIcon, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { DataTable, Column } from "@/components/spreadsheet/DataTable";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useFirestoreData } from "../hooks/useFirestoreData";
import { OperationMeta } from "./Tasks";
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentHistoryEntry {
  id: string;
  operatorId: string;
  operatorName: string;
  amount: number;
  paidAt: string;
  paidBy: string;
  previousPaidUntil: string | null;
  newPaidUntil: string;
}

const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'operatorPaymentHistory'), snap => {
      const list: PaymentHistoryEntry[] = snap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter(h => h.operatorId === operatorName);
      list.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
      setPaymentHistory(list);
    });
    return () => unsub();
  }, [operatorName]);

  const totalPaidAllTime = paymentHistory.reduce((s, h) => s + (h.amount || 0), 0);

  const { stats, extratoData, chartData, availablePlatforms, availableNetworks } = useMemo(() => {
    const now = new Date();
    const isSameDay = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const isThisWeek = (d: Date) => (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    const isThisMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

    const newStats = {
      HOJE: { normal: 0, depBaixo: 0, salarioManual: 0, pendingNormal: 0, pendingDepBaixo: 0, pendingSalarioManual: 0 },
      SEMANA: { normal: 0, depBaixo: 0, salarioManual: 0, pendingNormal: 0, pendingDepBaixo: 0, pendingSalarioManual: 0 },
      MES: { normal: 0, depBaixo: 0, salarioManual: 0, pendingNormal: 0, pendingDepBaixo: 0, pendingSalarioManual: 0 },
    };

    const extrato: any[] = [];
    const productionByDate: Record<string, { date: string, normal: number, baixas: number }> = {};
    const platforms = new Set<string>();
    const networks = new Set<string>();

    const paidUntil = paymentHistory.length > 0 && paymentHistory[0].newPaidUntil 
      ? new Date(paymentHistory[0].newPaidUntil).getTime() 
      : 0;

    metas.forEach(meta => {
      if (meta.status === 'lixeira' || meta.operador !== operatorName || meta.isAdminMeta) return;
      
      let normais = 0;
      let baixas = 0;
      let lastDate = new Date(meta.createdAt);
      
      const pName = meta.plataforma || 'N/A';
      const rName = meta.rede && meta.rede !== 'Selecione' ? meta.rede : 'N/A';

      platforms.add(pName);
      if (rName !== 'N/A') networks.add(rName);

      const metaTime = new Date(meta.createdAt).getTime();
      const isPending = !paidUntil || metaTime > paidUntil;

      // Apply Filters
      const matchPlatform = platformFilter === 'TODAS' || pName === platformFilter;
      const matchNetwork = networkFilter === 'TODAS' || rName === networkFilter;

      if (matchPlatform && matchNetwork) {
        (meta.remessas || []).forEach((r: any) => {
          const d = new Date(r.data || meta.createdAt);
          if (d > lastDate) lastDate = d;

          const rn = r.contasNormais || 0;
          const rb = r.contasBaixas || 0;
          normais += rn;
          baixas += rb;

          if (meta.modelo !== 'Recarga') {
            if (isSameDay(d)) { 
              newStats.HOJE.normal += rn; 
              newStats.HOJE.depBaixo += rb; 
              if (isPending) { newStats.HOJE.pendingNormal += rn; newStats.HOJE.pendingDepBaixo += rb; }
            }
            if (isThisWeek(d)) { 
              newStats.SEMANA.normal += rn; 
              newStats.SEMANA.depBaixo += rb; 
              if (isPending) { newStats.SEMANA.pendingNormal += rn; newStats.SEMANA.pendingDepBaixo += rb; }
            }
            if (isThisMonth(d)) { 
              newStats.MES.normal += rn; 
              newStats.MES.depBaixo += rb; 
              if (isPending) { newStats.MES.pendingNormal += rn; newStats.MES.pendingDepBaixo += rb; }
            }
          }

          // Group for chart (by remessa day)
          const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          if (!productionByDate[dateStr]) productionByDate[dateStr] = { date: dateStr, normal: 0, baixas: 0 };
          productionByDate[dateStr].normal += rn;
          productionByDate[dateStr].baixas += rb;
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
          if (isSameDay(lastDate)) {
             newStats.HOJE.salarioManual += manualSalario;
             if (isPending) newStats.HOJE.pendingSalarioManual += manualSalario;
          }
          if (isThisWeek(lastDate)) {
             newStats.SEMANA.salarioManual += manualSalario;
             if (isPending) newStats.SEMANA.pendingSalarioManual += manualSalario;
          }
          if (isThisMonth(lastDate)) {
             newStats.MES.salarioManual += manualSalario;
             if (isPending) newStats.MES.pendingSalarioManual += manualSalario;
          }
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
  }, [metas, operatorName, platformFilter, networkFilter, paymentHistory]);

  const currentStats = stats[timeFilter];
  const lucroTotal = (currentStats.pendingNormal * 2) + (currentStats.pendingDepBaixo * 1) + (currentStats.pendingSalarioManual || 0);

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
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Meu Relatório de Produtividade</h1>
            <p className="text-sm text-muted-foreground mt-1">Fechamento de contas validadas e estimativa de acerto individual</p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-secondary to-card border border-border hover:border-primary/40 text-sm font-medium text-foreground transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Tempo Filtro */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 p-1 bg-secondary rounded-xl w-fit border border-border">
          {(['HOJE', 'SEMANA', 'MES'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest rounded-lg transition-all ${timeFilter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-1">
          <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none max-w-[140px] cursor-pointer appearance-none"
            >
              <option value="TODAS">Todas Plataformas</option>
              {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2">
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none max-w-[120px] cursor-pointer appearance-none"
            >
              <option value="TODAS">Todas Redes</option>
              {availableNetworks.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Normal */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Contas Concluídas (NORMAL)</div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-bold text-foreground tabular-nums">{currentStats.normal}</span>
                <span className="text-[10px] text-primary font-semibold mb-1.5 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">R$ 2,00 / un</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        {/* Card Dep Baixo */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 relative overflow-hidden">
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Contas Concluídas (DEP BAIXO)</div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-bold text-foreground tabular-nums">{currentStats.depBaixo}</span>
                <span className="text-[10px] text-muted-foreground font-semibold mb-1.5 bg-secondary border border-border px-2 py-0.5 rounded uppercase tracking-wider">R$ 1,00 / un</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Card Lucro */}
        <div className="rounded-2xl border border-success/30 bg-gradient-to-br from-card to-success/5 p-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-success/10 blur-2xl pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-success font-semibold">Total a Receber ({timeFilter})</div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-success tabular-nums">
                  R$ {lucroTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Produção */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Produção (Últimos 7 dias em atividade)</h2>
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

      <div>
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
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

      {/* Histórico de Pagamentos Recebidos */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        <button
          onClick={() => setShowHistory(s => !s)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-accent/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-success" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Histórico de pagamentos recebidos</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-widest">
                {paymentHistory.length} pagamento{paymentHistory.length !== 1 ? 's' : ''} · total recebido {formatBRL(totalPaidAllTime)}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>

        {showHistory && (
          <div className="border-t border-border px-5 py-4 animate-fade-in">
            {paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Nenhum pagamento registrado ainda. Quando o administrador marcar um pagamento, ele aparecerá aqui.
              </div>
            ) : (
              <div className="space-y-2">
                {paymentHistory.map((h, idx) => (
                  <div
                    key={h.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition-colors ${
                      idx === 0
                        ? 'border-success/30 bg-success/5'
                        : 'border-border bg-secondary/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      idx === 0 ? 'bg-success/10 text-success border-success/20' : 'bg-secondary text-muted-foreground border-border'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm tabular-nums">{formatBRL(h.amount)}</span>
                        {idx === 0 && (
                          <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border border-success/30 bg-success/10 text-success">
                            Mais recente
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <CalendarIcon className="w-2.5 h-2.5" />
                        {format(new Date(h.paidAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                        <span className="opacity-50">·</span>
                        <UserIcon className="w-2.5 h-2.5" /> Registrado por {h.paidBy || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
