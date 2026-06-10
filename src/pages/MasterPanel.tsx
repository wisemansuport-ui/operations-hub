import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Crown, DollarSign, Calendar as CalendarIcon,
  Ban, CheckCircle2, CreditCard, Search, Plus, TrendingUp,
  Clock, Edit3, X, Shield, ShieldOff, Receipt, Download,
  ArrowUpRight, AlertCircle, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, isSameMonth, differenceInDays, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  collection, addDoc, updateDoc, doc, serverTimestamp,
  onSnapshot, query, orderBy, deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { Navigate } from 'react-router-dom';

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type Tab = 'overview' | 'clients' | 'billing';

const MasterPanel = () => {
  const { users } = useFirestoreData();
  const [payments, setPayments] = useState<any[]>([]);
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [billingFilter, setBillingFilter] = useState<'all' | 'thisMonth' | 'lastMonth'>('all');

  // Security check
  if (user?.username !== 'nytzer') {
    return <Navigate to="/app" replace />;
  }

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'subscription_payments'), orderBy('date', 'desc')),
      (snap) => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const admins = useMemo(
    () => users.filter(u => u.role === 'ADMIN' && u.username !== 'nytzer'),
    [users]
  );

  const filteredAdmins = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return admins;
    return admins.filter(a =>
      a.username?.toLowerCase().includes(s) ||
      a.fullName?.toLowerCase().includes(s) ||
      a.email?.toLowerCase().includes(s)
    );
  }, [admins, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const activeAdmins = admins.filter(a => {
      const exp = a.planExpiry ? new Date(a.planExpiry) : new Date(0);
      return isAfter(exp, now);
    });
    const expiringSoon = activeAdmins.filter(a => {
      const exp = new Date(a.planExpiry);
      const days = differenceInDays(exp, now);
      return days <= 7;
    }).length;

    const mrr = activeAdmins.reduce((acc, a) => acc + (a.planAmount || 500), 0);

    const currentMonthRevenue = payments.reduce((acc, p) => {
      const pDate = new Date(p.date + 'T12:00:00');
      return isSameMonth(pDate, now) ? acc + Number(p.amount) : acc;
    }, 0);

    const lastMonthRevenue = payments.reduce((acc, p) => {
      const pDate = new Date(p.date + 'T12:00:00');
      return isSameMonth(pDate, subMonths(now, 1)) ? acc + Number(p.amount) : acc;
    }, 0);

    const growth = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    return {
      activeCount: activeAdmins.length,
      totalAdmins: admins.length,
      expiringSoon,
      mrr,
      currentMonthRevenue,
      lastMonthRevenue,
      growth,
      totalRevenue: payments.reduce((acc, p) => acc + Number(p.amount), 0)
    };
  }, [admins, payments]);

  const monthlyData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const value = payments.reduce((acc, p) => {
        const pDate = new Date(p.date + 'T12:00:00');
        return isSameMonth(pDate, d) ? acc + Number(p.amount) : acc;
      }, 0);
      months.push({ label: format(d, 'MMM', { locale: ptBR }), value });
    }
    return months;
  }, [payments]);

  const maxMonthly = Math.max(...monthlyData.map(m => m.value), 1);

  const filteredPayments = useMemo(() => {
    const now = new Date();
    if (billingFilter === 'thisMonth') {
      return payments.filter(p => isSameMonth(new Date(p.date + 'T12:00:00'), now));
    }
    if (billingFilter === 'lastMonth') {
      return payments.filter(p => isSameMonth(new Date(p.date + 'T12:00:00'), subMonths(now, 1)));
    }
    return payments;
  }, [payments, billingFilter]);

  const handleBlock = async (admin: any) => {
    if (!window.confirm(`Bloquear o acesso de ${admin.username} imediatamente?`)) return;
    try {
      await updateDoc(doc(db, 'users', admin.id), {
        planExpiry: new Date(Date.now() - 1000).toISOString(),
        plan: 'blocked'
      });
      toast.success(`${admin.username} bloqueado.`);
    } catch (e) {
      toast.error('Erro ao bloquear.');
    }
  };

  const handleQuickRenew = async (admin: any, days: number) => {
    try {
      const current = admin.planExpiry ? new Date(admin.planExpiry) : new Date();
      const base = isAfter(current, new Date()) ? current : new Date();
      const newExpiry = new Date(base.getTime() + days * 86400000).toISOString();
      await updateDoc(doc(db, 'users', admin.id), {
        planExpiry: newExpiry,
        plan: 'active'
      });
      toast.success(`+${days} dias para ${admin.username}.`);
    } catch (e) {
      toast.error('Erro ao renovar.');
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Data', 'Cliente', 'Valor (R$)'],
      ...filteredPayments.map(p => [p.date, p.adminUsername, p.amount])
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faturamento-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Painel Nytzer</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Controle total de clientes, acessos e faturamento
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Sincronizado em tempo real
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 border border-border w-fit">
        {([
          { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
          { id: 'clients', label: 'Clientes', icon: Users },
          { id: 'billing', label: 'Faturamento', icon: Receipt }
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-all",
              tab === t.id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              label="MRR"
              value={formatBRL(stats.mrr)}
              sub={`${stats.activeCount} clientes ativos`}
              icon={DollarSign}
            />
            <KpiCard
              label="Faturamento (mês)"
              value={formatBRL(stats.currentMonthRevenue)}
              sub={
                stats.growth !== 0
                  ? `${stats.growth > 0 ? '+' : ''}${stats.growth.toFixed(1)}% vs mês anterior`
                  : 'Sem comparativo'
              }
              icon={CheckCircle2}
              accent={stats.growth >= 0}
            />
            <KpiCard
              label="Total de clientes"
              value={String(stats.totalAdmins)}
              sub={`${stats.activeCount} ativos · ${stats.totalAdmins - stats.activeCount} inativos`}
              icon={Users}
            />
            <KpiCard
              label="Expirando em 7 dias"
              value={String(stats.expiringSoon)}
              sub="Atenção a renovações"
              icon={Clock}
              warn={stats.expiringSoon > 0}
            />
          </div>

          {/* Monthly chart */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Faturamento (últimos 6 meses)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Total acumulado: {formatBRL(stats.totalRevenue)}</p>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-3 h-48">
              {monthlyData.map((m, i) => (
                <div key={i} className="flex flex-col items-center justify-end gap-2">
                  <div className="text-[10px] tabular-nums text-foreground font-semibold">
                    {m.value > 0 ? formatBRL(m.value).replace('R$', '').trim() : '—'}
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/40 transition-all"
                    style={{ height: `${(m.value / maxMonthly) * 100}%`, minHeight: m.value > 0 ? '6px' : '2px' }}
                  />
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring soon list */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Próximas a vencer
            </h2>
            <div className="space-y-2">
              {admins
                .filter(a => {
                  if (!a.planExpiry) return false;
                  const d = differenceInDays(new Date(a.planExpiry), new Date());
                  return d >= 0 && d <= 14;
                })
                .sort((a, b) => new Date(a.planExpiry).getTime() - new Date(b.planExpiry).getTime())
                .slice(0, 5)
                .map(a => {
                  const days = differenceInDays(new Date(a.planExpiry), new Date());
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border/50">
                      <div>
                        <div className="font-semibold text-sm text-foreground">{a.username}</div>
                        <div className="text-xs text-muted-foreground">
                          Vence em {days} {days === 1 ? 'dia' : 'dias'} · {format(new Date(a.planExpiry), 'dd MMM', { locale: ptBR })}
                        </div>
                      </div>
                      <button
                        onClick={() => setPaymentModal(a)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                      >
                        Renovar
                      </button>
                    </div>
                  );
                })}
              {admins.filter(a => a.planExpiry && differenceInDays(new Date(a.planExpiry), new Date()) <= 14 && differenceInDays(new Date(a.planExpiry), new Date()) >= 0).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">Nenhum vencimento próximo.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLIENTS */}
      {tab === 'clients' && (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredAdmins.length} de {admins.length} clientes
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] uppercase tracking-widest text-muted-foreground bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-l-lg">Cliente</th>
                  <th className="px-4 py-3 font-semibold text-center">Operadores</th>
                  <th className="px-4 py-3 font-semibold">Plano</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Vencimento</th>
                  <th className="px-4 py-3 font-semibold text-right rounded-r-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredAdmins.map(admin => {
                  const operatorCount = users.filter(u => u.affiliatedTo === admin.username).length;
                  const expDate = admin.planExpiry ? new Date(admin.planExpiry) : null;
                  const isActive = expDate && isAfter(expDate, new Date());
                  const daysLeft = expDate ? differenceInDays(expDate, new Date()) : null;
                  const planAmount = admin.planAmount || 500;

                  return (
                    <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{admin.username}</div>
                        {admin.fullName && <div className="text-xs text-muted-foreground">{admin.fullName}</div>}
                      </td>
                      <td className="px-4 py-3 text-center text-foreground font-medium">{operatorCount}</td>
                      <td className="px-4 py-3 text-foreground tabular-nums">{formatBRL(planAmount)}/mês</td>
                      <td className="px-4 py-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                            <Ban className="w-3.5 h-3.5" /> {expDate ? 'Expirado' : 'Sem plano'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {expDate ? (
                          <div>
                            <div className="text-foreground text-sm">{format(expDate, "dd/MM/yyyy", { locale: ptBR })}</div>
                            {daysLeft !== null && (
                              <div className={cn(
                                "text-xs",
                                daysLeft < 0 ? "text-destructive" : daysLeft <= 7 ? "text-amber-400" : "text-muted-foreground"
                              )}>
                                {daysLeft < 0 ? `Há ${Math.abs(daysLeft)}d` : `Em ${daysLeft}d`}
                              </div>
                            )}
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPaymentModal(admin)}
                            title="Registrar pagamento"
                            className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingAdmin(admin)}
                            title="Editar acesso e plano"
                            className="p-2 rounded-lg bg-secondary text-foreground border border-border hover:bg-secondary/70"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {isActive ? (
                            <button
                              onClick={() => handleBlock(admin)}
                              title="Bloquear acesso"
                              className="p-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
                            >
                              <ShieldOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleQuickRenew(admin, 30)}
                              title="Liberar 30 dias"
                              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BILLING */}
      {tab === 'billing' && (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">Histórico de pagamentos</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/40 border border-border">
                {([
                  { id: 'all', label: 'Todos' },
                  { id: 'thisMonth', label: 'Este mês' },
                  { id: 'lastMonth', label: 'Mês anterior' }
                ] as const).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setBillingFilter(f.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium",
                      billingFilter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={exportCSV}
                className="px-3 py-1.5 rounded-lg bg-secondary text-foreground border border-border text-xs font-medium inline-flex items-center gap-1.5 hover:bg-secondary/70"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Selecionados</div>
              <div className="text-lg font-bold text-foreground mt-1">{filteredPayments.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</div>
              <div className="text-lg font-bold text-foreground mt-1 tabular-nums">
                {formatBRL(filteredPayments.reduce((a, p) => a + Number(p.amount), 0))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ticket médio</div>
              <div className="text-lg font-bold text-foreground mt-1 tabular-nums">
                {formatBRL(filteredPayments.length ? filteredPayments.reduce((a, p) => a + Number(p.amount), 0) / filteredPayments.length : 0)}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] uppercase tracking-widest text-muted-foreground bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-l-lg">Data</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold text-right">Valor</th>
                  <th className="px-4 py-3 font-semibold text-right rounded-r-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {format(new Date(p.date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">{p.adminUsername}</td>
                    <td className="px-4 py-3 text-right text-foreground font-semibold tabular-nums">
                      {formatBRL(Number(p.amount))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={async () => {
                          if (!window.confirm('Remover este lançamento?')) return;
                          await deleteDoc(doc(db, 'subscription_payments', p.id));
                          toast.success('Pagamento removido.');
                        }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum pagamento neste filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
        />
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <PaymentModal
          admin={paymentModal}
          onClose={() => setPaymentModal(null)}
        />
      )}
    </div>
  );
};

/* ---------- KPI Card ---------- */
const KpiCard = ({
  label, value, sub, icon: Icon, accent, warn
}: any) => (
  <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 relative overflow-hidden">
    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
    <div className="relative flex items-start justify-between">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
        <div className="mt-2 text-2xl font-bold text-foreground tabular-nums truncate">{value}</div>
        <div className={cn(
          "mt-1 text-xs",
          warn ? "text-amber-400" : accent ? "text-emerald-400" : "text-muted-foreground"
        )}>
          {sub}
        </div>
      </div>
      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </div>
  </div>
);

/* ---------- Edit Admin Modal ---------- */
const EditAdminModal = ({ admin, onClose }: { admin: any; onClose: () => void }) => {
  const [expiry, setExpiry] = useState(
    admin.planExpiry ? format(new Date(admin.planExpiry), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [amount, setAmount] = useState(String(admin.planAmount || 500));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', admin.id), {
        planExpiry: new Date(expiry + 'T23:59:59').toISOString(),
        planAmount: Number(amount) || 0,
        plan: isAfter(new Date(expiry + 'T23:59:59'), new Date()) ? 'active' : 'blocked'
      });
      toast.success('Acesso atualizado.');
      onClose();
    } catch {
      toast.error('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Editar acesso</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{admin.username}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Liberar até</label>
            <input
              type="date"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:border-primary"
            />
            <div className="flex gap-1.5 mt-2">
              {[7, 15, 30, 60, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setExpiry(format(new Date(Date.now() + d * 86400000), 'yyyy-MM-dd'))}
                  className="px-2 py-1 rounded-md bg-secondary text-xs text-foreground border border-border hover:bg-primary/10"
                >
                  +{d}d
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor mensal (R$)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:border-primary tabular-nums"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Payment Modal ---------- */
const PaymentModal = ({ admin, onClose }: { admin: any; onClose: () => void }) => {
  const [amount, setAmount] = useState(String(admin.planAmount || 500));
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [extendDays, setExtendDays] = useState('30');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const days = Number(extendDays) || 0;
      const current = admin.planExpiry ? new Date(admin.planExpiry) : new Date();
      const base = isAfter(current, new Date()) ? current : new Date();
      const newExpiry = new Date(base.getTime() + days * 86400000).toISOString();

      await updateDoc(doc(db, 'users', admin.id), {
        planExpiry: newExpiry,
        plan: 'active'
      });

      await addDoc(collection(db, 'subscription_payments'), {
        adminId: admin.id,
        adminUsername: admin.username,
        amount: Number(amount),
        date,
        createdAt: serverTimestamp()
      });

      toast.success('Pagamento registrado e acesso renovado.');
      onClose();
    } catch {
      toast.error('Erro ao registrar pagamento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Registrar pagamento</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{admin.username}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor (R$)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:border-primary tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data do pagamento</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estender acesso (dias)</label>
            <input
              type="number"
              value={extendDays}
              onChange={e => setExtendDays(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:border-primary tabular-nums"
            />
            <div className="flex gap-1.5 mt-2">
              {[30, 60, 90, 180, 365].map(d => (
                <button
                  key={d}
                  onClick={() => setExtendDays(String(d))}
                  className="px-2 py-1 rounded-md bg-secondary text-xs text-foreground border border-border hover:bg-primary/10"
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {saving ? 'Salvando...' : <><Plus className="w-4 h-4" /> Registrar</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterPanel;
