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

      {/* ── Ranking completo ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <div className="flex items-end justify-between mb-4 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Ranking por Network Score</h2>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
            {networkData.length} {networkData.length === 1 ? 'rede' : 'redes'}
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {networkData.map(network => {
            const rec    = recConfig[network.recommendationType];
            const RecIcon = rec.Icon;
            return (
              <div key={network.id} className="group relative py-4 first:pt-1 last:pb-1 hover:bg-accent/5 -mx-5 px-5 transition-colors">
                {/* barra lateral colorida */}
                <div className={`absolute top-3 bottom-3 left-0 w-[2px] rounded-r ${network.totalProfit > 0 ? 'bg-success/70' : 'bg-destructive/70'}`} />

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 pl-3">
                  {/* Rank + Score + Info */}
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="flex flex-col items-center gap-0.5 min-w-[36px]">
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Rank</span>
                      <span className={`text-xl font-bold tabular-nums ${network.rank === 1 ? 'text-primary' : 'text-foreground/70'}`}>
                        #{network.rank}
                      </span>
                    </div>

                    <RingScore score={network.score} />

                    <div className="flex-1 min-w-0">
                      {/* Nome + badges */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-foreground tracking-tight">{network.name}</h3>
                        <TrendBadge trend={network.trend} />
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${rec.cls}`}>
                          <RecIcon className="w-3 h-3" />{rec.label}
                        </span>
                      </div>

                      {/* Métricas inline */}
                      <div className="flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap tabular-nums">
                        <span><span className="font-semibold text-foreground">{network.metas}</span> metas</span>
                        <span className="text-border">·</span>
                        <span><span className="font-semibold text-foreground">{network.contas}</span> contas</span>
                        <span className="text-border">·</span>
                        <span><span className="font-semibold text-foreground">{network.mmPorMeta}</span> mm/meta</span>
                        <span className="text-border">·</span>
                        <span>win <span className="font-semibold text-primary">{network.winRate}%</span></span>
                        <span className="text-border">·</span>
                        <span>ROI <span className={`font-semibold ${network.roi >= 0 ? 'text-success' : 'text-destructive'}`}>{fPerc(network.roi)}</span></span>
                      </div>

                      {/* Capital alocado → retorno */}
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                        <span>Capital: <span className="text-foreground font-medium">{fBRL(network.totalDeposito)}</span></span>
                        <span className="text-border">→</span>
                        <span>Retorno: <span className="text-foreground font-medium">{fBRL(network.totalSaque)}</span></span>
                      </div>

                      {/* Barra de score */}
                      <div className="mt-2.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${network.totalProfit >= 0 ? 'bg-gradient-to-r from-primary/70 to-primary' : 'bg-gradient-to-r from-destructive/60 to-destructive'}`}
                          style={{ width: `${network.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lucro + Eficiência */}
                  <div className="flex flex-row lg:flex-col items-end justify-between w-full lg:w-auto lg:min-w-[160px] lg:text-right gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/60">
                    <div className="lg:order-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Eficiência</p>
                      <p className="text-xs font-semibold text-foreground tabular-nums">
                        {fBRL(network.profitPerConta)}<span className="text-muted-foreground font-normal">/conta</span>
                      </p>
                    </div>
                    <div className="lg:order-1">
                      <p className={`text-xl font-bold tracking-tight tabular-nums ${network.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {network.totalProfit >= 0 ? '+' : ''}{fBRL(network.totalProfit)}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">Lucro Total</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recomendações Automatizadas ──────────────────────────────────────── */}
      {networkData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/60">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Recomendações Automatizadas</h2>
            <span className="ml-auto text-[10px] text-muted-foreground">
              Geradas pelo score inteligente
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {networkData.map(n => {
              const rec     = recConfig[n.recommendationType];
              const RecIcon = rec.Icon;

              // borda/bg dinâmicos baseados no tipo
              const borderCls =
                n.recommendationType === 'increase' ? 'border-success/20 bg-success/5'       :
                n.recommendationType === 'maintain' ? 'border-primary/20 bg-primary/5'       :
                n.recommendationType === 'monitor'  ? 'border-warning/20 bg-warning/5'       :
                n.recommendationType === 'reduce'   ? 'border-orange-400/20 bg-orange-400/5' :
                'border-destructive/20 bg-destructive/5';

              return (
                <div key={n.id} className={`rounded-xl border p-4 flex items-start gap-3 hover:bg-accent/5 transition-colors ${borderCls}`}>
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${rec.cls}`}>
                    <RecIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-foreground text-sm">{n.name}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${rec.cls}`}>
                        {rec.label}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{n.recommendationDetail}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] tabular-nums flex-wrap">
                      <span className={`font-bold ${n.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ROI {fPerc(n.roi)}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">Win {n.winRate}%</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{fBRL(n.profitPerConta)}/cta</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">Score <span className="text-foreground font-semibold">{n.score}</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Networks;
