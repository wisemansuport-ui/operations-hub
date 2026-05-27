import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSyncedState } from '../hooks/useSyncedState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { PeriodFilter, DateFilter, buildDateFilter, isInRange } from '@/components/ui/period-filter';
import { Target, Rocket, Edit3, Plus, Trash2, Check, TrendingUp, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../contexts/NotificationContext';
import { pushNotify } from '../lib/notifications';

import { useFirestoreData } from '../hooks/useFirestoreData';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number; // will be ignored and synced to receitaMensal
  createdAt: number;
  notified?: boolean;
}

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function useAnimatedNumber(value: number, duration = 1200) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const delta = value - start;
    if (delta === 0) return;
    const startTime = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTime) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + delta * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return display;
}

const STARS = Array.from({ length: 80 }).map(() => ({
  size: Math.random() * 1.8 + 0.4,
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 4,
  duration: 2 + Math.random() * 4,
  opacity: 0.25 + Math.random() * 0.6,
  hue: Math.random() > 0.7 ? 'cyan' : Math.random() > 0.5 ? 'violet' : 'white',
}));

const RocketSVG: React.FC<{ reached: boolean }> = ({ reached }) => (
  <svg width="56" height="56" viewBox="0 0 64 64" fill="none" className="drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]">
    <defs>
      <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={reached ? '#34d399' : '#e0e7ff'} />
        <stop offset="50%" stopColor={reached ? '#10b981' : '#a5b4fc'} />
        <stop offset="100%" stopColor={reached ? '#059669' : '#6366f1'} />
      </linearGradient>
      <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={reached ? '#10b981' : '#6366f1'} />
        <stop offset="100%" stopColor={reached ? '#047857' : '#4338ca'} />
      </linearGradient>
    </defs>
    <path d="M20 42 L14 54 L24 48 Z" fill="url(#finGrad)" />
    <path d="M44 42 L50 54 L40 48 Z" fill="url(#finGrad)" />
    <path d="M32 6 C24 14 22 24 22 34 L22 48 L42 48 L42 34 C42 24 40 14 32 6 Z" fill="url(#bodyGrad)" />
    <circle cx="32" cy="26" r="5" fill="url(#windowGrad)" stroke="#1e293b" strokeWidth="1.5" />
    <circle cx="30.5" cy="24.5" r="1.5" fill="#ffffff" opacity="0.8" />
    <path d="M26 16 C25 22 24.5 28 24.5 34 L24.5 46" stroke="#ffffff" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
    <rect x="22" y="46" width="20" height="3" fill={reached ? '#047857' : '#4338ca'} rx="1" />
  </svg>
);

