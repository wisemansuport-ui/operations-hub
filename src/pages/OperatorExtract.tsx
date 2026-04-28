import React, { useState, useMemo } from 'react';
import { Wallet, Target, Activity, CheckCircle2, History } from "lucide-react";
import { DataTable, Column } from "@/components/spreadsheet/DataTable";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { OperationMeta } from "./Tasks";

const columns: Column[] = [
  { key: "data", label: "Data" },
  { key: "plataforma", label: "Plataforma" },
  { key: "contas", label: "Contas Realizadas" },
  { key: "valor", label: "Pagamento (R$)", type: "number" },
  { key: "status", label: "Status" },
];

export default function OperatorExtract() {
  const [timeFilter, setTimeFilter] = useState<'HOJE' | 'SEMANA' | 'MES'>('HOJE');
  const [metas] = useLocalStorage<OperationMeta[]>('nytzer-metas', []);
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const operatorName = user?.username || 'Operador Central';

  const { stats, extratoData } = useMemo(() => {
    const now = new Date();
    const isSameDay = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const isThisWeek = (d: Date) => (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    const isThisMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

    const newStats = {
      HOJE: { normal: 0, depBaixo: 0 },
      SEMANA: { normal: 0, depBaixo: 0 },
      MES: { normal: 0, depBaixo: 0 },
    };

    const extrato: any[] = [];

    metas.forEach(meta => {
      // Exclude deleted metas, and only include metas assigned to the current operator
      if (meta.status === 'lixeira' || meta.operador !== operatorName) return;
      
      let normais = 0;
      let baixas = 0;
      let lastDate = new Date(meta.createdAt);

      (meta.remessas || []).forEach(r => {
        const d = new Date(r.data || meta.createdAt);
        if (d > lastDate) lastDate = d;

        const rn = r.contasNormais || 0;
        const rb = r.contasBaixas || 0;
        normais += rn;
        baixas += rb;

        if (isSameDay(d)) { newStats.HOJE.normal += rn; newStats.HOJE.depBaixo += rb; }
        if (isThisWeek(d)) { newStats.SEMANA.normal += rn; newStats.SEMANA.depBaixo += rb; }
        if (isThisMonth(d)) { newStats.MES.normal += rn; newStats.MES.depBaixo += rb; }
      });

      const totalContas = normais + baixas;
      const pagamentoTotal = (normais * 2) + (baixas * 1);

      extrato.push({
        id: meta.id,
        data: lastDate.toLocaleDateString(),
        plataforma: meta.plataforma || 'N/A',
        contas: totalContas.toString(),
        valor: pagamentoTotal.toFixed(2),
        status: meta.status === 'fechada' ? 'Finalizada' : 'Em Andamento',
        timestamp: lastDate.getTime()
      });
    });

    extrato.sort((a, b) => b.timestamp - a.timestamp);

    return { stats: newStats, extratoData: extrato };
  }, [metas, operatorName]);

  const currentStats = stats[timeFilter];
  const lucroTotal = (currentStats.normal * 2) + (currentStats.depBaixo * 1);

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

      {/* Tempo Filtro */}
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

      {/* KPIs Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Normal */}
        <div className="glass-card rounded-2xl p-6 border-primary/20 relative overflow-hidden group">
          <Target className="w-8 h-8 text-primary shadow-sm mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-muted-foreground">Contas Concluídas (NORMAL)</h3>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-4xl font-extrabold text-foreground">{currentStats.normal}</span>
            <span className="text-xs text-primary font-bold mb-1.5 bg-primary/10 px-2 py-0.5 rounded">R$ 2,00 / un</span>
          </div>
        </div>

        {/* Card Dep Baixo */}
        <div className="glass-card rounded-2xl p-6 border-muted relative overflow-hidden group">
          <Activity className="w-8 h-8 text-muted-foreground shadow-sm mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-muted-foreground">Contas Concluídas (DEP BAIXO)</h3>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-4xl font-extrabold text-foreground">{currentStats.depBaixo}</span>
            <span className="text-xs text-muted-foreground font-bold mb-1.5 bg-muted px-2 py-0.5 rounded">R$ 1,00 / un</span>
          </div>
        </div>

        {/* Card Lucro */}
        <div className="glass-card rounded-2xl p-6 border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/20 transition-colors" />
          <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-sm mb-3" />
          <h3 className="text-sm font-semibold text-emerald-400/80">Total a Receber ({timeFilter})</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-extrabold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
              R$ {lucroTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
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
