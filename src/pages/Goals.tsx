import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSyncedState } from '../hooks/useSyncedState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Target, Edit3, Plus, Trash2, Check, TrendingUp, Trophy, Sparkles, BrainCircuit, Calendar, Infinity as InfinityIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../contexts/NotificationContext';
import { pushNotify } from '../lib/notifications';

import { useFirestoreData } from '../hooks/useFirestoreData';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number; // legacy, no longer used for live calc
  type: 'monthly' | 'custom';
  createdAt: number;
  closedAt?: number;
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
  hue: Math.random() > 0.7 ? 'primary' : Math.random() > 0.5 ? 'muted' : 'white',
}));

const RocketSVG: React.FC<{ reached: boolean }> = ({ reached }) => (
  <svg width="56" height="56" viewBox="0 0 64 64" fill="none" className={reached ? "drop-shadow-[0_0_15px_hsl(var(--success)/0.4)]" : "drop-shadow-[0_0_15px_hsl(var(--primary)/0.4)]"}>
    <defs>
      <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={reached ? 'hsl(var(--success))' : 'hsl(var(--primary))'} stopOpacity={0.5} />
        <stop offset="50%" stopColor={reached ? 'hsl(var(--success))' : 'hsl(var(--primary))'} stopOpacity={0.8} />
        <stop offset="100%" stopColor={reached ? 'hsl(var(--success))' : 'hsl(var(--primary))'} stopOpacity={1} />
      </linearGradient>
      <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
      </linearGradient>
      <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={reached ? 'hsl(var(--success))' : 'hsl(var(--primary))'} stopOpacity={0.9} />
        <stop offset="100%" stopColor={reached ? 'hsl(var(--success))' : 'hsl(var(--primary))'} stopOpacity={0.6} />
      </linearGradient>
    </defs>
    <path d="M20 42 L14 54 L24 48 Z" fill="url(#finGrad)" />
    <path d="M44 42 L50 54 L40 48 Z" fill="url(#finGrad)" />
    <path d="M32 6 C24 14 22 24 22 34 L22 48 L42 48 L42 34 C42 24 40 14 32 6 Z" fill="url(#bodyGrad)" />
    <circle cx="32" cy="26" r="5" fill="url(#windowGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />
    <circle cx="30.5" cy="24.5" r="1.5" fill="#ffffff" opacity="0.6" />
    <path d="M26 16 C25 22 24.5 28 24.5 34 L24.5 46" stroke="#ffffff" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
    <rect x="22" y="46" width="20" height="3" fill={reached ? 'hsl(var(--success))' : 'hsl(var(--primary))'} rx="1" />
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
          'radial-gradient(ellipse at 50% 110%, hsl(var(--primary)/0.05) 0%, transparent 55%), radial-gradient(ellipse at 20% 10%, hsl(var(--primary)/0.02) 0%, transparent 50%), linear-gradient(180deg, #05060f 0%, #0a0c10 60%, #0a0c10 100%)',
        boxShadow: 'inset 0 0 40px hsl(var(--primary)/0.03), inset 0 1px 0 rgba(255,255,255,0.02)',
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
              background: s.hue === 'primary' ? 'hsl(var(--primary))' : s.hue === 'muted' ? 'hsl(var(--primary)/0.4)' : '#ffffff',
              animation: `pulse ${s.duration}s ease-in-out ${s.delay}s infinite`,
              boxShadow:
                s.hue === 'primary' ? '0 0 4px hsl(var(--primary)/0.3)' : s.hue === 'muted' ? '0 0 4px hsl(var(--primary)/0.1)' : '0 0 2px #ffffff',
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
              ? 'linear-gradient(to top, hsl(var(--success)), hsl(var(--success)/0.5))'
              : 'linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary)/0.5))',
            boxShadow: reached
              ? '0 0 12px hsl(var(--success)/0.4), 0 0 24px hsl(var(--success)/0.1)'
              : '0 0 12px hsl(var(--primary)/0.4), 0 0 24px hsl(var(--primary)/0.1)',
          }}
        />
        {milestones.map(m => {
          const passed = animated >= m;
          return (
            <div key={m} className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${m}%` }}>
              <div
                className="w-2.5 h-2.5 rounded-full border-2 transition-all duration-500"
                style={{
                  background: passed ? 'hsl(var(--primary))' : 'rgba(15,18,40,0.9)',
                  borderColor: passed ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.1)',
                  boxShadow: passed ? '0 0 8px hsl(var(--primary)/0.3)' : 'none',
                }}
              />
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-mono tracking-widest"
                style={{ color: passed ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.2)' }}
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
                ? 'radial-gradient(circle, hsl(var(--success)/0.2), transparent 60%)'
                : 'radial-gradient(circle, hsl(var(--primary)/0.2), transparent 60%)',
            }}
          />
          <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-2 pointer-events-none">
            <div className="relative w-4 h-16">
              <div
                className="absolute inset-x-0 top-0 h-full rounded-full blur-md animate-pulse"
                style={{
                  background: 'linear-gradient(to bottom, hsl(var(--primary)) 0%, hsl(var(--primary)/0.2) 40%, transparent 100%)',
                  opacity: 0.6,
                }}
              />
              <div
                className="absolute inset-x-1 top-0 h-3/4 rounded-full"
                style={{ background: 'linear-gradient(to bottom, #ffffff, hsl(var(--primary)/0.8) 30%, transparent)' }}
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
                  background: i % 2 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.5)',
                  boxShadow: i % 2 ? '0 0 4px hsl(var(--primary)/0.4)' : '0 0 4px hsl(var(--primary)/0.2)',
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
              ? 'linear-gradient(90deg, transparent, hsl(var(--success)), transparent)'
              : 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
            boxShadow: reached ? '0 0 8px hsl(var(--success)/0.4)' : '0 0 8px hsl(var(--primary)/0.4)',
          }}
        />
        <span
          className="text-[9px] font-mono font-bold tracking-[0.2em]"
          style={{ color: reached ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}
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
        <div className="text-[9px] font-mono tracking-widest mb-0.5" style={{ color: 'hsl(var(--primary)/0.7)' }}>
          PROGRESSO
        </div>
        <div
          className="text-2xl font-extrabold tabular-nums leading-none"
          style={{
            background: reached
              ? 'linear-gradient(135deg, hsl(var(--success)), hsl(var(--success)/0.6))'
              : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))',
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
            'linear-gradient(to top, hsl(var(--primary)/0.08), transparent 50%)',
        }}
      />
    </div>
  );
};

export default function Goals() {
  const [goals, setGoals] = useSyncedState<Goal[]>('nytzer-goals', []);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [goalType, setGoalType] = useState<'monthly' | 'custom'>('monthly');

  const { addNotification } = useNotifications();
  const { metas, costs, users } = useFirestoreData();
  const [role] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const operatorName = user?.username || 'Operador Central';

  const notifiedRef = useRef<Set<string>>(new Set());

  // Function to determine if a date is within a given range
  const isDateInRange = (date: Date, start: Date, end: Date | null) => {
    if (date < start) return false;
    if (end && date > end) return false;
    return true;
  };

  // Memoize all transactions (net results mapped by date) for faster calculation per goal
  const transactions = useMemo(() => {
    const list: { date: Date, amount: number }[] = [];

    for (const meta of metas) {
      if (meta.status === 'lixeira') continue;
      const isFechada = meta.status === 'fechada';
      if (!isFechada) continue;

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
      const sal = Number(meta.salarioOperador) || 0;
      const pagOp = Number(meta.pagamentoOperador) || 0;
      const totalContasMeta = remessas.reduce((acc: any, r: any) => acc + Number(r.contas || 0), 0);

      remessas.forEach((r: any) => {
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

        const remessaDate = new Date(r.data || meta.createdAt);
        const lucroBruto = saq - dep;
        const lucroOp = lucroBruto + remSal - remAutoSal;

        list.push({ date: remessaDate, amount: lucroOp });
      });

      if (totalContasMeta === 0 && remessas.length === 0) {
        const metaDate = new Date(meta.createdAt);
        let lucroOp = sal;
        if (!meta.isAdminMeta && meta.modelo === 'Recarga') {
          lucroOp -= pagOp;
        }
        list.push({ date: metaDate, amount: lucroOp });
      }
    }

    for (const cost of costs) {
       const costDate = cost.date ? new Date(cost.date + 'T12:00:00') : new Date(cost.createdAt);
       list.push({ date: costDate, amount: -Number(cost.amount || 0) });
    }

    // sort by date ascending for easier cumulative operations
    list.sort((a, b) => a.date.getTime() - b.date.getTime());
    return list;
  }, [metas, costs, users, role, operatorName]);

  // Function to compute progress for a specific goal
  const computeGoalProgress = (g: Goal) => {
    let start: Date;
    let end: Date | null = null;
    
    // Fallback if type is missing (legacy)
    const type = g.type || 'monthly';

    if (type === 'monthly') {
      const gDate = new Date(g.createdAt);
      start = new Date(gDate.getFullYear(), gDate.getMonth(), 1);
      end = new Date(gDate.getFullYear(), gDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      start = new Date(g.createdAt);
      // until closed
      end = g.closedAt ? new Date(g.closedAt) : null;
    }

    let progress = 0;
    for (const tx of transactions) {
      if (isDateInRange(tx.date, start, end)) {
        progress += tx.amount;
      }
    }
    return progress;
  };

  const calculateAIForecast = (g: Goal, currentProgress: number) => {
    if (currentProgress <= 0 || currentProgress >= g.target) return null;
    
    const start = g.type === 'monthly' ? new Date(new Date(g.createdAt).getFullYear(), new Date(g.createdAt).getMonth(), 1).getTime() : g.createdAt;
    const now = Date.now();
    const daysActive = Math.max(1, (now - start) / (1000 * 60 * 60 * 24));
    
    const avgPerDay = currentProgress / daysActive;
    if (avgPerDay <= 0) return null; // No progress or negative

    const remaining = g.target - currentProgress;
    const daysLeft = Math.ceil(remaining / avgPerDay);
    return daysLeft;
  };

  // Map goals to their progress
  const goalsWithProgress = useMemo(() => {
    return goals.map(g => {
      const progress = computeGoalProgress(g);
      const forecastDays = calculateAIForecast(g, progress);
      return { ...g, progress, forecastDays };
    });
  }, [goals, transactions]);

  useEffect(() => {
    let updated = false;
    const newGoals = [...goals];

    goalsWithProgress.forEach(g => {
      const reached = g.target > 0 && g.progress >= g.target;
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
        
        const idx = newGoals.findIndex(x => x.id === g.id);
        if (idx >= 0) {
          newGoals[idx] = { ...newGoals[idx], notified: true };
          updated = true;
        }
      }
    });

    if (updated) {
      setGoals(newGoals);
    }
  }, [goalsWithProgress, addNotification, setGoals, goals]);

  const addGoal = () => {
    const t = parseFloat(target.replace(',', '.'));
    if (!title.trim() || !t || t <= 0) {
      toast.error('Informe título e valor da meta');
      return;
    }
    setGoals(prev => [
      { id: crypto.randomUUID(), title: title.trim(), target: t, current: 0, type: goalType, createdAt: Date.now() },
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
    const target = goalsWithProgress.reduce((s, g) => s + g.target, 0);
    const current = goalsWithProgress.reduce((s, g) => s + Math.max(0, g.progress), 0);
    const reached = goalsWithProgress.filter(g => g.progress >= g.target).length;
    return { target, current, reached, pct: target ? (current / target) * 100 : 0 };
  }, [goalsWithProgress]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in relative z-10 w-full text-foreground">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 blur-xl"></div>
            <Target className="w-6 h-6 text-primary relative z-10 drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-clip-text">
              Objetivos Inteligentes
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-primary/70" />
              Previsão algorítmica IA ativada em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Metas ativas', value: goals.length, tone: 'text-foreground', bg: 'bg-card/60' },
          { label: 'Concluídas', value: totals.reached, tone: 'text-success', bg: 'bg-success/5' },
          { label: 'Soma dos Progressos', value: formatBRL(totals.current), tone: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Total Alvo (Soma)', value: formatBRL(totals.target), tone: 'text-warning', bg: 'bg-warning/5' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border border-border ${s.bg} backdrop-blur p-5 shadow-sm transition-all hover:shadow-md`}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
              {s.label}
            </p>
            <p className={`text-2xl font-bold tabular-nums tracking-tight drop-shadow-sm ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 sticky top-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Nova meta</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Estipule um objetivo inteligente</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Título da Meta</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Faturamento de Maio"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Valor Alvo (R$)</label>
                <input
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  placeholder="10000"
                  inputMode="decimal"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium tabular-nums text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Período de Apuração</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-xl border border-border shadow-inner">
                  <button
                    onClick={() => setGoalType('monthly')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${goalType === 'monthly' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted/50'}`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Mensal
                  </button>
                  <button
                    onClick={() => setGoalType('custom')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${goalType === 'custom' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted/50'}`}
                  >
                    <InfinityIcon className="w-3.5 h-3.5" />
                    Contínua
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 px-1">
                  {goalType === 'monthly' ? 'A meta reinicia todo mês. Calcula apenas os resultados do mês atual.' : 'A meta acumula continuamente até atingir o alvo (fechar como batida).'}
                </p>
              </div>

              <button
                onClick={addGoal}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 mt-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <Target className="w-4 h-4" />
                Lançar Meta Inteligente
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-8 space-y-5">
          {goalsWithProgress.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card/30 p-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">Nenhum objetivo traçado</p>
              <p className="text-sm text-muted-foreground">Comece criando sua primeira meta para ativar a previsão IA.</p>
            </div>
          )}

          {goalsWithProgress.map(g => {
            const pct = g.target > 0 ? (g.progress / g.target) * 100 : 0;
            const reached = pct >= 100;
            
            return (
              <div key={g.id} className="rounded-3xl border border-border bg-card/60 backdrop-blur p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all"></div>
                
                <div className="flex items-start justify-between gap-3 mb-5 relative z-10">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-lg font-extrabold text-foreground truncate drop-shadow-sm">{g.title}</h3>
                      {reached && <Trophy className="w-4 h-4 text-success shrink-0" />}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${g.type === 'monthly' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary text-secondary-foreground border border-border'}`}>
                        {g.type === 'monthly' ? 'Mensal' : 'Contínua'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Progresso real filtrado em tempo real
                    </p>
                  </div>
                  <button
                    onClick={() => removeGoal(g.id)}
                    className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors bg-background border border-border shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                  <RocketProgress percent={pct} />

                  <div className="space-y-4 flex flex-col justify-center">
                    
                    {/* IA Forecast Badge */}
                    <div className="rounded-xl border border-border bg-background/50 p-4 relative overflow-hidden group/ai">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest drop-shadow-sm">
                          Previsão Inteligente IA
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground relative z-10">
                        {reached ? (
                          <span className="text-success font-bold flex items-center gap-1.5">
                            <Check className="w-4 h-4" /> Alvo alcançado com sucesso!
                          </span>
                        ) : g.forecastDays !== null ? (
                          <span className="flex items-center gap-1.5">
                            Estimativa para bater a meta: <strong className="text-primary text-base">~{g.forecastDays} dias</strong>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Coletando dados suficientes para prever...</span>
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border bg-background p-3.5 shadow-sm">
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                          Atualmente
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-foreground tabular-nums">{formatBRL(g.progress)}</span>
                          <TrendingUp className="w-3.5 h-3.5 text-primary opacity-70" />
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-background p-3.5 shadow-sm">
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                          Alvo Restante
                        </label>
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-bold tabular-nums ${reached ? 'text-success' : 'text-foreground'}`}>
                            {reached ? 'Batida!' : formatBRL(Math.max(0, g.target - g.progress))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden shadow-inner border border-border/50">
                        <div
                          className={`h-full transition-all duration-1000 ease-out relative ${reached ? 'bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]'}`}
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1.5 px-0.5">
                        <span className="text-[10px] font-semibold text-muted-foreground">0%</span>
                        <span className={`text-[11px] font-bold tabular-nums ${reached ? 'text-success' : 'text-primary'}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
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
