import React, { useState, useEffect, useMemo } from 'react';
import { useSyncedState } from '../hooks/useSyncedState';
import { Target, Rocket, Edit3, Plus, Trash2, Check, TrendingUp, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  createdAt: number;
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

const RocketProgress: React.FC<{ percent: number }> = ({ percent }) => {
  const clamped = Math.min(100, Math.max(0, percent));
  const animated = useAnimatedNumber(clamped);
  const reached = clamped >= 100;

  return (
    <div className="relative w-full h-72 rounded-2xl border border-border bg-gradient-to-b from-background to-card/40 overflow-hidden">
      {/* stars */}
      <div className="absolute inset-0 opacity-50">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-foreground/40 animate-pulse"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
            }}
          />
        ))}
      </div>

      {/* track */}
      <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-1 bg-border/50 rounded-full" />

      {/* rocket */}
      <div
        className="absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-out"
        style={{ bottom: `calc(${animated}% * 0.85 + 8px)` }}
      >
        <div className="relative">
          <Rocket
            className={`w-12 h-12 ${reached ? 'text-success' : 'text-primary'} drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)]`}
            style={{ transform: 'rotate(-45deg)' }}
          />
          {/* flame */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-6 rounded-full bg-gradient-to-t from-transparent via-warning to-destructive blur-[2px] animate-pulse"
            style={{ transform: 'translateX(-50%) rotate(45deg) translateY(8px)' }}
          />
        </div>
      </div>

      {/* percent badge */}
      <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-card/80 backdrop-blur border border-border">
        <span className={`text-lg font-extrabold tabular-nums ${reached ? 'text-success' : 'text-primary'}`}>
          {animated.toFixed(1)}%
        </span>
      </div>

      {reached && (
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-success/20 border border-success/40 flex items-center gap-1.5 animate-fade-in">
          <Trophy className="w-4 h-4 text-success" />
          <span className="text-xs font-bold text-success">META ATINGIDA</span>
        </div>
      )}

      {/* finish line */}
      <div className="absolute left-1/2 -translate-x-1/2 top-3 w-16 h-1 bg-success/60 rounded-full" />
    </div>
  );
};

export default function Goals() {
  const [goals, setGoals] = useSyncedState<Goal[]>('nytzer-goals', []);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  const updateProgress = (id: string, value: number) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, current: Math.max(0, value) } : g)));
  };

  const totals = useMemo(() => {
    const target = goals.reduce((s, g) => s + g.target, 0);
    const current = goals.reduce((s, g) => s + Math.min(g.current, g.target), 0);
    const reached = goals.filter(g => g.current >= g.target).length;
    return { target, current, reached, pct: target ? (current / target) * 100 : 0 };
  }, [goals]);

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
            const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
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
                      {formatBRL(Math.min(g.current, g.target))} de {formatBRL(g.target)}
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
                      {editingId === g.id ? (
                        <div className="flex gap-2">
                          <input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            inputMode="decimal"
                            autoFocus
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                          />
                          <button
                            onClick={() => {
                              const v = parseFloat(editValue.replace(',', '.')) || 0;
                              updateProgress(g.id, v);
                              setEditingId(null);
                            }}
                            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(g.id);
                            setEditValue(String(g.current));
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background hover:border-primary/40 transition-colors text-sm"
                        >
                          <span className="font-semibold text-foreground tabular-nums">{formatBRL(g.current)}</span>
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[0.1, 0.25, 0.5].map(f => (
                        <button
                          key={f}
                          onClick={() => updateProgress(g.id, g.current + g.target * f)}
                          className="px-2 py-1.5 rounded-lg border border-border bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                        >
                          +{f * 100}%
                        </button>
                      ))}
                    </div>

                    <div className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Restante
                        </span>
                        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className={`text-lg font-bold tabular-nums ${reached ? 'text-success' : 'text-foreground'}`}>
                        {reached ? 'Meta atingida!' : formatBRL(Math.max(0, g.target - g.current))}
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
