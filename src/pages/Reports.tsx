import { KPICard } from "@/components/dashboard/KPICard";
import { TasksHero, type HeroKpi } from "@/components/heroes/TasksHero";
import { Clock, Users, Trophy } from "lucide-react";

import { useFirestoreData } from "../hooks/useFirestoreData";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { lazy, Suspense, useMemo, useState } from "react";
import { PeriodFilter, DateFilter, buildDateFilter, isInRange } from "@/components/ui/period-filter";
import { useIsMobile } from "../hooks/use-mobile";

const ReportsCharts = lazy(() => import("@/components/reports/ReportsCharts"));

const Reports = () => {
  const { metas, users } = useFirestoreData();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const activeOperator = user?.username || 'admin';
  const role = user?.role || 'ADMIN';
  const isMobile = useIsMobile();

  const userByUsername = useMemo(() => {
    const map = new Map<string, any>();
    users.forEach((u: any) => map.set(u.username, u));
    return map;
  }, [users]);

  const [dateFilter, setDateFilter] = useState<DateFilter>(
    buildDateFilter('MES')
  );

  const { operatorPerformance, kpis, weeklyData } = useMemo(() => {
    const now = new Date();
    
    const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - date.getDay()); // Sunday
        return date;
    };
    const currentWeekStart = getStartOfWeek(now);

    const getWeekKey = (d: Date) => {
        const dStart = getStartOfWeek(d);
        const diffMs = currentWeekStart.getTime() - dStart.getTime();
        if (diffMs < 0) return 0; // future to this week
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    };

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
      // Only process fully closed metas (not lixeira, not aberta)
      if (meta.status !== 'fechada') return;
      
      let isVisible = false;
      if (role === 'ADMIN') {
        isVisible = meta.operador === activeOperator ||
                    (userByUsername.get(meta.operador)?.affiliatedTo === activeOperator) ||
                    (!meta.operador && activeOperator === 'wiseman');
      } else {
        isVisible = meta.operador === activeOperator;
      }
      
      if (!isVisible) return;

      const opName = meta.operador || 'Operador Central';
      if (!opMap[opName]) {
        opMap[opName] = { name: opName, contas: 0, lucro: 0, diasSet: new Set() };
      }
      
      totais.previsaoContas += meta.contas;

      const sal = Number(meta.salarioOperador) || 0;
      const pagOp = Number(meta.pagamentoOperador) || 0;
      
      const remessas = meta.remessas || [];
      const totalContasMeta = remessas.reduce((acc, r) => acc + Number(r.contas || 0), 0);
      let metaTotalDep = 0, metaTotalSaq = 0;

      // Use closedAt if available, otherwise fallback to createdAt for weekly grouping
      const metaClosedAt = (meta as any).closedAt || meta.createdAt;
      const metaClosedDate = new Date(metaClosedAt);
      const metaClosedDateStr = metaClosedDate.toLocaleDateString('pt-BR');
      const metaWeekIndex = getWeekKey(metaClosedDate);

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

        metaTotalDep += dep;
        metaTotalSaq += saq;

        const d = new Date(r.data || meta.createdAt);
        const dateStr = d.toLocaleDateString('pt-BR');
        
        totais.executadas += rc;
        const eLucro = (saq - dep) >= 0;
        if (eLucro) totais.remessasBoas++;
        else totais.remessasRuins++;

        const prop = totalContasMeta > 0 ? originalRc / totalContasMeta : (remessas.length > 0 ? 1 / remessas.length : 1);
        const remSal = sal * prop;
        let remAutoSal = 0;
        if (!meta.isAdminMeta) {
          if (meta.modelo === 'Recarga') {
            remAutoSal = pagOp * prop;
          } else {
            remAutoSal = (normais * 2) + (baixas * 1);
          }
        }
        
        const remLucroLiquido = (saq - dep) + remSal - (!meta.isAdminMeta ? remAutoSal : 0);

        // Operator performance: filter by selected date period (use remessa date)
        if (isInRange(d, dateFilter)) {
          opMap[opName].contas += rc;
          opMap[opName].diasSet.add(dateStr);
          opMap[opName].lucro += remLucroLiquido;
        }

        // Weekly chart: group by the week the META was closed, not individual remessa dates
        if (weekMap[metaWeekIndex] !== undefined) {
           weekMap[metaWeekIndex].contas += rc;
           weekMap[metaWeekIndex].diasSet.add(metaClosedDateStr);
           weekMap[metaWeekIndex].lucro += remLucroLiquido;
        }
      });
      
      // Handle closed metas with 0 remessas (safeguard: use meta-level totals)
      if (totalContasMeta === 0 && remessas.length === 0) {
         const metaAutoSal = !meta.isAdminMeta ? (meta.modelo === 'Recarga' ? pagOp : 0) : 0;
         const metaLucroLiquido = (metaTotalSaq - metaTotalDep) + sal - metaAutoSal;

         if (isInRange(metaClosedDate, dateFilter)) {
           opMap[opName].lucro += metaLucroLiquido;
           opMap[opName].diasSet.add(metaClosedDateStr);
         }
         
         if (weekMap[metaWeekIndex] !== undefined) {
            weekMap[metaWeekIndex].lucro += metaLucroLiquido;
            weekMap[metaWeekIndex].diasSet.add(metaClosedDateStr);
         }
      }
    });

    const opPerf = Object.values(opMap).map(op => {
      const userRecord = userByUsername.get(op.name);
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
        diasOperados: op.diasSet.size,
        rank: 0,
      };
    }).sort((a, b) => b.contas - a.contas);

    opPerf.forEach((op, i) => op.rank = i + 1);

    const wData = Object.values(weekMap).map(w => ({
         name: w.weekName,
         contas: w.contas,
         lucro: w.lucro,
         diasOperados: w.diasSet.size,
         sortIndex: w.sortIndex
    })).sort((a,b) => b.sortIndex - a.sortIndex);

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
  }, [metas, users, role, activeOperator, dateFilter, userByUsername]);

  return (
  <div className="space-y-6 relative z-10">
    <TasksHero
      eyebrow="Relatórios · Performance industrial"
      title="Painel de relatórios"
      description="OEE, qualidade e falhas. A leitura técnica da sua operação em um só lugar."
      pulseDotClass="bg-primary"
      progressLabel="Qualidade"
      progressValue={parseFloat(kpis.qualidade)}
      kpis={[
        { label: 'OEE', value: kpis.oee, accent: true },
        { label: 'Qualidade', value: kpis.qualidade, tone: 'success' },
        { label: 'Falhas', value: String(kpis.falhas), tone: kpis.falhas > 0 ? 'destructive' : 'muted' },
        { label: 'Operadores ativos', value: String(operatorPerformance.length) },
      ] as HeroKpi[]}
    />


    <div className="flex items-center justify-between gap-3 flex-wrap">
      <PeriodFilter value={dateFilter} onChange={setDateFilter} />
      <KPICard title="Tempo Parado" value="0.0h" change="N/D" changeType="neutral" icon={Clock} color="warning" />
    </div>

    {isMobile ? (
      <div data-tour="reports-charts" className="rounded-2xl border border-border bg-card/60 p-4 mt-4">
        <h3 className="text-base font-bold text-foreground mb-3">Resumo semanal</h3>
        <div className="space-y-2">
          {weeklyData.map((week) => (
            <div key={week.name} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/30 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{week.name}</p>
                <p className="text-[10px] text-muted-foreground">{week.diasOperados} dia{week.diasOperados !== 1 ? 's' : ''} operado{week.diasOperados !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black tabular-nums text-primary">{week.contas}</p>
                <p className={`text-[10px] font-bold tabular-nums ${week.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {week.lucro >= 0 ? '+' : ''}R$ {week.lucro.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <Suspense fallback={<div className="rounded-2xl border border-border bg-card/60 p-6 mt-4 text-sm text-muted-foreground">Carregando gráficos…</div>}>
        <ReportsCharts weeklyData={weeklyData} />
      </Suspense>
    )}

    {/* Operator Performance Ranking */}
    <div data-tour="reports-ranking" className="glass-card rounded-2xl p-4 sm:p-6 border-primary/20 mt-6 bg-card/60 relative overflow-hidden">
      <div className="hidden md:block absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      
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

      {isMobile ? (
        <div className="space-y-2">
          {operatorPerformance.map((op) => (
            <div key={op.name} className="rounded-xl border border-border/50 bg-background/30 p-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-muted/50 text-muted-foreground shrink-0">
                  {op.rank}
                </span>
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20 shrink-0">
                  {op.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{op.name}</p>
                  <p className="text-[10px] text-muted-foreground">{op.status}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums text-primary">{op.contas}</p>
                  <p className={`text-[10px] font-semibold tabular-nums ${op.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {op.lucro >= 0 ? '+' : ''}R$ {op.lucro.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/20 border-b border-border">
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
                <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors last:border-0 group">
                  <td className="px-5 py-4 text-center"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-muted/50 text-muted-foreground">{op.rank}</span></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">{op.avatar}</div><span className="font-semibold text-foreground">{op.name}</span></div></td>
                  <td className="px-5 py-4 text-center border-l border-border/20"><span className="text-primary font-bold tabular-nums">{op.contas}</span></td>
                  <td className="px-5 py-4 text-center"><span className={`font-semibold tabular-nums ${op.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>{op.lucro >= 0 ? '+' : ''}R$ {op.lucro.toFixed(2).replace('.', ',')}</span></td>
                  <td className="px-5 py-4 text-center"><span className="text-muted-foreground font-medium tabular-nums">{op.diasOperados} d</span></td>
                  <td className="px-5 py-4 text-right"><span className="inline-flex text-[10px] px-2.5 py-1 rounded bg-card/80 border border-border font-bold uppercase tracking-wider text-muted-foreground">{op.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
  );
};

export default Reports;
