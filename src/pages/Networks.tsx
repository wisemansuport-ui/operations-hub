import React, { useMemo, useState, useEffect } from 'react';
import {
  Radio, TrendingUp, TrendingDown, Minus, Trophy, Activity, Target, DollarSign,
  Sparkles, Eye, CheckCircle, AlertTriangle, XCircle, BarChart2, LayoutGrid,
  ChevronRight, MousePointerClick
} from "lucide-react";
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFirestoreData } from '../hooks/useFirestoreData';


interface NetworkStats {
  id: string;
  rank: number;
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  metas: number;
  contas: number;
  mmPorMeta: number;
  winRate: number;        // % de metas com lucro positivo
  profitPerConta: number; // R$ por conta
  roi: number;            // (lucro / deposito) * 100
  totalDeposito: number;
  totalSaque: number;
  totalProfit: number;
  recommendationType: 'increase' | 'maintain' | 'monitor' | 'reduce' | 'suspend';
  recommendationDetail: string;
}

// ─── Score inteligente ────────────────────────────────────────────────────────
// Três eixos: ROI (retorno sobre capital), Win Rate (consistência), R$/conta
// Bônus por volume (credibilidade estatística)
function calcScore(roi: number, winRate: number, profitPerConta: number, metas: number): number {
  let score = 50;

  // ROI sobre capital alocado (±20 pts)
  if (roi > 20)       score += 20;
  else if (roi > 10)  score += 15;
  else if (roi > 5)   score += 10;
  else if (roi > 0)   score += 5;
  else if (roi < -10) score -= 20;
  else                score -= 10;

  // Win Rate / consistência (±15 pts)
  if (winRate > 75)       score += 15;
  else if (winRate > 60)  score += 10;
  else if (winRate > 40)  score += 5;
  else if (winRate < 25)  score -= 15;
  else                    score -= 5;

  // Eficiência por conta (±15 pts)
  if (profitPerConta > 8)       score += 15;
  else if (profitPerConta > 5)  score += 10;
  else if (profitPerConta > 2)  score += 5;
  else if (profitPerConta < 0)  score -= 15;

  // Bônus de credibilidade estatística (max +5 pts)
  if (metas >= 20)      score += 5;
  else if (metas >= 10) score += 3;
  else if (metas >= 5)  score += 1;

  return Math.min(100, Math.max(0, score));
}

function getRecommendation(score: number): {
  type: 'increase' | 'maintain' | 'monitor' | 'reduce' | 'suspend';
  detail: string;
} {
  if (score >= 80) return {
    type: 'increase',
    detail: 'Alta performance consistente — prioridade máxima de operação. Aumentar volume de alocação.',
  };
  if (score >= 65) return {
    type: 'maintain',
    detail: 'Resultados acima da média — manter estratégia atual e escalar gradualmente.',
  };
  if (score >= 50) return {
    type: 'monitor',
    detail: 'Performance moderada — investigar variáveis operacionais para extrair mais potencial.',
  };
  if (score >= 35) return {
    type: 'reduce',
    detail: 'Abaixo do esperado — revisar execução, reduzir exposição até normalizar.',
  };
  return {
    type: 'suspend',
    detail: 'Resultados negativos recorrentes — avaliar viabilidade e considerar suspensão.',
  };
}

// ─── Utilitários de cor para heatmap ─────────────────────────────────────────
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}
function heatBg(n: number): string {
  // 0 = vermelho, 1 = verde
  const hue = Math.round(n * 130);
  return `hsl(${hue}, 65%, 14%)`;
}
function heatText(n: number): string {
  const hue = Math.round(n * 130);
  return `hsl(${hue}, 70%, 58%)`;
}

