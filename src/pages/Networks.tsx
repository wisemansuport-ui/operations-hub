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
    <div className="space-y-10 animate-fade-in max-w-6xl mx-auto pb-16 relative z-10 w-full">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/60 via-card/30 to-transparent backdrop-blur-2xl p-8">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-destructive/5 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-2xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <Radio className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Intelligence Layer</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Sistema Estratégico de Decisão</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Heatmap de performance, scoring inteligente, eficiência por capital alocado e recomendações automatizadas por rede.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-success/20 bg-success/5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-semibold text-success uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      {networkData.length === 0 && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <p className="text-sm font-medium text-destructive">Nenhum dado real ainda. Crie metas e selecione as redes para popular o sistema.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Activity} label="Total de Redes" value={String(totalRedes)} accent="bg-blue-500/30" />
        <StatTile icon={Target} label="Redes Lucrativas" value={String(redesLucrativas)} accent="bg-primary/30" />
        <StatTile icon={DollarSign} label="Lucro Total" value={formatBRL(lucroTotal)} accent="bg-success/30" />
        <StatTile icon={Trophy} label="Score Médio" value={`${scoreMedio}/100`} accent="bg-purple-500/30" />
      </div>

      {/* Ranking */}
      <div>
        <div className="flex items-end justify-between mb-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground tracking-tight">Ranking por Network Score</h2>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{networkData.length} {networkData.length === 1 ? 'rede' : 'redes'}</span>
        </div>

        <div className="space-y-3">
          {networkData.map((network) => (
            <div
              key={network.id}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl hover:border-primary/40 hover:bg-card/60 transition-all duration-300"
            >
              {/* Accent strip */}
              <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${
                network.totalProfit > 0 ? 'bg-gradient-to-b from-success to-success/30' : 'bg-gradient-to-b from-destructive to-destructive/30'
              }`} />

              <div className="p-5 pl-7 flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Left: rank + score + name */}
                <div className="flex items-center gap-5 flex-1 w-full">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rank</span>
                    <span className={`text-2xl font-black tracking-tighter ${
                      network.rank === 1 ? 'text-primary' : 'text-foreground/60'
                    }`}>
                      #{network.rank}
                    </span>
                  </div>

                  <div className="h-14 w-px bg-border/50" />

                  <RingScore score={network.score} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-foreground tracking-tight">{network.name}</h3>
                      <TrendBadge trend={network.trend} />
                    </div>
                    <div className="flex items-center gap-x-5 gap-y-1 text-xs text-muted-foreground flex-wrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span className="font-bold text-foreground">{network.metas}</span> metas
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span className="font-bold text-foreground">{network.contas}</span> contas
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span className="font-bold text-foreground">{network.mm}</span> mm/meta
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        win <span className="font-bold text-primary">{network.winRate}%</span>
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mt-3 h-1 w-full rounded-full bg-border/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          network.totalProfit >= 0 ? 'bg-gradient-to-r from-success/60 to-success' : 'bg-gradient-to-r from-destructive/60 to-destructive'
                        }`}
                        style={{ width: `${network.score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: profit */}
                <div className="flex flex-row lg:flex-col items-end justify-between w-full lg:w-auto lg:min-w-[180px] lg:text-right gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/40">
                  <div className="lg:order-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Eficiência</p>
                    <p className="text-xs font-semibold text-foreground/80">{formatBRL(network.profitPerConta)}<span className="text-muted-foreground font-normal">/conta</span></p>
                  </div>
                  <div className="lg:order-1">
                    <p className={`text-2xl font-bold tracking-tight ${
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
