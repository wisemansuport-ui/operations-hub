import { KPICard } from "@/components/dashboard/KPICard";
import { TrendingUp, CheckCircle, AlertTriangle, Clock, Users, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

import { useFirestoreData } from "../hooks/useFirestoreData";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { OperationMeta } from "./Tasks";
import { useMemo } from "react";

const Reports = () => {
  const { metas, users } = useFirestoreData();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const activeOperator = user?.username || 'admin';
  const role = user?.role || 'ADMIN';

  const { operatorPerformance, kpis, weeklyData } = useMemo(() => {
    const now = new Date();
    
    const getWeekKey = (d: Date) => {
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);
        return weekIndex;
    }

    const opMap: Record<string, { name: string, contas: number, lucro: number, diasSet: Set<string> }> = {};
    
    if (role === 'ADMIN') {
      users.forEach(u => {
        if (u.affiliatedTo === activeOperator) {
          opMap[u.username] = { name: u.username, contas: 0, lucro: 0, diasSet: new Set() };
        }
      });
    }

    let totais = { previsaoContas: 0, executadas: 0, remessasBoas: 0, remessasRuins: 0 };
    
    const weekMap: Record<number, { weekName: string, contas: number, lucro: number, diasSet: Set<string>, sortIndex: number }> = {};
    for (let i = 0; i < 6; i++) {
        let weekName = i === 0 ? "Nesta Semana" : i === 1 ? "Sem. Passada" : `${i} sem. atrás`;
        weekMap[i] = { weekName, contas: 0, lucro: 0, diasSet: new Set(), sortIndex: i };
    }

    metas.forEach(meta => {
      if (meta.status === 'lixeira') return;
      
      let isVisible = false;
      if (role === 'ADMIN') {
        isVisible = (users.find(u => u.username === meta.operador)?.affiliatedTo === activeOperator) || (!meta.operador && activeOperator === 'wiseman');
      } else {
        isVisible = meta.operador === activeOperator;
      }
      
      if (!isVisible) return;

      const opName = meta.operador || 'Operador Central';
      if (!opMap[opName]) {
        opMap[opName] = { name: opName, contas: 0, lucro: 0, diasSet: new Set() };
      }
      
      totais.previsaoContas += meta.contas;

      let isFechada = meta.status === 'fechada';
      const sal = Number(meta.salarioOperador) || 0;
      let autoSalarioMeta = 0;
      let metaLucroBruto = 0;

      (meta.remessas || []).forEach(r => {
        const d = new Date(r.data || meta.createdAt);
        const dateStr = d.toLocaleDateString('pt-BR');
        const contasProcessed = r.contas || 1;
        
        totais.executadas += contasProcessed;
        const dep = Number(r.deposito || 0);
        const saq = Number(r.saque || 0);
        const eLucro = (saq - dep) >= 0;
        if (eLucro) totais.remessasBoas++;
        else totais.remessasRuins++;

        if (isFechada) {
            metaLucroBruto += (saq - dep);
            const normais = (r as any).contasNormais || 0;
            const baixas = (r as any).contasBaixas || 0;
            if (!meta.isAdminMeta && meta.modelo !== 'Recarga') {
                autoSalarioMeta += (normais * 2) + (baixas * 1);
            }
        }
        
        opMap[opName].contas += contasProcessed;
        opMap[opName].diasSet.add(dateStr);

        const wIndex = getWeekKey(d);
        if (weekMap[wIndex] !== undefined) {
           weekMap[wIndex].contas += contasProcessed;
           weekMap[wIndex].diasSet.add(dateStr);
        }
      });

      if (isFechada) {
         if (!meta.isAdminMeta && meta.modelo === 'Recarga') {
             autoSalarioMeta += Number(meta.pagamentoOperador) || 0;
         }
         const lucroLiquido = metaLucroBruto + sal - autoSalarioMeta;
         
         opMap[opName].lucro += lucroLiquido;
         
         const metaDate = new Date(meta.createdAt);
         const wIndex = getWeekKey(metaDate);
         if (weekMap[wIndex] !== undefined) {
             weekMap[wIndex].lucro += lucroLiquido;
         }
      }
    });

    const opPerf = Object.values(opMap).map(op => {
      const userRecord = users.find(u => u.username === op.name);
      const displayName = userRecord?.displayName || op.name;
      const avatar = displayName.substring(0, 2).toUpperCase();
      let status = 'Treinamento';
      if (op.contas > 500) status = 'Em Alta';
      else if (op.contas > 200) status = 'Consistente';
      else if (op.contas > 50) status = 'Estável';
      else if (op.contas > 10) status = 'Atenção';

      return { 
        ...op, 
        name: displayName, 
        avatar, 
        status, 
        diasOperados: op.diasSet.size 
      };
    }).sort((a, b) => b.contas - a.contas);

    opPerf.forEach((op, i) => op.rank = i + 1);

    const wData = Object.values(weekMap).map(w => ({
         name: w.weekName,
         contas: w.contas,
         lucro: w.lucro,
         diasOperados: w.diasSet.size,
         sortIndex: w.sortIndex
    })).sort((a,b) => b.sortIndex - a.sortIndex); // oldest to newest (6 weeks ago ... this week)

    const oeeCalc = totais.remessasBoas + totais.remessasRuins > 0 ? 
      ((totais.remessasBoas) / (totais.remessasBoas + totais.remessasRuins)) * 100 : 0;
      
    const qualCalc = totais.previsaoContas > 0 ? 
      Math.min(100, (totais.executadas / totais.previsaoContas) * 100) : 0;

    return { 
      operatorPerformance: opPerf, 
      kpis: {
        oee: oeeCalc.toFixed(1) + "%",
        qualidade: qualCalc.toFixed(1) + "%",
        falhas: totais.remessasRuins
      },
      weeklyData: wData,
    };
  }, [metas, users, role, activeOperator]);

  return (
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
      <KPICard title="OEE Geral" value={kpis.oee} change="Volume sucesso" changeType="neutral" icon={TrendingUp} color="success" />
      <KPICard title="Taxa de Qualidade" value={kpis.qualidade} change="Contas finalizadas" changeType="positive" icon={CheckCircle} color="primary" />
      <KPICard title="Tempo Parado" value="0.0h" change="N/D" changeType="neutral" icon={Clock} color="warning" />
      <KPICard title="Não Conformidades" value={String(kpis.falhas)} change="Remessas negativas" changeType="negative" icon={AlertTriangle} color="destructive" />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
      <div className="glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden group">
        <h3 className="text-base font-bold text-foreground mb-1">Volume de Contas Semanal</h3>
        <p className="text-xs text-muted-foreground mb-6">Acompanhamento histórico da capacidade de produção operacional.</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyData} margin={{ left: -20, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
              contentStyle={{ background: "rgba(10, 10, 10, 0.9)", backdropFilter: "blur(12px)", border: "1px solid hsl(var(--primary)/0.2)", borderRadius: 12 }} 
              itemStyle={{ color: "hsl(var(--foreground))", fontSize: '13px', fontWeight: 'bold' }}
            />
            <Bar dataKey="contas" name="Contas Totais" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden">
        <h3 className="text-base font-bold text-foreground mb-1">Lucratividade e Presença</h3>
        <p className="text-xs text-muted-foreground mb-6">Relação entre o lucro gerado e o número de dias operados semanalmente.</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={weeklyData} margin={{ left: -20, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: "rgba(10, 10, 10, 0.9)", backdropFilter: "blur(12px)", border: "1px solid hsl(var(--primary)/0.2)", borderRadius: 12 }} 
              itemStyle={{ color: "hsl(var(--foreground))", fontSize: '13px', fontWeight: 'bold' }}
              formatter={(value: any, name: string) => {
                 if (name === "Lucro Gerado") return `R$ ${Number(value).toFixed(2)}`;
                 if (name === "Dias Operados") return `${value} dias`;
                 return value;
              }}
            />
            <Line yAxisId="left" type="monotone" name="Lucro Gerado" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            <Line yAxisId="right" type="monotone" name="Dias Operados" dataKey="diasOperados" stroke="hsl(var(--warning))" strokeWidth={2} dot={true} />
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
          <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-black/20 border-b border-border">
            <tr>
              <th className="px-5 py-4 font-semibold text-center w-16">Rank</th>
              <th className="px-5 py-4 font-semibold">Colaborador</th>
              <th className="px-5 py-4 font-semibold text-center border-l border-border/30">Contas Totais</th>
              <th className="px-5 py-4 font-semibold text-center">Lucro Gerado</th>
              <th className="px-5 py-4 font-semibold text-center">Dias Operados</th>
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
                  <span className="text-primary font-bold tabular-nums">{op.contas}</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={`font-semibold tabular-nums ${op.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {op.lucro >= 0 ? '+' : ''}R$ {op.lucro.toFixed(2).replace('.', ',')}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="text-muted-foreground font-medium tabular-nums">{op.diasOperados} d</span>
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
};

export default Reports;
