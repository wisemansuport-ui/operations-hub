import React from 'react';
import { Radio, AlertCircle, Star } from "lucide-react";

interface NetworkData {
  id: string;
  rank: number;
  name: string;
  status: string;
  statusColor: string;
  score: number;
  scoreColor: string;
  metas: number;
  contas: number;
  mm: number;
  winRate: number;
  profitPerConta: number;
  totalProfit: number;
}

const networkData: NetworkData[] = [
  { id: '1', rank: 1, name: 'VOY', status: '↑ ALTA', statusColor: 'text-primary', score: 81, scoreColor: 'hsl(var(--primary))', metas: 1, contas: 50, mm: 2, winRate: 100, profitPerConta: 6.25, totalProfit: 312.80 },
  { id: '2', rank: 2, name: 'DY', status: '↑ ALTA', statusColor: 'text-primary', score: 72, scoreColor: 'hsl(var(--primary))', metas: 1, contas: 30, mm: 2, winRate: 100, profitPerConta: 7.49, totalProfit: 224.60 },
  { id: '3', rank: 3, name: 'W1', status: '↔ ESTAVEL', statusColor: 'text-yellow-500', score: 65, scoreColor: '#f59e0b', metas: 1, contas: 20, mm: 2, winRate: 100, profitPerConta: 7.41, totalProfit: 148.20 },
  { id: '4', rank: 4, name: 'OKOK', status: '↔ ESTAVEL', statusColor: 'text-yellow-500', score: 64, scoreColor: '#f59e0b', metas: 2, contas: 40, mm: 4, winRate: 50, profitPerConta: -3.60, totalProfit: -144.10 },
];

const CircularProgress = ({ score, color }: { score: number, color: string }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
      <svg className="transform -rotate-90 w-16 h-16">
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/30" />
        <circle 
          cx="32" cy="32" r={radius} 
          stroke={color} 
          strokeWidth="4" 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round" 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{score}</span>
        <span className="text-[8px] text-muted-foreground uppercase">Score</span>
      </div>
    </div>
  );
};

const Networks = () => {
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12 relative z-10 w-full">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-500/10 rounded-xl relative overflow-hidden shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
           <Radio className="w-6 h-6 text-red-500 relative z-10" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sistema Estratégico de Decisão</h1>
          <p className="text-sm text-muted-foreground mt-1">Heatmap de performance, scoring, eficiência e recomendações inteligentes por rede</p>
        </div>
      </div>

      {/* Alert */}
      <div className="glass-card bg-red-950/20 border-red-900/50 p-4 rounded-xl flex items-center gap-3 shadow-[0_0_10px_rgba(239,68,68,0.05)]">
        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        <p className="text-xs font-semibold text-red-400">Exemplo de operação em andamento — os dados reais começam quando você criar sua primeira meta.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border-blue-900/30 hover:border-blue-500/50 transition-colors bg-card/40 backdrop-blur-md">
          <p className="text-[10px] text-muted-foreground font-bold tracking-widest mb-3 uppercase">Total de Redes</p>
          <p className="text-3xl font-extrabold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">4</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-primary/30 hover:border-primary/50 transition-colors bg-card/40 backdrop-blur-md">
          <p className="text-[10px] text-muted-foreground font-bold tracking-widest mb-3 uppercase">Redes Lucrativas</p>
          <p className="text-3xl font-extrabold text-primary drop-shadow-[0_0_8px_rgba(201,168,76,0.4)]">3</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-green-900/30 hover:border-green-500/50 transition-colors bg-card/40 backdrop-blur-md">
          <p className="text-[10px] text-muted-foreground font-bold tracking-widest mb-3 uppercase">Lucro Total</p>
          <p className="text-3xl font-extrabold text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">R$ 829,70</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-purple-900/30 hover:border-purple-500/50 transition-colors bg-card/40 backdrop-blur-md">
          <p className="text-[10px] text-muted-foreground font-bold tracking-widest mb-3 uppercase">Score Médio</p>
          <p className="text-3xl font-extrabold text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]">71<span className="text-sm font-semibold text-muted-foreground">/100</span></p>
        </div>
      </div>

      {/* Ranking List */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-5 h-5 text-primary fill-primary/20 drop-shadow-[0_0_5px_hsl(var(--primary))]" />
          <h2 className="text-lg font-bold text-foreground">Ranking por Network Score</h2>
          <span className="text-xs font-semibold text-muted-foreground mt-1 ml-1">4 redes</span>
        </div>

        <div className="space-y-4">
          {networkData.map((network) => (
            <div key={network.id} className="glass-card py-5 px-6 rounded-2xl border-border/40 hover:bg-card/70 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
              
              {/* Subtle background glow based on score color */}
              <div 
                className="absolute top-1/2 -left-10 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity -translate-y-1/2 pointer-events-none"
                style={{ backgroundColor: network.scoreColor }}
              />

              <div className="flex items-center gap-6 w-full md:w-auto flex-1 relative z-10">
                <CircularProgress score={network.score} color={network.scoreColor} />
                
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-muted-foreground font-bold italic">#{network.rank}</span>
                    <span className="text-lg font-extrabold text-foreground tracking-tight">{network.name}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded bg-card/80 border border-border/80 font-bold uppercase tracking-wider ${network.statusColor}`}>
                      {network.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-3 font-medium">
                    <span><span className="text-foreground font-bold">{network.metas}</span> metas</span>
                    <span><span className="text-foreground font-bold">{network.contas}</span> contas</span>
                    <span><span className="text-foreground font-bold">{network.mm}</span> mm</span>
                    <span>win <span className="text-primary font-bold">{network.winRate}%</span></span>
                  </div>

                  <div className="w-full bg-border/40 rounded-full h-1 overflow-hidden mt-1 shadow-inner">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 relative" 
                      style={{ width: `${network.score}%`, backgroundColor: network.totalProfit >= 0 ? '#4ade80' : '#ef4444' }} 
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between md:flex-col md:items-end w-full md:w-auto pt-5 md:pt-0 border-t border-border/50 md:border-t-0 mt-3 md:mt-0 relative z-10">
                <p className="text-[11px] text-muted-foreground font-semibold mb-1 bg-card/50 px-2 py-1 rounded border border-border/30">
                  R$ {network.profitPerConta.toFixed(2).replace('.', ',')}/conta
                </p>
                <div className="text-right mt-1">
                  <p className={`text-xl font-extrabold drop-shadow-[0_0_5px_rgba(74,222,128,0.2)] ${network.totalProfit >= 0 ? 'text-green-400' : 'text-red-500 font-black'}`}>
                    {network.totalProfit >= 0 ? '+' : ''}R$ {network.totalProfit.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-bold tracking-[0.15em] uppercase hover:text-muted-foreground transition-colors">Lucro Total</p>
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
