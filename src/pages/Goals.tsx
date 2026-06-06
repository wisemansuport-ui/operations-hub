import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSyncedState } from '../hooks/useSyncedState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Target, Plus, Trash2, TrendingUp, Trophy, Sparkles, Calendar, Infinity as InfinityIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../contexts/NotificationContext';
import { pushNotify } from '../lib/notifications';
import { GoalsHero } from '../components/heroes/GoalsHero';

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
       let isVisible = false;
       if (role === 'ADMIN') {
         isVisible = cost.operador === operatorName || 
                     (users.find(u => u.username === cost.operador)?.affiliatedTo === operatorName) ||
                     (!cost.operador && operatorName === 'wiseman');
       } else {
         isVisible = cost.operador === operatorName;
       }
       if (!isVisible) continue;

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
          targetUser: user?.username
        });
        pushNotify('🎯 Meta atingida!', `${g.title} — ${formatBRL(g.target)} alcançados.`, user?.username);
        
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

  const lucroGerado = useMemo(() => {
    const totalReachedProfit = goalsWithProgress
      .filter(g => g.progress >= g.target && g.target > 0)
      .reduce((s, g) => s + g.target, 0);
    return totalReachedProfit;
  }, [goalsWithProgress]);

  const taxa = goals.length > 0 ? (totals.reached / goals.length) * 100 : 0;
  const progressoGlobal = totals.target > 0 ? Math.min(100, (totals.current / totals.target) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in relative z-10 w-full text-foreground">
      <GoalsHero
        ativas={goals.length}
        concluidas={totals.reached}
        taxaConclusao={taxa}
        lucroGerado={formatBRL(lucroGerado)}
        progressoGlobal={progressoGlobal}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mission launcher */}
        <div data-tour="goals-launcher" className="lg:col-span-4">
          <div className="surface-2 hairline-gold rounded-2xl p-6 sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground tracking-tight">Lançar missão</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-widest font-bold">Construtor de Missões</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Codinome da Missão</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Escalar Rede VOY"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Alvo Operacional (R$)</label>
                <input
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  placeholder="10000"
                  inputMode="decimal"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium tabular-nums text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Janela de Apuração</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-xl border border-border">
                  <button
                    onClick={() => setGoalType('monthly')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${goalType === 'monthly' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted/50'}`}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Mensal
                  </button>
                  <button
                    onClick={() => setGoalType('custom')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${goalType === 'custom' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted/50'}`}
                  >
                    <InfinityIcon className="w-3.5 h-3.5" /> Contínua
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 px-1">
                  {goalType === 'monthly' ? 'A missão reinicia todo mês.' : 'A missão acumula continuamente até batida.'}
                </p>
              </div>

              <button
                onClick={addGoal}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 mt-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <Target className="w-4 h-4" /> Iniciar lançamento
              </button>
            </div>
          </div>
        </div>

        {/* Mission list */}
        <div data-tour="goals-forecast" className="lg:col-span-8 space-y-4">
          {goalsWithProgress.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card/30 p-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-bold text-foreground mb-1">Nenhuma missão em órbita</p>
              <p className="text-sm text-muted-foreground">Lance sua primeira missão para ativar o Motor de Decisão.</p>
            </div>
          )}

          {goalsWithProgress.map((g, idx) => {
            const pct = g.target > 0 ? (g.progress / g.target) * 100 : 0;
            const reached = pct >= 100;
            const remaining = Math.max(0, g.target - g.progress);
            const statusLabel = reached ? "CONCLUÍDA" : pct >= 60 ? "EM ROTA" : pct >= 20 ? "EM TRAJETÓRIA" : "INICIANDO";
            const statusTone = reached ? "text-success bg-success/10 border-success/30" : pct >= 60 ? "text-primary bg-primary/10 border-primary/30" : "text-muted-foreground bg-muted/30 border-border";
            return (
              <div key={g.id} className="surface-2 hairline-gold rounded-2xl p-5 md:p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none group-hover:bg-primary/[0.08] transition-all" />

                <div className="relative flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-primary/70">Missão</span>
                      <span className="text-sm font-black tabular-nums text-primary -mt-0.5">#{String(goalsWithProgress.length - idx).padStart(2, "0")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-foreground tracking-tight truncate">{g.title}</h3>
                        {reached && <Trophy className="w-4 h-4 text-success shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusTone}`}>{statusLabel}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-secondary text-muted-foreground border border-border">
                          {g.type === 'monthly' ? 'Mensal' : 'Contínua'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeGoal(g.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-border"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <div className="surface-1 rounded-xl p-3">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Atingido</p>
                    <p className="text-sm font-black tabular-nums text-foreground mt-0.5">{formatBRL(Math.max(0, g.progress))}</p>
                  </div>
                  <div className="surface-1 rounded-xl p-3">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Alvo</p>
                    <p className="text-sm font-black tabular-nums text-foreground mt-0.5">{formatBRL(g.target)}</p>
                  </div>
                  <div className="surface-1 rounded-xl p-3">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Restante</p>
                    <p className={`text-sm font-black tabular-nums mt-0.5 ${reached ? "text-success" : "text-foreground"}`}>{reached ? "—" : formatBRL(remaining)}</p>
                  </div>
                  <div className="surface-3 hairline-gold rounded-xl p-3">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-primary/80">Previsão IA</p>
                    <p className="text-sm font-black tabular-nums text-foreground mt-0.5">
                      {reached ? "Batida" : g.forecastDays != null ? `~${g.forecastDays}d` : "—"}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground inline-flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-primary" /> Trajetória
                    </span>
                    <span className={`text-sm font-black tabular-nums ${reached ? "text-success" : "text-primary"}`}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/60 overflow-hidden border border-border/50">
                    <div
                      className={`h-full transition-all duration-1000 ease-out relative ${reached ? 'bg-success' : 'bg-gradient-to-r from-primary/80 to-primary'}`}
                      style={{
                        width: `${Math.min(100, Math.max(0, pct))}%`,
                        boxShadow: reached ? "0 0 12px hsl(var(--success)/0.5)" : "0 0 12px hsl(var(--primary)/0.4)",
                      }}
                    >
                      <div className="absolute inset-0 bg-white/10 animate-pulse" />
                    </div>
                  </div>
                  {[25, 50, 75].map(m => (
                    <div key={m} className="absolute top-[26px] w-px h-2 bg-border/60" style={{ left: `${m}%` }} />
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl surface-1 border-primary/15">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="text-[11px] text-foreground/90">
                    {reached
                      ? <>Missão <span className="text-success font-bold">concluída</span> com sucesso. Pronto para o próximo lançamento.</>
                      : g.forecastDays != null
                        ? <>Estimativa de batida: <span className="text-primary font-bold">~{g.forecastDays} dias</span> mantendo o ritmo atual.</>
                        : <span className="text-muted-foreground">Coletando dados de trajetória para projeção IA.</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
