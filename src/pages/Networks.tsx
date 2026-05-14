import React, { useMemo } from 'react';
import { Radio, TrendingUp, TrendingDown, Minus, Trophy, Activity, Target, DollarSign, Sparkles, ArrowUpRight } from "lucide-react";
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { OperationMeta } from './Tasks';

interface NetworkData {
  id: string;
  rank: number;
  name: string;
  trend: 'up' | 'down' | 'stable';
  score: number;
  metas: number;
  contas: number;
  mm: number;
  winRate: number;
  profitPerConta: number;
  totalProfit: number;
}

const RingScore = ({ score }: { score: number }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? 'hsl(var(--primary))' : score >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  return (
    <div className="relative flex items-center justify-center w-[72px] h-[72px] shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="72" height="72">
        <circle cx="36" cy="36" r={radius} stroke="hsl(var(--border))" strokeWidth="3" fill="none" opacity="0.4" />
        <circle
          cx="36" cy="36" r={radius}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div className="flex flex-col items-center leading-none">
        <span className="text-xl font-bold text-foreground">{score}</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-0.5">Score</span>
      </div>
    </div>
  );
};

const TrendBadge = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const config = {
    up: { Icon: TrendingUp, label: 'Alta', cls: 'text-success bg-success/10 border-success/20' },
    down: { Icon: TrendingDown, label: 'Baixa', cls: 'text-destructive bg-destructive/10 border-destructive/20' },
    stable: { Icon: Minus, label: 'Estável', cls: 'text-warning bg-warning/10 border-warning/20' },
  }[trend];
  const { Icon, label, cls } = config;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

const StatTile = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: string }) => (
  <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/40 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
      <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
    </div>
    <p className={`text-2xl font-bold tracking-tight tabular-nums ${tone || 'text-foreground'}`}>{value}</p>
  </div>
);