// ─── Componentes visuais ──────────────────────────────────────────────────────
const RingScore = ({ score }: { score: number }) => {
  const radius = 28;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color  = score >= 70 ? 'hsl(var(--primary))' : score >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
  return (
    <div className="relative flex items-center justify-center w-[72px] h-[72px] shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="72" height="72">
        <circle cx="36" cy="36" r={radius} stroke="hsl(var(--border))" strokeWidth="3" fill="none" opacity="0.4" />
        <circle cx="36" cy="36" r={radius}
          stroke={color} strokeWidth="3" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset}
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
  const cfg = {
    up:     { Icon: TrendingUp,   label: 'Alta',   cls: 'text-success bg-success/10 border-success/20' },
    down:   { Icon: TrendingDown, label: 'Baixa',  cls: 'text-destructive bg-destructive/10 border-destructive/20' },
    stable: { Icon: Minus,        label: 'Estável',cls: 'text-warning bg-warning/10 border-warning/20' },
  }[trend];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cfg.cls}`}>
      <cfg.Icon className="w-3 h-3" />{cfg.label}
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

const recConfig = {
  increase: { label: 'Aumentar',  cls: 'text-success border-success/30 bg-success/10',         Icon: TrendingUp   },
  maintain: { label: 'Manter',    cls: 'text-primary border-primary/30 bg-primary/10',          Icon: CheckCircle  },
  monitor:  { label: 'Monitorar', cls: 'text-warning border-warning/30 bg-warning/10',          Icon: Eye          },
  reduce:   { label: 'Revisar',   cls: 'text-orange-400 border-orange-400/30 bg-orange-400/10', Icon: AlertTriangle },
  suspend:  { label: 'Suspender', cls: 'text-destructive border-destructive/30 bg-destructive/10', Icon: XCircle   },
} as const;

// ─── Página principal ─────────────────────────────────────────────────────────
const Networks = () => {
  const { metas, users } = useFirestoreData();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const activeOperator = user?.username || 'admin';
  const role           = user?.role     || 'ADMIN';
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);


  const networkData = useMemo((): NetworkStats[] => {
    type RMap = Record<string, {
      lucro: number; deposito: number; saque: number;
      contas: number; metas: number; acertos: number;
    }>;
    const redesMap: RMap = {};

    metas.forEach(meta => {
      // ── Apenas metas FECHADAS ──────────────────────────────────────────────
      if (meta.status !== 'fechada') return;
      if (!meta.rede || meta.rede === 'Selecione') return;

      // Visibilidade por operador
      let isVisible = false;
      if (role === 'ADMIN') {
        isVisible =
          meta.operador === activeOperator ||
          (users.find(u => u.username === meta.operador)?.affiliatedTo === activeOperator) ||
          (!meta.operador && activeOperator === 'wiseman');
      } else {
        isVisible = meta.operador === activeOperator;
      }
      if (!isVisible) return;

      // Acumular métricas brutas da plataforma + FAT (salarioOperador)
      let metaDeposito = 0, metaSaque = 0, metaContas = 0;
      (meta.remessas || []).forEach(r => {
        metaDeposito += Number(r.deposito || 0);
        metaSaque    += Number(r.saque    || 0);
        metaContas   += Number(r.contas   || 0);
      });

      const sal       = Number(meta.salarioOperador) || 0;
      const metaLucro = metaSaque - metaDeposito + sal; // inclui FAT

      if (!redesMap[meta.rede]) redesMap[meta.rede] = { lucro: 0, deposito: 0, saque: 0, contas: 0, metas: 0, acertos: 0 };
      redesMap[meta.rede].lucro    += metaLucro;
      redesMap[meta.rede].deposito += metaDeposito;
      redesMap[meta.rede].saque    += metaSaque;
      redesMap[meta.rede].contas   += metaContas;
      redesMap[meta.rede].metas    += 1;
      if (metaLucro > 0) redesMap[meta.rede].acertos += 1;
    });

    const data: NetworkStats[] = Object.entries(redesMap).map(([name, d]) => {
      const profitPerConta = d.contas   > 0 ? d.lucro    / d.contas   : 0;
      const winRate        = d.metas    > 0 ? Math.round((d.acertos / d.metas) * 100) : 0;
      const roi            = d.deposito > 0 ? (d.lucro / d.deposito) * 100 : 0;
      const score          = calcScore(roi, winRate, profitPerConta, d.metas);
      const rec            = getRecommendation(score);

      const trend: 'up' | 'down' | 'stable' =
        score >= 65 ? 'up' : score < 40 ? 'down' : 'stable';

      return {
        id: name, rank: 0, name, score, trend,
        metas:         d.metas,
        contas:        d.contas,
        mmPorMeta:     Math.round(d.contas / (d.metas || 1)),
        winRate,
        profitPerConta,
        roi,
        totalDeposito:  d.deposito,
        totalSaque:     d.saque,
        totalProfit:    d.lucro,
        recommendationType:   rec.type,
        recommendationDetail: rec.detail,
      };
    });

    data.sort((a, b) => b.totalProfit - a.totalProfit);
    data.forEach((d, i) => d.rank = i + 1);
    return data;
  }, [metas, users, role, activeOperator]);

  // Auto-select top-ranked network when list changes (or first selection invalidates)
  useEffect(() => {
    if (networkData.length === 0) {
      if (selectedNetworkId !== null) setSelectedNetworkId(null);
      return;
    }
    if (!selectedNetworkId || !networkData.find(n => n.id === selectedNetworkId)) {
      setSelectedNetworkId(networkData[0].id);
    }
  }, [networkData, selectedNetworkId]);

  const selectedNetwork = networkData.find(n => n.id === selectedNetworkId) || null;

  // ── KPIs de resumo ──────────────────────────────────────────────────────────

  const totalRedes      = networkData.length;
  const redesLucrativas = networkData.filter(n => n.totalProfit > 0).length;
  const lucroTotal      = networkData.reduce((a, n) => a + n.totalProfit, 0);
  const scoreMedio      = totalRedes > 0
    ? Math.round(networkData.reduce((a, n) => a + n.score, 0) / totalRedes)
    : 0;
  const roiMedio        = totalRedes > 0
    ? networkData.reduce((a, n) => a + n.roi, 0) / totalRedes
    : 0;

  // ── Valores mín/máx para normalização do heatmap ───────────────────────────
  const [roiMin,  roiMax]  = [Math.min(...networkData.map(n => n.roi)),            Math.max(...networkData.map(n => n.roi))];
  const [wrMin,   wrMax]   = [Math.min(...networkData.map(n => n.winRate)),        Math.max(...networkData.map(n => n.winRate))];
  const [ppcMin,  ppcMax]  = [Math.min(...networkData.map(n => n.profitPerConta)), Math.max(...networkData.map(n => n.profitPerConta))];
  const [ctMin,   ctMax]   = [Math.min(...networkData.map(n => n.contas)),         Math.max(...networkData.map(n => n.contas))];
  const [mtMin,   mtMax]   = [Math.min(...networkData.map(n => n.metas)),          Math.max(...networkData.map(n => n.metas))];

  const fBRL  = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const fPerc = (v: number) => `${v.toFixed(1)}%`;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-16 relative z-10 w-full">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
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
                Apenas metas <span className="text-primary font-semibold">fechadas</span>.
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
          <p className="text-sm font-medium text-destructive">
            Nenhuma meta fechada encontrada. Feche metas com redes cadastradas para popular o ranking.
          </p>
        </div>
      )}

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile icon={Activity}   label="Total de Redes"    value={String(totalRedes)} />
        <StatTile icon={Target}     label="Redes Lucrativas"  value={String(redesLucrativas)} tone="text-primary" />
        <StatTile icon={DollarSign} label="Lucro Total"       value={fBRL(lucroTotal)}   tone={lucroTotal >= 0 ? 'text-success' : 'text-destructive'} />
        <StatTile icon={Trophy}     label="Score Médio"       value={`${scoreMedio}/100`} />
        <StatTile icon={BarChart2}  label="ROI Médio"         value={fPerc(roiMedio)}    tone={roiMedio >= 0 ? 'text-success' : 'text-destructive'} />
      </div>

      {/* ── Heatmap de Performance ───────────────────────────────────────────── */}
      {networkData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 overflow-x-auto">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/60">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Heatmap de Performance</h2>
            <span className="ml-auto text-[10px] text-muted-foreground border border-border/40 rounded px-2 py-0.5">
              🟢 Melhor · 🔴 Pior
            </span>
          </div>
          <table className="w-full min-w-[640px] text-xs border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th className="text-left pb-2 pr-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] w-20">Rede</th>
                <th className="pb-2 px-2 text-center text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">ROI %</th>
                <th className="pb-2 px-2 text-center text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Win Rate</th>
                <th className="pb-2 px-2 text-center text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">R$/conta</th>
                <th className="pb-2 px-2 text-center text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Contas</th>
                <th className="pb-2 px-2 text-center text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Metas</th>
                <th className="pb-2 pl-2 text-center text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Score</th>
              </tr>
            </thead>
            <tbody>
              {networkData.map(n => {
                const nRoi = normalize(n.roi,            roiMin, roiMax);
                const nWr  = normalize(n.winRate,        wrMin,  wrMax);
                const nPpc = normalize(n.profitPerConta, ppcMin, ppcMax);
                const nCt  = normalize(n.contas,         ctMin,  ctMax);
                const nMt  = normalize(n.metas,          mtMin,  mtMax);
                const nSc  = n.score / 100;

                const cells = [
                  { val: fPerc(n.roi),            norm: nRoi },
                  { val: `${n.winRate}%`,          norm: nWr  },
                  { val: fBRL(n.profitPerConta),   norm: nPpc },
                  { val: String(n.contas),          norm: nCt  },
                  { val: String(n.metas),           norm: nMt  },
                ];

                return (
                  <tr key={n.id} className="group">
                    <td className="py-1 pr-4">
                      <span className="font-bold text-foreground text-sm">{n.name}</span>
                    </td>
                    {cells.map((cell, ci) => (
                      <td key={ci} className="py-1 px-2 text-center">
                        <span
                          className="inline-block px-3 py-1.5 rounded-lg font-semibold tabular-nums text-[11px] min-w-[68px]"
                          style={{ background: heatBg(cell.norm), color: heatText(cell.norm) }}
                        >
                          {cell.val}
                        </span>
                      </td>
                    ))}
                    <td className="py-1 pl-2 text-center">
                      <span
                        className="inline-block px-3 py-1.5 rounded-lg font-bold tabular-nums text-[12px] min-w-[52px]"
                        style={{ background: heatBg(nSc), color: heatText(nSc) }}
                      >
                        {n.score}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Ranking por Network Score (redesign profissional) ──────────────── */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        <div className="flex items-end justify-between px-6 pt-5 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Ranking por Network Score</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
              <MousePointerClick className="w-3 h-3" />
              clique em uma rede
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
              {networkData.length} {networkData.length === 1 ? 'rede' : 'redes'}
            </span>
          </div>
        </div>

        {/* Cabeçalho colunar (desktop) */}
        <div className="hidden lg:grid grid-cols-[60px_1.6fr_repeat(4,minmax(0,1fr))_140px] gap-4 px-6 py-2.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest bg-black/10 border-b border-border/40">
          <span className="text-center">Rank</span>
          <span>Rede</span>
          <span className="text-right">Metas / Contas</span>
          <span className="text-right">Win · ROI</span>
          <span className="text-right">R$ / Conta</span>
          <span className="text-right">Capital → Retorno</span>
          <span className="text-right">Lucro</span>
        </div>

        <div className="divide-y divide-border/40">
          {networkData.map(network => {
            const isSelected = selectedNetworkId === network.id;
            const profitPositive = network.totalProfit >= 0;
            return (
              <button
                key={network.id}
                type="button"
                onClick={() => setSelectedNetworkId(network.id)}
                aria-pressed={isSelected}
                className={`group relative w-full text-left px-6 py-4 transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary/[0.06]'
                    : 'hover:bg-accent/5'
                }`}
              >
                {/* indicador lateral */}
                <span
                  className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-all duration-300 ${
                    isSelected
                      ? 'bg-primary shadow-[0_0_12px_hsl(var(--primary))]'
                      : profitPositive
                        ? 'bg-success/40 group-hover:bg-success/70'
                        : 'bg-destructive/40 group-hover:bg-destructive/70'
                  }`}
                />

                {/* Layout desktop em grid */}
                <div className="hidden lg:grid grid-cols-[60px_1.6fr_repeat(4,minmax(0,1fr))_140px] gap-4 items-center">
                  {/* Rank */}
                  <div className="flex flex-col items-center">
                    <span className={`text-[9px] font-semibold uppercase tracking-widest ${isSelected ? 'text-primary/80' : 'text-muted-foreground/60'}`}>Rank</span>
                    <span className={`text-lg font-bold tabular-nums leading-tight ${
                      network.rank === 1 ? 'text-primary' : isSelected ? 'text-foreground' : 'text-foreground/80'
                    }`}>
                      #{network.rank}
                    </span>
                  </div>

                  {/* Rede + score chip + trend */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl border tabular-nums font-bold text-sm shrink-0 transition-colors ${
                      network.score >= 70
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : network.score >= 40
                          ? 'border-warning/30 bg-warning/10 text-warning'
                          : 'border-destructive/30 bg-destructive/10 text-destructive'
                    }`}>
                      {network.score}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground tracking-tight truncate">{network.name}</h3>
                        <TrendBadge trend={network.trend} />
                      </div>
                      <div className="mt-1 h-1 w-full max-w-[180px] rounded-full bg-secondary/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${profitPositive ? 'bg-gradient-to-r from-primary/60 to-primary' : 'bg-gradient-to-r from-destructive/60 to-destructive'}`}
                          style={{ width: `${network.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metas / Contas */}
                  <div className="text-right tabular-nums">
                    <p className="text-sm font-semibold text-foreground">{network.metas} <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">metas</span></p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{network.contas} contas</p>
                  </div>

                  {/* Win · ROI */}
                  <div className="text-right tabular-nums">
                    <p className="text-sm font-semibold text-primary">{network.winRate}%<span className="text-[10px] font-normal text-muted-foreground ml-1">win</span></p>
                    <p className={`text-[11px] mt-0.5 font-medium ${network.roi >= 0 ? 'text-success' : 'text-destructive'}`}>ROI {fPerc(network.roi)}</p>
                  </div>

                  {/* R$/cta */}
                  <div className="text-right tabular-nums">
                    <p className="text-sm font-semibold text-foreground">{fBRL(network.profitPerConta)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">por conta</p>
                  </div>

                  {/* Capital → Retorno */}
                  <div className="text-right tabular-nums">
                    <p className="text-[11px] text-muted-foreground">Cap <span className="text-foreground/90 font-medium">{fBRL(network.totalDeposito)}</span></p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Ret <span className="text-foreground/90 font-medium">{fBRL(network.totalSaque)}</span></p>
                  </div>

                  {/* Lucro */}
                  <div className="text-right">
                    <p className={`text-lg font-bold tracking-tight tabular-nums ${profitPositive ? 'text-success' : 'text-destructive'}`}>
                      {profitPositive ? '+' : ''}{fBRL(network.totalProfit)}
                    </p>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">Lucro Total</p>
                  </div>
                </div>

                {/* Layout mobile/tablet */}
                <div className="lg:hidden flex items-center gap-4">
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Rank</span>
                    <span className={`text-lg font-bold tabular-nums ${network.rank === 1 ? 'text-primary' : 'text-foreground/80'}`}>#{network.rank}</span>
                  </div>
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl border tabular-nums font-bold text-sm shrink-0 ${
                    network.score >= 70 ? 'border-primary/30 bg-primary/10 text-primary' :
                    network.score >= 40 ? 'border-warning/30 bg-warning/10 text-warning' :
                    'border-destructive/30 bg-destructive/10 text-destructive'
                  }`}>{network.score}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-foreground tracking-tight truncate">{network.name}</h3>
                      <TrendBadge trend={network.trend} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground tabular-nums">
                      <span>{network.metas} metas</span>
                      <span>{network.contas} contas</span>
                      <span>win <span className="text-primary font-semibold">{network.winRate}%</span></span>
                      <span>ROI <span className={`font-semibold ${network.roi >= 0 ? 'text-success' : 'text-destructive'}`}>{fPerc(network.roi)}</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold tabular-nums ${profitPositive ? 'text-success' : 'text-destructive'}`}>
                      {profitPositive ? '+' : ''}{fBRL(network.totalProfit)}
                    </p>
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Lucro</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/40'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recomendação Automatizada (rede selecionada) ───────────────────── */}
      {networkData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/60 relative">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Recomendação Automatizada</h2>
            <span className="ml-auto text-[10px] text-muted-foreground hidden sm:inline">
              Gerada pelo score inteligente
            </span>
          </div>

          {!selectedNetwork && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <MousePointerClick className="w-6 h-6 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">Clique em uma rede no ranking acima para ver sua recomendação.</p>
            </div>
          )}

          {selectedNetwork && (() => {
            const rec = recConfig[selectedNetwork.recommendationType];
            const RecIcon = rec.Icon;
            const tone =
              selectedNetwork.recommendationType === 'increase' ? 'from-success/15 to-success/[0.02] border-success/25' :
              selectedNetwork.recommendationType === 'maintain' ? 'from-primary/15 to-primary/[0.02] border-primary/25' :
              selectedNetwork.recommendationType === 'monitor'  ? 'from-warning/15 to-warning/[0.02] border-warning/25' :
              selectedNetwork.recommendationType === 'reduce'   ? 'from-orange-400/15 to-orange-400/[0.02] border-orange-400/25' :
              'from-destructive/15 to-destructive/[0.02] border-destructive/25';

            return (
              <div key={selectedNetwork.id} className={`rounded-xl border bg-gradient-to-br p-5 sm:p-6 animate-fade-in ${tone}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${rec.cls}`}>
                    <RecIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-base font-bold text-foreground tracking-tight">{selectedNetwork.name}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${rec.cls}`}>
                        {rec.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Score <span className="text-foreground font-semibold">{selectedNetwork.score}</span></span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {selectedNetwork.recommendationDetail}
                    </p>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="rounded-lg border border-border/50 bg-card/40 px-3 py-2">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">ROI</p>
                        <p className={`text-sm font-bold tabular-nums mt-0.5 ${selectedNetwork.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {fPerc(selectedNetwork.roi)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card/40 px-3 py-2">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Win Rate</p>
                        <p className="text-sm font-bold tabular-nums mt-0.5 text-primary">{selectedNetwork.winRate}%</p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card/40 px-3 py-2">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">R$ / Conta</p>
                        <p className="text-sm font-bold tabular-nums mt-0.5 text-foreground">{fBRL(selectedNetwork.profitPerConta)}</p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card/40 px-3 py-2">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Lucro Total</p>
                        <p className={`text-sm font-bold tabular-nums mt-0.5 ${selectedNetwork.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {selectedNetwork.totalProfit >= 0 ? '+' : ''}{fBRL(selectedNetwork.totalProfit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
};

export default Networks;
