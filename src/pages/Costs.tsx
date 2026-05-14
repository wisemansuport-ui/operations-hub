import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Wallet, TrendingDown, TrendingUp, X, Shield, MessageSquare,
  Camera, Bot, Server, DollarSign, Trash2, Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type CostType = 'proxy' | 'sms' | 'instagram' | 'bot' | 'vps' | 'outros';

interface CostEntry {
  id: string;
  type: CostType;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt?: any;
  operador?: string;
}

const COST_TYPES: { key: CostType; label: string; icon: any }[] = [
  { key: 'proxy', label: 'Proxy', icon: Shield },
  { key: 'sms', label: 'SMS', icon: MessageSquare },
  { key: 'instagram', label: 'Postagem Instagram', icon: Camera },
  { key: 'bot', label: 'Bot / Automação', icon: Bot },
  { key: 'vps', label: 'VPS / Servidor', icon: Server },
  { key: 'outros', label: 'Outros', icon: DollarSign },
];

const typeMeta = (t: CostType) => COST_TYPES.find(c => c.key === t)!;

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Costs = () => {
  const { metas } = useFirestoreData();
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const operatorName = user?.username || 'Admin';
  const role = user?.role || 'ADMIN';

  // modal
  const [open, setOpen] = useState(false);
  const [formType, setFormType] = useState<CostType>('proxy');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formNote, setFormNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'costs'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CostEntry));
      data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setCosts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const today = new Date();

  // Lucro bruto do dia (a partir de metas concluídas hoje)
  const lucroBrutoHoje = useMemo(() => {
    let total = 0;
    metas.forEach((m: any) => {
      if (!m.createdAt) return;
      const d = new Date(m.createdAt);
      if (!isSameDay(d, today)) return;
      const profit = Number(m.profit ?? m.lucro ?? 0);
      total += profit;
    });
    return total;
  }, [metas]);

  const custoDia = useMemo(
    () => costs.filter(c => c.date === format(today, 'yyyy-MM-dd'))
                .reduce((s, c) => s + Number(c.amount || 0), 0),
    [costs]
  );

  const custoMes = useMemo(
    () => costs.filter(c => {
      const d = new Date(c.date + 'T00:00:00');
      return isSameMonth(d, today);
    }).reduce((s, c) => s + Number(c.amount || 0), 0),
    [costs]
  );

  const lucroLiquidoHoje = lucroBrutoHoje - custoDia;
  const diasNoMes = today.getDate();
  const mediaDia = diasNoMes > 0 ? custoMes / diasNoMes : 0;

  const porTipo = useMemo(() => {
    const map = new Map<CostType, number>();
    COST_TYPES.forEach(t => map.set(t.key, 0));
    costs.forEach(c => {
      map.set(c.type, (map.get(c.type) || 0) + Number(c.amount || 0));
    });
    const arr = COST_TYPES.map(t => ({ ...t, value: map.get(t.key) || 0 }));
    arr.sort((a, b) => b.value - a.value);
    return arr;
  }, [costs]);

  const maxTipo = Math.max(1, ...porTipo.map(p => p.value));

  const resetForm = () => {
    setFormType('proxy');
    setFormAmount('');
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormNote('');
  };

  const handleAdd = async () => {
    const amount = parseFloat(formAmount.replace(',', '.'));
    if (!amount || amount <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'costs'), {
        type: formType,
        amount,
        date: formDate,
        note: formNote.trim() || null,
        createdAt: serverTimestamp(),
        operador: operatorName,
      });
      toast.success('Custo adicionado');
      resetForm();
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar custo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente apagar este custo?")) {
      try {
        await deleteDoc(doc(db, 'costs', id));
        toast.success('Custo removido');
      } catch {
        toast.error('Erro ao remover');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Custos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Proxy, SMS, bot, VPS e outros gastos operacionais
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-secondary to-card border border-border hover:border-primary/40 text-sm font-medium text-foreground transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
        >
          <Plus className="w-4 h-4" />
          Adicionar custo
        </button>
      </div>

      {/* Aviso quando vazio */}
      {!loading && costs.length === 0 && lucroBrutoHoje === 0 && (
        <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent px-4 py-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">
            Exemplo de operação em andamento — os dados reais começam quando você criar sua primeira meta.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Custo do dia"
          value={formatBRL(custoDia)}
          hint={lucroBrutoHoje === 0 ? 'sem lucro registrado hoje' : `de ${formatBRL(lucroBrutoHoje)} bruto`}
          icon={TrendingDown}
        />
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Lucro vs custo (hoje)</div>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lucro bruto</span>
                <span className="text-foreground font-medium">{formatBRL(lucroBrutoHoje)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custos</span>
                <span className="text-destructive font-medium">- {formatBRL(custoDia)}</span>
              </div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Lucro líquido</span>
                <span className={cn(
                  'text-lg font-bold tabular-nums',
                  lucroLiquidoHoje >= 0 ? 'text-primary' : 'text-destructive'
                )}>
                  {formatBRL(lucroLiquidoHoje)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <KpiCard
          label="Custo do mês"
          value={formatBRL(custoMes)}
          hint={`Média de ${formatBRL(mediaDia)}/dia`}
          icon={Wallet}
        />
      </div>

      {/* Custos por tipo */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Custos por tipo</h2>
        <div className="space-y-3">
          {porTipo.map(({ key, label, icon: Icon, value }) => {
            const pct = (value / maxTipo) * 100;
            return (
              <div key={key} className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 w-44 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-foreground/90">{label}</span>
                </div>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      value > 0
                        ? 'bg-gradient-to-r from-primary/80 to-primary'
                        : 'bg-border'
                    )}
                    style={{ width: `${value > 0 ? Math.max(pct, 6) : 0}%` }}
                  />
                </div>
                <div className="w-24 text-right text-sm font-medium tabular-nums text-foreground/90">
                  {formatBRL(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Histórico */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Histórico de custos</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Carregando…</div>
        ) : costs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Nenhum custo registrado. Clique em <span className="text-primary">"Adicionar custo"</span> para começar.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {costs.map(c => {
              const meta = typeMeta(c.type);
              const Icon = meta.icon;
              return (
                <div key={c.id} className="flex items-center gap-4 py-3 group">
                  <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-foreground">{meta.label}</div>
                      {c.operador && <span className="text-[10px] bg-muted/30 text-muted-foreground px-1.5 py-0.5 rounded uppercase">{c.operador}</span>}
                    </div>
                    {c.note && (
                      <div className="text-xs text-muted-foreground italic truncate">{c.note}</div>
                    )}
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-foreground/90 w-24 text-right">
                    {formatBRL(c.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground italic w-20 text-right">
                    {c.date ? format(new Date(c.date + 'T00:00:00'), 'dd/MM/yyyy') : '—'}
                  </div>
                  {(role === 'ADMIN' || c.operador === operatorName) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      aria-label="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="p-5">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Novo custo</h3>
                    <p className="text-xs text-muted-foreground">Registre um gasto operacional</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary border border-border hover:bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Tipo</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {COST_TYPES.map(({ key, label, icon: Icon }) => {
                      const active = formType === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setFormType(key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                            active
                              ? 'bg-primary/10 border-primary/40 text-primary'
                              : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Valor (R$)</label>
                  <div className="mt-2 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Data</label>
                  <div className="mt-2 relative">
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Nota (opcional)</label>
                  <textarea
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Descrição do custo..."
                    rows={3}
                    className="mt-2 w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary/90 to-primary text-primary-foreground font-semibold text-sm hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {saving ? 'Salvando…' : 'Adicionar custo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: any }) => (
  <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 relative overflow-hidden">
    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
    <div className="relative flex items-start justify-between">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
        <div className="mt-2 text-2xl font-bold text-foreground tabular-nums">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </div>
  </div>
);

export default Costs;
