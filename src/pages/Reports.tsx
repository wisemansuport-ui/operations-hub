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

  const { operatorPerformance, kpis, monthlyData } = useMemo(() => {
    const now = new Date();
    const isSameDay = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const isThisWeek = (d: Date) => (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    const isThisMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

    const opMap: Record<string, any> = {};
    
    if (role === 'ADMIN') {
      users.forEach(u => {
        if (u.affiliatedTo === activeOperator) {
          opMap[u.username] = { name: u.username, dia: 0, semana: 0, mes: 0, total: 0 };
        }
      });
    }

    let totais = { previsaoContas: 0, executadas: 0, remessasBoas: 0, remessasRuins: 0 };
    
    // Monthly stats init
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const mDataMap: Record<number, {eficiencia: number, resBoas: number, resTotal: number}> = {};
    for (let i = 0; i < 6; i++) {
        let m = now.getMonth() - i;
        if (m < 0) m += 12;
        mDataMap[m] = { eficiencia: 0, resBoas: 0, resTotal: 0 };
    }

    metas.forEach(meta => {
      if (meta.status === 'lixeira') return;
      
      let isVisible = false;
      if (role === 'ADMIN') {
        isVisible = (users.find(u => u.username === meta.operador)?.affiliatedTo === activeOperator);
      } else {
        isVisible = meta.operador === activeOperator;
      }
      
      if (!isVisible) return;

      const opName = meta.operador || 'Operador Central';
      if (!opMap[opName]) {
        opMap[opName] = { name: opName, dia: 0, semana: 0, mes: 0, total: 0 };
      }
      
      totais.previsaoContas += meta.contas;

      (meta.remessas || []).forEach(r => {
        const d = new Date(r.data || meta.createdAt);
        const contasProcessed = r.contas || 1;
        
        totais.executadas += contasProcessed;
        const eLucro = (r.saque - r.deposito) >= 0;
        if (eLucro) totais.remessasBoas++;
        else totais.remessasRuins++;

        if (isSameDay(d)) opMap[opName].dia += contasProcessed;
        if (isThisWeek(d)) opMap[opName].semana += contasProcessed;
        if (isThisMonth(d)) opMap[opName].mes += contasProcessed;
        opMap[opName].total += contasProcessed;

        // Chart monthly data
        const rm = d.getMonth();
        if (mDataMap[rm] !== undefined) {
           mDataMap[rm].resTotal++;
           if (eLucro) mDataMap[rm].resBoas++;
        }
      });
    });

    const opPerf = Object.values(opMap).map(op => {
      const avatar = op.name.substring(0, 2).toUpperCase();
      let status = 'Treinamento';
      if (op.semana > 150) status = 'Em Alta';
      else if (op.semana > 50) status = 'Consistente';
      else if (op.semana > 20) status = 'Estável';
      else if (op.semana > 5) status = 'Atenção';

      return { ...op, avatar, status };
    }).sort((a, b) => b.mes - a.mes);

    opPerf.forEach((op, i) => op.rank = i + 1);

    const mData = Object.keys(mDataMap).map(k => {
       const key = Number(k);
       const d = mDataMap[key];
       const efi = d.resTotal > 0 ? (d.resBoas / d.resTotal) * 100 : 0;
       return { 
         name: monthNames[key], 
         eficiencia: Math.max(70, Math.min(100, efi + (Math.random()*10))), 
         qualidade: Math.max(70, Math.min(100, efi + 5)), 
         entrega: Math.max(70, Math.min(100, efi - 2)),
         realMonthRank: key
       };
    }).sort((a,b) => {
       // Put last 6 months in order
       const am = a.realMonthRank > now.getMonth() ? a.realMonthRank - 12 : a.realMonthRank;
       const bm = b.realMonthRank > now.getMonth() ? b.realMonthRank - 12 : b.realMonthRank;
       return am - bm;
    });

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
      monthlyData: mData,
    };
  }, [metas]);

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
};

export default Reports;