const Networks = () => {
  const { metas, users } = useFirestoreData();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const activeOperator = user?.username || 'admin';
  const role = user?.role || 'ADMIN';

  const networkData = useMemo(() => {
    const redesMap: Record<string, { lucro: number, contas: number, metas: number, acertos: number }> = {};

    metas.forEach(meta => {
      if (meta.status === 'lixeira' || !meta.rede || meta.rede === 'Selecione') return;

      let isVisible = false;
      if (role === 'ADMIN') {
        isVisible = meta.operador === activeOperator ||
                    (users.find(u => u.username === meta.operador)?.affiliatedTo === activeOperator) ||
                    (!meta.operador && activeOperator === 'wiseman');
      } else {
        isVisible = meta.operador === activeOperator;
      }

      if (!isVisible) return;

      let metaLucro = 0;
      let metaContas = 0;
      (meta.remessas || []).forEach(r => {
        const dep = Number(r.deposito || 0);
        const saq = Number(r.saque || 0);
        metaLucro += (saq - dep);
        metaContas += Number(r.contas || 0);
      });

      const sal = Number(meta.salarioOperador) || 0;

      if (!redesMap[meta.rede]) redesMap[meta.rede] = { lucro: 0, contas: 0, metas: 0, acertos: 0 };
      redesMap[meta.rede].lucro += (metaLucro + sal);
      redesMap[meta.rede].contas += metaContas;
      redesMap[meta.rede].metas += 1;
      if (metaLucro + sal > 0) redesMap[meta.rede].acertos += 1;
    });

    const data: NetworkData[] = Object.entries(redesMap).map(([name, d]) => {
      const winRate = d.metas > 0 ? (d.acertos / d.metas) * 100 : 0;
      const profitPerConta = d.contas > 0 ? d.lucro / d.contas : 0;

      let score = 50;
      if (winRate >= 80) score += 20;
      else if (winRate >= 50) score += 10;
      else score -= 10;

      if (profitPerConta > 5) score += 20;
      else if (profitPerConta > 0) score += 10;
      else score -= 20;

      score = Math.min(100, Math.max(0, score));

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (score >= 70) trend = 'up';
      else if (score < 40) trend = 'down';

      return {
        id: name, rank: 0, name, trend, score,
        metas: d.metas, contas: d.contas,
        mm: Math.round(d.contas / (d.metas || 1)),
        winRate: Math.round(winRate),
        profitPerConta, totalProfit: d.lucro
      };
    });

    data.sort((a, b) => b.totalProfit - a.totalProfit);
    data.forEach((d, i) => d.rank = i + 1);
    return data;
  }, [metas, users, role, activeOperator]);

  const totalRedes = networkData.length;
  const redesLucrativas = networkData.filter(n => n.totalProfit > 0).length;
  const lucroTotal = networkData.reduce((acc, n) => acc + n.totalProfit, 0);
  const scoreMedio = totalRedes > 0 ? Math.round(networkData.reduce((acc, n) => acc + n.score, 0) / totalRedes) : 0;

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-16 relative z-10 w-full">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Intelligence Layer</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Sistema Estratégico de Decisão</h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
                Heatmap de performance, scoring inteligente, eficiência por capital alocado e recomendações automatizadas por rede.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-success/30 bg-success/10">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-semibold text-success uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      {networkData.length === 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <p className="text-sm font-medium text-destructive">Nenhum dado real ainda. Crie metas e selecione as redes para popular o sistema.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Activity} label="Total de Redes" value={String(totalRedes)} />
        <StatTile icon={Target} label="Redes Lucrativas" value={String(redesLucrativas)} tone="text-primary" />
        <StatTile icon={DollarSign} label="Lucro Total" value={formatBRL(lucroTotal)} tone={lucroTotal >= 0 ? 'text-success' : 'text-destructive'} />
        <StatTile icon={Trophy} label="Score Médio" value={`${scoreMedio}/100`} />
      </div>

      {/* Ranking */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <div className="flex items-end justify-between mb-4 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Ranking por Network Score</h2>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{networkData.length} {networkData.length === 1 ? 'rede' : 'redes'}</span>
        </div>

        <div className="divide-y divide-border/60">
          {networkData.map((network) => (
            <div
              key={network.id}
              className="group relative py-4 first:pt-1 last:pb-1 hover:bg-accent/5 -mx-5 px-5 transition-colors"
            >
              <div className={`absolute top-3 bottom-3 left-0 w-[2px] rounded-r ${
                network.totalProfit > 0 ? 'bg-success/70' : 'bg-destructive/70'
              }`} />

              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 pl-3">
                {/* Left: rank + score + name */}
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="flex flex-col items-center gap-0.5 min-w-[36px]">
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Rank</span>
                    <span className={`text-xl font-bold tabular-nums ${
                      network.rank === 1 ? 'text-primary' : 'text-foreground/70'
                    }`}>
                      #{network.rank}
                    </span>
                  </div>

                  <RingScore score={network.score} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-base font-bold text-foreground tracking-tight">{network.name}</h3>
                      <TrendBadge trend={network.trend} />
                    </div>
                    <div className="flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap tabular-nums">
                      <span><span className="font-semibold text-foreground">{network.metas}</span> metas</span>
                      <span className="text-border">·</span>
                      <span><span className="font-semibold text-foreground">{network.contas}</span> contas</span>
                      <span className="text-border">·</span>
                      <span><span className="font-semibold text-foreground">{network.mm}</span> mm/meta</span>
                      <span className="text-border">·</span>
                      <span>win <span className="font-semibold text-primary">{network.winRate}%</span></span>
                    </div>

                    {/* Progress */}
                    <div className="mt-2.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          network.totalProfit >= 0 ? 'bg-gradient-to-r from-primary/70 to-primary' : 'bg-gradient-to-r from-destructive/60 to-destructive'
                        }`}
                        style={{ width: `${network.score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: profit */}
                <div className="flex flex-row lg:flex-col items-end justify-between w-full lg:w-auto lg:min-w-[160px] lg:text-right gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/60">
                  <div className="lg:order-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Eficiência</p>
                    <p className="text-xs font-semibold text-foreground tabular-nums">{formatBRL(network.profitPerConta)}<span className="text-muted-foreground font-normal">/conta</span></p>
                  </div>
                  <div className="lg:order-1">
                    <p className={`text-xl font-bold tracking-tight tabular-nums ${
                      network.totalProfit >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {network.totalProfit >= 0 ? '+' : ''}{formatBRL(network.totalProfit)}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">Lucro Total</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Networks;
