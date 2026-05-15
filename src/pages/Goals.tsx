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

const STARS = Array.from({ length: 60 }).map(() => ({
  size: Math.random() * 2 + 0.5,
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 4,
  duration: 2 + Math.random() * 3,
  opacity: 0.3 + Math.random() * 0.5,
}));

const RocketProgress: React.FC<{ percent: number }> = ({ percent }) => {
  const clamped = Math.min(100, Math.max(0, percent));
  const animated = useAnimatedNumber(clamped);
  const reached = clamped >= 100;
  const milestones = [25, 50, 75];

  return (
    <div
      className="relative w-full h-80 rounded-2xl overflow-hidden border border-border/60 shadow-[inset_0_0_40px_hsl(var(--primary)/0.08)]"
      style={{
        background:
          'radial-gradient(ellipse at 50% 100%, hsl(var(--primary)/0.18) 0%, transparent 60%), radial-gradient(ellipse at 30% 20%, hsl(var(--accent)/0.08) 0%, transparent 50%), linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)',
      }}
    >
      {/* nebula glow */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent pointer-events-none" />

      {/* stars */}
      <div className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-foreground"
            style={{
              width: s.size + 'px',
              height: s.size + 'px',
              left: s.left + '%',
              top: s.top + '%',
              opacity: s.opacity,
              animation: `pulse ${s.duration}s ease-in-out ${s.delay}s infinite`,
              boxShadow: '0 0 4px currentColor',
            }}
          />
        ))}
      </div>

      {/* track */}
      <div className="absolute left-1/2 -translate-x-1/2 top-6 bottom-6 w-[3px]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-border/30 via-border/60 to-border/30" />
        <div
          className={`absolute left-0 right-0 bottom-0 rounded-full transition-all duration-1000 ease-out ${
            reached
              ? 'bg-gradient-to-t from-success via-success/80 to-success/60'
              : 'bg-gradient-to-t from-primary via-primary/80 to-accent'
          }`}
          style={{
            height: `${animated}%`,
            boxShadow: reached
              ? '0 0 20px hsl(var(--success)/0.6)'
              : '0 0 20px hsl(var(--primary)/0.6)',
          }}
        />
        {milestones.map(m => {
          const passed = animated >= m;
          return (
            <div key={m} className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${m}%` }}>
              <div
                className={`w-2 h-2 rounded-full border transition-all duration-500 ${
                  passed
                    ? 'bg-primary border-primary shadow-[0_0_8px_hsl(var(--primary))]'
                    : 'bg-card border-border'
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground/60">
                {m}%
              </span>
            </div>
          );
        })}
      </div>

      {/* rocket */}
      <div
        className="absolute left-1/2 transition-all duration-1000 ease-out z-10"
        style={{ bottom: `calc(${animated}% * 0.78 + 24px)`, transform: 'translateX(-50%)' }}
      >
        <div className="relative">
          <div
            className={`absolute inset-0 -m-6 rounded-full blur-2xl ${
              reached ? 'bg-success/40' : 'bg-primary/40'
            } animate-pulse`}
          />
          <div
            className="absolute left-1/2 top-full -translate-x-1/2 -mt-1"
            style={{ transform: 'translateX(-50%) rotate(45deg)' }}
          >
            <div className="relative w-3 h-12">
              <div className="absolute inset-0 bg-gradient-to-b from-warning via-destructive to-transparent rounded-full blur-[3px] animate-pulse" />
              <div className="absolute inset-x-1 top-0 bottom-3 bg-gradient-to-b from-warning/90 to-transparent rounded-full" />
            </div>
          </div>
          {!reached && animated > 5 && (
            <>
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="absolute left-1/2 top-full w-1 h-1 rounded-full bg-warning"
                  style={{
                    transform: `translate(-50%, ${10 + i * 6}px) rotate(45deg)`,
                    opacity: 0.6 - i * 0.18,
                    animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </>
          )}
          <Rocket
            className={`relative w-14 h-14 ${
              reached ? 'text-success' : 'text-primary'
            } drop-shadow-[0_0_25px_hsl(var(--primary)/0.8)]`}
            strokeWidth={1.5}
            style={{ transform: 'rotate(-45deg)' }}
          />
        </div>
      </div>

      {/* finish line */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 top-3 w-20 h-1 rounded-full ${
          reached ? 'bg-success shadow-[0_0_12px_hsl(var(--success))]' : 'bg-success/60'
        }`}
      />
      <div className="absolute left-1/2 -translate-x-1/2 top-5 text-[9px] font-mono font-bold text-success/80 tracking-widest">
        META · 100%
      </div>

      {/* HUD */}
      <div className="absolute top-3 right-3 px-3 py-2 rounded-xl bg-card/70 backdrop-blur-md border border-border/60 shadow-lg">
        <div className="text-[9px] font-mono text-muted-foreground tracking-widest mb-0.5">PROGRESSO</div>
        <div className={`text-2xl font-extrabold tabular-nums leading-none ${reached ? 'text-success' : 'text-primary'}`}>
          {animated.toFixed(1)}<span className="text-sm opacity-60">%</span>
        </div>
      </div>

      {reached && (
        <div className="absolute top-3 left-3 px-3 py-2 rounded-xl bg-success/20 border border-success/50 backdrop-blur flex items-center gap-1.5 animate-fade-in shadow-[0_0_20px_hsl(var(--success)/0.4)]">
          <Trophy className="w-4 h-4 text-success" />
          <span className="text-xs font-extrabold text-success tracking-wider">CONQUISTADO</span>
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-primary/15 to-transparent pointer-events-none" />
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
      remessas.forEach(r => {
        const remessaDate = new Date(r.data || meta.createdAt);
        if (!isInRange(remessaDate, dateFilter)) return;

        totalDepositado += Number(r.deposito || 0);
        totalSacado += Number(r.saque || 0);
        
        const normais = (r as any).contasNormais || 0;
        const baixas = (r as any).contasBaixas || 0;
        if (!meta.isAdminMeta && meta.modelo !== 'Recarga') {
          totalAutoSalarios += (normais * 2) + (baixas * 1);
        }
      });
      
      const sal = Number(meta.salarioOperador) || 0;
      totalSalarios += sal;
      if (!meta.isAdminMeta && meta.modelo === 'Recarga') {
        totalAutoSalarios += Number(meta.pagamentoOperador) || 0;
      }
    }

    let totalCustos = 0;
    for (const cost of costs) {
       totalCustos += Number(cost.amount || 0);
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