const RocketProgress: React.FC<{ percent: number }> = ({ percent }) => {
  const clamped = Math.min(100, Math.max(0, percent));
  const animated = useAnimatedNumber(clamped);
  const reached = clamped >= 100;
  const milestones = [25, 50, 75];

  return (
    <div
      className="relative w-full h-80 rounded-2xl overflow-hidden border border-white/10"
      style={{
        background:
          'radial-gradient(ellipse at 50% 110%, rgba(99,102,241,0.35) 0%, transparent 55%), radial-gradient(ellipse at 20% 10%, rgba(34,211,238,0.18) 0%, transparent 50%), radial-gradient(ellipse at 85% 20%, rgba(168,85,247,0.15) 0%, transparent 50%), linear-gradient(180deg, #05060f 0%, #0a0d1f 60%, #0d1230 100%)',
        boxShadow: 'inset 0 0 60px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      <div className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: s.size + 'px',
              height: s.size + 'px',
              left: s.left + '%',
              top: s.top + '%',
              opacity: s.opacity,
              background: s.hue === 'cyan' ? '#67e8f9' : s.hue === 'violet' ? '#c4b5fd' : '#ffffff',
              animation: `pulse ${s.duration}s ease-in-out ${s.delay}s infinite`,
              boxShadow:
                s.hue === 'cyan' ? '0 0 6px #22d3ee' : s.hue === 'violet' ? '0 0 6px #a78bfa' : '0 0 4px #ffffff',
            }}
          />
        ))}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-6 bottom-6 w-[2px]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 via-white/10 to-white/5" />
        <div
          className="absolute left-0 right-0 bottom-0 rounded-full transition-all duration-1000 ease-out"
          style={{
            height: `${animated}%`,
            background: reached
              ? 'linear-gradient(to top, #10b981, #34d399, #6ee7b7)'
              : 'linear-gradient(to top, #6366f1, #8b5cf6, #22d3ee)',
            boxShadow: reached
              ? '0 0 16px rgba(16,185,129,0.7), 0 0 32px rgba(16,185,129,0.3)'
              : '0 0 16px rgba(99,102,241,0.7), 0 0 32px rgba(139,92,246,0.4)',
          }}
        />
        {milestones.map(m => {
          const passed = animated >= m;
          return (
            <div key={m} className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${m}%` }}>
              <div
                className="w-2.5 h-2.5 rounded-full border-2 transition-all duration-500"
                style={{
                  background: passed ? '#a5b4fc' : 'rgba(15,18,40,0.9)',
                  borderColor: passed ? '#8b5cf6' : 'rgba(255,255,255,0.15)',
                  boxShadow: passed ? '0 0 10px #8b5cf6, 0 0 4px #ffffff' : 'none',
                }}
              />
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-mono tracking-widest"
                style={{ color: passed ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.3)' }}
              >
                {m}%
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="absolute left-1/2 transition-all duration-1000 ease-out z-10"
        style={{ bottom: `calc(${animated}% * 0.78 + 20px)`, transform: 'translateX(-50%)' }}
      >
        <div className="relative">
          <div
            className="absolute inset-0 -m-8 rounded-full blur-2xl animate-pulse"
            style={{
              background: reached
                ? 'radial-gradient(circle, rgba(16,185,129,0.5), transparent 70%)'
                : 'radial-gradient(circle, rgba(99,102,241,0.55), rgba(34,211,238,0.25) 50%, transparent 70%)',
            }}
          />
          <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-2 pointer-events-none">
            <div className="relative w-4 h-16">
              <div
                className="absolute inset-x-0 top-0 h-full rounded-full blur-md animate-pulse"
                style={{
                  background: 'linear-gradient(to bottom, #22d3ee 0%, #8b5cf6 40%, transparent 100%)',
                  opacity: 0.85,
                }}
              />
              <div
                className="absolute inset-x-1 top-0 h-3/4 rounded-full"
                style={{ background: 'linear-gradient(to bottom, #ffffff, #67e8f9 30%, #a78bfa 70%, transparent)' }}
              />
            </div>
          </div>
          {!reached && animated > 3 &&
            [0, 1, 2, 3].map(i => (
              <span
                key={i}
                className="absolute left-1/2 top-full w-1 h-1 rounded-full"
                style={{
                  transform: `translate(${-50 + (i % 2 === 0 ? -8 : 8)}%, ${14 + i * 8}px)`,
                  background: i % 2 ? '#22d3ee' : '#a78bfa',
                  boxShadow: i % 2 ? '0 0 6px #22d3ee' : '0 0 6px #a78bfa',
                  opacity: 0.7 - i * 0.15,
                  animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          <RocketSVG reached={reached} />
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-3 flex flex-col items-center gap-1">
        <div
          className="w-24 h-[3px] rounded-full"
          style={{
            background: reached
              ? 'linear-gradient(90deg, transparent, #10b981, transparent)'
              : 'linear-gradient(90deg, transparent, #22d3ee, #8b5cf6, transparent)',
            boxShadow: reached ? '0 0 12px #10b981' : '0 0 12px #22d3ee',
          }}
        />
        <span
          className="text-[9px] font-mono font-bold tracking-[0.2em]"
          style={{ color: reached ? '#34d399' : '#a5b4fc' }}
        >
          META · 100%
        </span>
      </div>

      <div
        className="absolute top-3 right-3 px-3.5 py-2 rounded-xl backdrop-blur-xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          borderColor: 'rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="text-[9px] font-mono tracking-widest mb-0.5" style={{ color: 'rgba(196,181,253,0.7)' }}>
          PROGRESSO
        </div>
        <div
          className="text-2xl font-extrabold tabular-nums leading-none"
          style={{
            background: reached
              ? 'linear-gradient(135deg, #34d399, #10b981)'
              : 'linear-gradient(135deg, #67e8f9, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {animated.toFixed(1)}
          <span className="text-sm opacity-60">%</span>
        </div>
      </div>

      {reached && (
        <div
          className="absolute top-3 left-3 px-3 py-2 rounded-xl backdrop-blur-xl flex items-center gap-1.5 animate-fade-in border"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.05))',
            borderColor: 'rgba(52,211,153,0.4)',
            boxShadow: '0 0 24px rgba(16,185,129,0.4)',
          }}
        >
          <Trophy className="w-4 h-4" style={{ color: '#34d399' }} />
          <span className="text-xs font-extrabold tracking-wider" style={{ color: '#6ee7b7' }}>
            CONQUISTADO
          </span>
        </div>
      )}

      <div
        className="absolute bottom-0 inset-x-0 h-16 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(99,102,241,0.25), rgba(139,92,246,0.08) 50%, transparent)',
        }}
      />
    </div>
  );
};

export default function Goals() {
  const [goals, setGoals] = useSyncedState<Goal[]>('nytzer-goals', []);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const { addNotification } = useNotifications();
  const { metas, costs, users } = useFirestoreData();
  const [role] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const operatorName = user?.username || 'Operador Central';

  const [dateFilter, setDateFilter] = useState<DateFilter>(buildDateFilter('MES'));
  const notifiedRef = useRef<Set<string>>(new Set());

  const receitaMensal = useMemo(() => {
    let totalDepositado = 0;
    let totalSacado = 0;
    let totalSalarios = 0;
    let totalAutoSalarios = 0;

    for (const meta of metas) {
      if (meta.status === 'lixeira') continue;
      const isFechada = meta.status === 'fechada';
      if (!isFechada) continue;

      // Same visibility logic as Dashboard
      let isVisible = false;
      if (role === 'ADMIN') {
        isVisible = meta.operador === operatorName ||
                    (users.find((u: any) => u.username === meta.operador)?.affiliatedTo === operatorName) ||
                    (!meta.operador && operatorName === 'wiseman');
      } else {
        isVisible = meta.operador === operatorName;
      }
      if (!isVisible) continue;
      
      const remessas = meta.remessas || [];
      let lastDate = new Date(meta.createdAt);
      remessas.forEach(r => {
        const rd = new Date(r.data || meta.createdAt);
        if (rd > lastDate) lastDate = rd;
      });
      const isMetaInPeriod = isInRange(lastDate, dateFilter);
      if (!isMetaInPeriod) continue;

      const sal = Number(meta.salarioOperador) || 0;
      const pagOp = Number(meta.pagamentoOperador) || 0;

      let metaAutoSalarios = 0;
      remessas.forEach(r => {
        totalDepositado += Number(r.deposito || 0);
        totalSacado += Number(r.saque || 0);
        
        const normais = (r as any).contasNormais || 0;
        const baixas = (r as any).contasBaixas || 0;
        
        if (!meta.isAdminMeta && meta.modelo !== 'Recarga') {
          metaAutoSalarios += (normais * 2) + (baixas * 1);
        }
      });
      
      totalSalarios += sal;
      if (!meta.isAdminMeta) {
        if (meta.modelo === 'Recarga') {
          totalAutoSalarios += pagOp;
        } else {
          totalAutoSalarios += metaAutoSalarios;
        }
      }
    }

    let totalCustos = 0;
    for (const cost of costs) {
       const costDate = cost.date ? new Date(cost.date + 'T12:00:00') : new Date(cost.createdAt);
       if (isInRange(costDate, dateFilter)) {
         totalCustos += Number(cost.amount || 0);
       }
    }

    const lucroBruto = totalSacado - totalDepositado;
    const lucroOperacional = lucroBruto + totalSalarios - totalAutoSalarios;
    return lucroOperacional - totalCustos;
  }, [metas, costs, users, role, operatorName, dateFilter]);

  useEffect(() => {
    goals.forEach(g => {
      const reached = g.target > 0 && receitaMensal >= g.target;
      if (reached && !g.notified && !notifiedRef.current.has(g.id)) {
        notifiedRef.current.add(g.id);
        toast.success(`🎯 Meta atingida: ${g.title}!`, {
          description: `Você alcançou ${formatBRL(g.target)}. Parabéns!`,
        });
        addNotification({
          title: '🎯 Meta atingida!',
          message: `${g.title} — ${formatBRL(g.target)} alcançados.`,
          type: 'success',
          targetRole: 'ALL',
        });
        pushNotify('🎯 Meta atingida!', `${g.title} — ${formatBRL(g.target)} alcançados.`);
        setGoals(prev => prev.map(x => (x.id === g.id ? { ...x, notified: true } : x)));
      }
    });
  }, [goals, receitaMensal, addNotification, setGoals]);

  const addGoal = () => {
    const t = parseFloat(target.replace(',', '.'));
    if (!title.trim() || !t || t <= 0) {
      toast.error('Informe título e valor da meta');
      return;
    }
    setGoals(prev => [
      { id: crypto.randomUUID(), title: title.trim(), target: t, current: 0, createdAt: Date.now() },
      ...prev,
    ]);
    setTitle('');
    setTarget('');
    toast.success('Meta criada');
  };

  const removeGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const totals = useMemo(() => {
    const target = goals.reduce((s, g) => s + g.target, 0);
    // current is now the dashboard's receitaMensal
    const current = receitaMensal;
    const reached = goals.filter(g => receitaMensal >= g.target).length;
    return { target, current, reached, pct: target ? (current / target) * 100 : 0 };
  }, [goals, receitaMensal]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in relative z-10 w-full text-foreground">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Objetivos</h1>
            <p className="text-sm text-muted-foreground mt-1">Defina metas e acompanhe o progresso em tempo real.</p>
          </div>
        </div>
        <PeriodFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Metas ativas', value: goals.length, tone: 'text-foreground' },
          { label: 'Concluídas', value: totals.reached, tone: 'text-success' },
          { label: 'Total acumulado', value: formatBRL(totals.current), tone: 'text-primary' },
          { label: 'Total alvo', value: formatBRL(totals.target), tone: 'text-warning' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{s.label}</p>
            <p className={`text-xl font-bold tabular-nums tracking-tight ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Nova meta</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Estipule um valor para atingir</p>
              </div>
            </div>

            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Título</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Faturamento de Maio"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 mb-3"
            />

            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Valor da meta (R$)</label>
            <input
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="10000"
              inputMode="decimal"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 mb-4"
            />

            <button
              onClick={addGoal}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar meta
            </button>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-8 space-y-4">
          {goals.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
              <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma meta criada. Comece estipulando um objetivo ao lado.</p>
            </div>
          )}

          {goals.map(g => {
            const pct = g.target > 0 ? (receitaMensal / g.target) * 100 : 0;
            const reached = pct >= 100;
            return (
              <div key={g.id} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-foreground truncate">{g.title}</h3>
                      {reached && <Trophy className="w-4 h-4 text-success shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatBRL(Math.min(receitaMensal, g.target))} de {formatBRL(g.target)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeGoal(g.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RocketProgress percent={pct} />

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                        Progresso atual
                      </label>
                      <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background transition-colors text-sm">
                        <span className="font-semibold text-foreground tabular-nums">{formatBRL(receitaMensal)}</span>
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-background p-3 mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Restante
                        </span>
                        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className={`text-lg font-bold tabular-nums ${reached ? 'text-success' : 'text-foreground'}`}>
                        {reached ? 'Meta atingida!' : formatBRL(Math.max(0, g.target - receitaMensal))}
                      </p>
                    </div>

                    <div className="h-2 rounded-full bg-border/50 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${reached ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
