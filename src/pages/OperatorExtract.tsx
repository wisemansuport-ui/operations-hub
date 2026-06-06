import React, { useState, useMemo, useEffect } from 'react';
import { Wallet, CheckCircle2, Filter, Download, Calendar as CalendarIcon, User as UserIcon, TrendingUp, Receipt, Clock } from "lucide-react";

import { DataTable, Column } from "@/components/spreadsheet/DataTable";
import { TasksHero, type HeroKpi } from "@/components/heroes/TasksHero";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useFirestoreData } from "../hooks/useFirestoreData";
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, startOfDay, subDays } from "date-fns";
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
  const [platformFilter, setPlatformFilter] = useState<string>('TODAS');
  const [networkFilter, setNetworkFilter] = useState<string>('TODAS');
  const { metas } = useFirestoreData();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const operatorName = user?.username || 'Operador Central';

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);

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
  const lastPayment = paymentHistory[0];
  const paid30d = useMemo(() => {
    const cutoff = startOfDay(subDays(new Date(), 29)).getTime();
    return paymentHistory.filter(h => new Date(h.paidAt).getTime() >= cutoff).reduce((s, h) => s + (h.amount || 0), 0);
  }, [paymentHistory]);
  const avgPayment = paymentHistory.length > 0 ? totalPaidAllTime / paymentHistory.length : 0;

  const { extratoData, availablePlatforms, availableNetworks } = useMemo(() => {
    const extrato: any[] = [];
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

      const matchPlatform = platformFilter === 'TODAS' || pName === platformFilter;
      const matchNetwork = networkFilter === 'TODAS' || rName === networkFilter;
      if (!matchPlatform || !matchNetwork) return;

      const manualSalario = Number(meta.pagamentoOperador) || 0;
      const remessas = meta.remessas || [];

      if (remessas.length === 0) {
        const d = new Date(meta.createdAt);
        let pagamentoTotal = 0;
        if (meta.modelo === 'Recarga') pagamentoTotal = manualSalario;
        extrato.push({
          id: meta.id,
          data: d.toLocaleDateString(),
          plataforma: pName,
          rede: rName,
          contas: '0',
          valor: pagamentoTotal.toFixed(2),
          status: meta.status === 'fechada' ? 'Finalizada' : 'Em Andamento',
          timestamp: d.getTime()
        });
      } else {
        remessas.forEach((r: any) => {
          const d = new Date(r.data || meta.createdAt);
          if (d > lastDate) lastDate = d;
          let rn = Number(r.contasNormais || 0);
          let rb = Number(r.contasBaixas || 0);
          if (meta.modelo === 'Recarga') { rn = 0; rb = 0; }
          if (r.naoContabilizarSalario) { rn = 0; rb = 0; }
          normais += rn;
          baixas += rb;
        });

        const totalContas = normais + baixas;
        let pagamentoTotal = 0;
        if (meta.modelo === 'Recarga') pagamentoTotal = manualSalario;
        else pagamentoTotal = (normais * 2) + (baixas * 1);

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

    return {
      extratoData: extrato,
      availablePlatforms: Array.from(platforms).sort(),
      availableNetworks: Array.from(networks).sort()
    };
  }, [metas, operatorName, platformFilter, networkFilter]);

  const exportToCSV = () => {
    if (extratoData.length === 0) return;
    const headers = ["Data", "Plataforma", "Rede", "Contas Realizadas", "Pagamento (R$)", "Status"];
    const rows = extratoData.map(e => [e.data, e.plataforma, e.rede || 'N/A', e.contas, e.valor.replace('.', ','), e.status]);
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Extrato_${operatorName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group payments by month
  const paymentsByMonth = useMemo(() => {
    const groups: Record<string, { label: string; total: number; items: PaymentHistoryEntry[] }> = {};
    paymentHistory.forEach(h => {
      const d = new Date(h.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = format(d, "MMMM 'de' yyyy", { locale: ptBR });
      if (!groups[key]) groups[key] = { label, total: 0, items: [] };
      groups[key].total += h.amount || 0;
      groups[key].items.push(h);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([k, v]) => ({ key: k, ...v }));
  }, [paymentHistory]);

  const totalOps = extratoData.length;
  const totalContas = extratoData.reduce((s, e) => s + (Number(e.contas) || 0), 0);
  const totalValor = extratoData.reduce((s, e) => s + (Number(e.valor) || 0), 0);
  const finalizadas = extratoData.filter(e => e.status === 'Finalizada').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in relative z-10">
      {/* HERO — Extrato */}
      <TasksHero
        eyebrow="Extrato · Histórico de processamento"
        title="Movimentações detalhadas"
        description="Cada remessa validada pelo controle de qualidade aparece aqui. Filtre por período, plataforma ou rede para auditar caso a caso."
        pulseDotClass="bg-primary"
        kpis={[
          { label: 'Operações', value: String(totalOps) },
          { label: 'Contas totais', value: totalContas.toLocaleString('pt-BR') },
          { label: 'Finalizadas', value: `${finalizadas}/${totalOps || 0}`, tone: 'muted' },
          { label: 'Valor acumulado', value: formatBRL(totalValor), accent: true },
        ] as HeroKpi[]}
      />

      {/* Filtros + exportar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none max-w-[160px] cursor-pointer appearance-none"
            >
              <option value="TODAS">Todas Plataformas</option>
              {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2">
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none max-w-[140px] cursor-pointer appearance-none"
            >
              <option value="TODAS">Todas Redes</option>
              {availableNetworks.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-secondary to-card border border-border hover:border-primary/40 text-sm font-medium text-foreground transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Tabela */}
      <div data-tour="operator-extract-table" className="rounded-2xl border border-border bg-card/60 backdrop-blur p-1 md:p-2">
        <DataTable
          title="Extrato de Operações"
          subtitle="Registros validados pelo controle de qualidade"
          columns={columns}
          data={extratoData}
          dynamicData={true}
        />
      </div>

      {/* ============================================= */}
      {/* HISTÓRICO DE PAGAMENTOS — versão premium       */}
      {/* ============================================= */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-success to-success/40" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-success/80">Pagamentos recebidos</p>
            <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">Histórico financeiro</h2>
          </div>
        </div>

        {/* Resumo cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="hairline-gold surface-3 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-success/10 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2 relative">
              <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-success" />
              </div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Total recebido</p>
            </div>
            <p className="text-2xl font-extrabold text-foreground tabular-nums tracking-tight">{formatBRL(totalPaidAllTime)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{paymentHistory.length} pagamento{paymentHistory.length !== 1 ? 's' : ''} no histórico</p>
          </div>

          <div className="surface-2 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Últimos 30 dias</p>
            </div>
            <p className="text-2xl font-extrabold text-foreground tabular-nums tracking-tight">{formatBRL(paid30d)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Janela móvel</p>
          </div>

          <div className="surface-2 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-primary" />
              </div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Ticket médio</p>
            </div>
            <p className="text-2xl font-extrabold text-foreground tabular-nums tracking-tight">{formatBRL(avgPayment)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Por repasse</p>
          </div>

          <div className="surface-2 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Último pagamento</p>
            </div>
            {lastPayment ? (
              <>
                <p className="text-2xl font-extrabold text-foreground tabular-nums tracking-tight">{formatBRL(lastPayment.amount)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(lastPayment.paidAt), "dd MMM yyyy", { locale: ptBR })}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-muted-foreground tabular-nums tracking-tight">—</p>
                <p className="text-[10px] text-muted-foreground mt-1">Sem pagamentos ainda</p>
              </>
            )}
          </div>
        </div>

        {/* Timeline agrupada por mês */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          {paymentHistory.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Wallet className="w-8 h-8 mx-auto mb-3 opacity-40" />
              Nenhum pagamento registrado ainda. Quando o administrador marcar um pagamento, ele aparecerá aqui.
            </div>
          ) : (
            <div className="space-y-6">
              {paymentsByMonth.map((group) => (
                <div key={group.key}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-foreground capitalize">{group.label}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{group.items.length} repasse{group.items.length !== 1 ? 's' : ''}</span>
                      <span className="text-sm font-bold text-success tabular-nums">{formatBRL(group.total)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((h, idx) => {
                      const isLatest = h.id === lastPayment?.id;
                      return (
                        <div
                          key={h.id}
                          className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all hover:border-success/40 ${
                            isLatest ? 'border-success/30 bg-success/5' : 'border-border bg-secondary/40'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isLatest ? 'bg-success/10 text-success border-success/20' : 'bg-secondary text-muted-foreground border-border'
                          }`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-foreground text-sm tabular-nums">{formatBRL(h.amount)}</span>
                              {isLatest && (
                                <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border border-success/30 bg-success/10 text-success">
                                  Mais recente
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1"><CalendarIcon className="w-2.5 h-2.5" />{format(new Date(h.paidAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}</span>
                              <span className="opacity-50">·</span>
                              <span className="inline-flex items-center gap-1"><UserIcon className="w-2.5 h-2.5" />Registrado por {h.paidBy || '—'}</span>
                            </p>
                          </div>
                          {h.newPaidUntil && (
                            <div className="hidden md:flex flex-col items-end shrink-0">
                              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Cobre até</span>
                              <span className="text-[11px] font-semibold text-foreground/80 tabular-nums">{format(new Date(h.newPaidUntil), "dd/MM/yy", { locale: ptBR })}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
