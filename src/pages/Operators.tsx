import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, Link as LinkIcon, Pencil, Trash2, Check, X, Crown, Trophy, Medal,
  TrendingUp, DollarSign, Target, UserCheck, Wallet, ArrowUpRight,
  Calendar as CalendarIcon, CheckCircle2, Search, BadgeCheck,
  History, Undo2, ChevronDown, User as UserIcon
} from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc, deleteDoc, setDoc, addDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useFirestoreData } from "../hooks/useFirestoreData";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

type PeriodKey = '7d' | '30d' | 'mes' | 'intervalo' | 'tudo';
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'mes', label: 'Mês atual' },
  { key: 'intervalo', label: 'Intervalo' },
  { key: 'tudo', label: 'Tudo' },
];

interface OperatorData {
  id: string;
  rank: number;
  initials: string;
  name: string;
  badge: string;
  badgeColor: string;
  deps: number;
  metas: number;
  profitPerConta: number;
  totalProfit: number;
  salary: number;          // total salary in period
  pendingSalary: number;   // not yet paid (after paidUntil)
  normais: number;
  baixas: number;
  pendingNormais: number;
  pendingBaixas: number;
}

interface PaymentRecord {
  id: string;
  paidUntil?: string;        // ISO
  lastPaidAmount?: number;
  lastPaidAt?: string;       // ISO
}

interface PaymentHistoryEntry {
  id: string;
  operatorId: string;
  operatorName: string;
  amount: number;
  paidAt: string;            // ISO
  paidBy: string;
  previousPaidUntil: string | null;
  newPaidUntil: string;
}

const TABS = ['Ranking', 'Equipe', 'Folha de pagamento', 'Configurações'] as const;

const Operators = () => {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Ranking');
  const { metas, users } = useFirestoreData();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const activeOperator = user?.username || 'admin';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [search, setSearch] = useState('');
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);
  const [history, setHistory] = useState<PaymentHistoryEntry[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [confirmUndoId, setConfirmUndoId] = useState<string | null>(null);

  // Subscribe to payment history
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'operatorPaymentHistory'), snap => {
      const list: PaymentHistoryEntry[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
      setHistory(list);
    });
    return () => unsub();
  }, []);

  const periodBounds = useMemo(() => {
    const now = new Date();
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    if (period === 'tudo') return null;
    if (period === '7d') {
      const s = new Date(now); s.setDate(s.getDate() - 6); s.setHours(0, 0, 0, 0);
      return { start: s, end };
    }
    if (period === '30d') {
      const s = new Date(now); s.setDate(s.getDate() - 29); s.setHours(0, 0, 0, 0);
      return { start: s, end };
    }
    if (period === 'mes') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start: s, end };
    }
    if (period === 'intervalo' && dateRange?.from) {
      const s = new Date(dateRange.from); s.setHours(0, 0, 0, 0);
      const e = new Date(dateRange.to || dateRange.from); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    return null;
  }, [period, dateRange]);

  const periodLabel = useMemo(() => {
    if (period === 'intervalo' && dateRange?.from) {
      const f = format(dateRange.from, 'dd MMM', { locale: ptBR });
      const t = dateRange.to ? format(dateRange.to, 'dd MMM', { locale: ptBR }) : f;
      return `${f} → ${t}`;
    }
    return PERIODS.find(p => p.key === period)?.label || '';
  }, [period, dateRange]);

  const affiliatedUsers = useMemo(
    () => users.filter(u => u.affiliatedTo === activeOperator),
    [users, activeOperator]
  );

  const handleStartEdit = (u: any) => {
    setEditingId(u.id);
    setEditingName(u.displayName || u.username);
  };

  const handleSaveName = async (u: any) => {
    if (!editingName.trim()) return;
    setLoadingAction(true);
    try {
      await updateDoc(doc(db, 'users', u.id), { displayName: editingName.trim() });
      toast.success(`Nome de "${u.username}" atualizado para "${editingName.trim()}"`);
      setEditingId(null);
    } catch { toast.error('Erro ao salvar nome.'); }
    finally { setLoadingAction(false); }
  };

  const handleDeleteOperator = async (u: any) => {
    setLoadingAction(true);
    try {
      await deleteDoc(doc(db, 'users', u.id));
      toast.success(`Operador "${u.displayName || u.username}" removido.`);
      setDeletingId(null);
    } catch { toast.error('Erro ao excluir operador.'); }
    finally { setLoadingAction(false); }
  };

  const handleMarkPaid = async (op: OperatorData) => {
    setLoadingAction(true);
    try {
      // Find the maximum meta.createdAt for this operator to prevent clock drift issues
      let maxMetaTime = Date.now();
      metas.forEach(m => {
        if (m.operador === op.id || m.operador === op.name) {
          const t = new Date(m.createdAt).getTime();
          if (t > maxMetaTime) maxMetaTime = t;
        }
      });
      const safePaidUntil = new Date(maxMetaTime + 1000).toISOString(); // Add 1 second

      const opHistory = history.filter(h => h.operatorId === op.id);
      const previousPaidUntil = opHistory.length > 0 ? opHistory[0].newPaidUntil : null;
      
      await addDoc(collection(db, 'operatorPaymentHistory'), {
        operatorId: op.id,
        operatorName: op.name,
        amount: op.pendingSalary,
        paidAt: new Date().toISOString(),
        paidBy: activeOperator,
        previousPaidUntil,
        newPaidUntil: safePaidUntil,
      });
      toast.success(`Pagamento de ${op.name} registrado: ${formatBRL(op.pendingSalary)}`);
      setConfirmPayId(null);
    } catch { toast.error('Erro ao registrar pagamento.'); }
    finally { setLoadingAction(false); }
  };

  const handleUndoLastPayment = async (op: OperatorData) => {
    setLoadingAction(true);
    try {
      const opHistory = history.filter(h => h.operatorId === op.id);
      if (opHistory.length === 0) {
        toast.error('Nenhum pagamento para desfazer.');
        return;
      }
      const last = opHistory[0];
      await deleteDoc(doc(db, 'operatorPaymentHistory', last.id));
      toast.success(`Último pagamento de ${op.name} desfeito (${formatBRL(last.amount)}).`);
      setConfirmUndoId(null);
    } catch { toast.error('Erro ao desfazer pagamento.'); }
    finally { setLoadingAction(false); }
  };

  const handleDeleteHistoryEntry = async (entry: PaymentHistoryEntry) => {
    setLoadingAction(true);
    try {
      await deleteDoc(doc(db, 'operatorPaymentHistory', entry.id));
      toast.success('Registro removido do histórico.');
    } catch { toast.error('Erro ao remover registro.'); }
    finally { setLoadingAction(false); }
  };

  const { operatorData, folhaTotal, folhaPendente, totalMetas, totalContas, totalLucroEquipe } = useMemo(() => {
    const opMap: Record<string, any> = {};
    let tmpFolhaTotal = 0;
    let tmpFolhaPendente = 0;
    let tmpTotalMetasCount = 0;
    let tmpTotalContasCount = 0;
    let tmpTotalLucroEquipe = 0;

    users.forEach(u => {
      if (u.affiliatedTo === activeOperator) {
        opMap[u.username] = { id: u.username, name: u.username, deps: 0, metas: 0, totalProfit: 0, normais: 0, baixas: 0, salary: 0, pendingSalary: 0, pendingNormais: 0, pendingBaixas: 0 };
      }
    });

    metas.forEach(meta => {
      if (meta.status !== 'fechada' || meta.isAdminMeta) return;
      const isAffiliated = (users.find(u => u.username === meta.operador)?.affiliatedTo === activeOperator);
      if (!isAffiliated) return;

      const metaTime = new Date(meta.createdAt).getTime();

      if (periodBounds) {
        if (isNaN(metaTime) || metaTime < periodBounds.start.getTime() || metaTime > periodBounds.end.getTime()) return;
      }

      const opName = meta.operador || 'Operador Central';
      if (!opMap[opName]) {
        opMap[opName] = { id: opName, name: opName, deps: 0, metas: 0, totalProfit: 0, normais: 0, baixas: 0, salary: 0, pendingSalary: 0, pendingNormais: 0, pendingBaixas: 0 };
      }

      let metaLucro = 0, metaNormais = 0, metaBaixas = 0, metaContas = 0;
      (meta.remessas || []).forEach((r: any) => {
        const normais = r.contasNormais || 0;
        const baixas = r.contasBaixas || 0;
        metaNormais += normais; metaBaixas += baixas;
        metaLucro += (r.saque - r.deposito);
        metaContas += r.contas;
      });

      const metaSalary = (metaNormais * 2) + (metaBaixas * 1);
      const faturamentoExtra = meta.salarioOperador ? Number(meta.salarioOperador) : 0;

      opMap[opName].deps += metaContas;
      opMap[opName].metas += 1;
      opMap[opName].totalProfit += (metaLucro + faturamentoExtra);
      opMap[opName].normais += metaNormais;
      opMap[opName].baixas += metaBaixas;
      opMap[opName].salary += metaSalary;

      // Pending check (after paidUntil)
      const opHistory = history.filter(h => h.operatorId === opName);
      const paidUntil = opHistory.length > 0 && opHistory[0].newPaidUntil ? new Date(opHistory[0].newPaidUntil).getTime() : 0;
      if (!paidUntil || metaTime > paidUntil) {
        opMap[opName].pendingSalary += metaSalary;
        opMap[opName].pendingNormais += metaNormais;
        opMap[opName].pendingBaixas += metaBaixas;
      }

      tmpFolhaTotal += metaSalary;
      tmpTotalMetasCount += 1;
      tmpTotalContasCount += metaContas;
      tmpTotalLucroEquipe += (metaLucro + faturamentoExtra);
    });

    const ranked = Object.values(opMap).map((op: any) => {
      const userRecord = users.find((u: any) => u.username === op.id);
      const displayName = userRecord?.displayName || op.name;
      const initials = displayName.substring(0, 2).toUpperCase();
      const profitPerConta = op.deps > 0 ? (op.totalProfit / op.deps) : 0;
      let badge = 'Em progressão';
      let badgeColor = 'text-success/80 border-success/30 bg-success/5';
      if (profitPerConta > 2 && op.totalProfit > 100) {
        badge = 'Top performer';
        badgeColor = 'text-primary border-primary/40 bg-primary/10';
      } else if (op.totalProfit < 0) {
        badge = 'Prejuízo';
        badgeColor = 'text-destructive border-destructive/40 bg-destructive/10';
      }
      return { ...op, name: displayName, initials, profitPerConta, badge, badgeColor };
    }).sort((a: any, b: any) => b.totalProfit - a.totalProfit) as OperatorData[];

    ranked.forEach((op, i) => op.rank = i + 1);
    tmpFolhaPendente = ranked.reduce((acc, o) => acc + o.pendingSalary, 0);

    return {
      operatorData: ranked,
      folhaTotal: tmpFolhaTotal,
      folhaPendente: tmpFolhaPendente,
      totalMetas: tmpTotalMetasCount,
      totalContas: tmpTotalContasCount,
      totalLucroEquipe: tmpTotalLucroEquipe
    };
  }, [metas, users, activeOperator, periodBounds, history]);

  const handleCopyLink = () => {
    const activeAdmin = user?.username || 'admin';
    const inviteLink = `${window.location.origin}/login?ref=${activeAdmin}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link único copiado!");
  };

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const maxProfit = Math.max(...operatorData.map(o => o.totalProfit), 1);

  const filteredOps = useMemo(() => {
    if (!search.trim()) return operatorData;
    const q = search.toLowerCase();
    return operatorData.filter(o => o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  }, [operatorData, search]);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-3 h-3" />;
    if (rank === 2) return <Trophy className="w-3 h-3" />;
    if (rank === 3) return <Medal className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-16 relative z-10 w-full">

      {/* Minimal header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">EQUIPE OPERACIONAL</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Operadores</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Performance, ranking e folha de pagamento em tempo real.</p>
        </div>
        <button
          onClick={handleCopyLink}
          className="group inline-flex items-center gap-2 self-start sm:self-auto bg-foreground/[0.04] hover:bg-foreground/[0.08] text-foreground border border-border/60 hover:border-primary/40 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
        >
          <LinkIcon className="w-4 h-4 text-primary" />
          Gerar link de cadastro
          <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Tabs — minimal underline */}
      <div className="flex items-center gap-1 border-b border-border/40 overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
                active ? 'text-foreground' : 'text-muted-foreground/70 hover:text-foreground'
              }`}
            >
              {tab}
              {active && <span className="absolute left-3 right-3 -bottom-px h-[2px] bg-primary rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* Period filter */}
      {activeTab !== 'Configurações' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-0.5 p-1 rounded-lg border border-border/50 bg-card/30">
              {PERIODS.filter(p => p.key !== 'intervalo').map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    period === p.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all",
                    period === 'intervalo'
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/50 bg-card/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {period === 'intervalo' && dateRange?.from ? periodLabel : 'Intervalo'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(r) => { setDateRange(r); if (r?.from) setPeriod('intervalo'); }}
                  numberOfMonths={2}
                  locale={ptBR}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            <span className="text-primary">{periodLabel}</span>
          </div>
        </div>
      )}

      {/* RANKING */}
      {activeTab === 'Ranking' && (
        <div className="space-y-6 animate-fade-in">

          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: UserCheck, label: 'Operadores', value: String(operatorData.length), tone: 'text-foreground' },
              { icon: Target, label: 'Metas', value: String(totalMetas), tone: 'text-foreground' },
              { icon: TrendingUp, label: 'Depositantes', value: String(totalContas), tone: 'text-foreground' },
              { icon: DollarSign, label: 'Lucro Equipe', value: formatBRL(totalLucroEquipe), tone: totalLucroEquipe >= 0 ? 'text-success' : 'text-destructive' },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 hover:border-border transition-all p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{k.label}</p>
                  <k.icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                </div>
                <p className={`text-2xl font-bold tracking-tight ${k.tone}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {operatorData.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-muted/20 border border-border/40 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-muted-foreground/60" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Nenhum operador na sua equipe</h3>
              <p className="text-xs text-muted-foreground mt-1.5">Use o botão acima para gerar um link de cadastro.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card/20 divide-y divide-border/40 overflow-hidden">
              {operatorData.map((op) => {
                const widthPct = op.totalProfit > 0 ? Math.max(8, (op.totalProfit / maxProfit) * 100) : 8;
                const isTop = op.rank === 1;
                return (
                  <div
                    key={op.id}
                    className="group relative px-5 py-4 hover:bg-foreground/[0.02] transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1 w-full min-w-0">
                        <div className="flex items-center justify-center w-10 shrink-0">
                          {op.rank <= 3 ? (
                            <span className={`inline-flex items-center gap-1 text-sm font-black ${
                              isTop ? 'text-primary' : op.rank === 2 ? 'text-foreground' : 'text-amber-700/80'
                            }`}>
                              {rankIcon(op.rank)}{op.rank}
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground/60">#{op.rank}</span>
                          )}
                        </div>

                        <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          isTop
                            ? 'bg-primary/15 border border-primary/40 text-primary'
                            : 'bg-muted/30 border border-border/60 text-foreground'
                        }`}>
                          {op.initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-foreground truncate">{op.name}</h3>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${op.badgeColor}`}>
                              {op.badge}
                            </span>
                          </div>
                          <div className="flex items-center gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground flex-wrap mt-1">
                            <span><span className="font-bold text-foreground">{op.deps}</span> deps</span>
                            <span><span className="font-bold text-foreground">{op.metas}</span> metas</span>
                            <span><span className="font-bold text-primary">{formatBRL(op.profitPerConta)}</span>/conta</span>
                          </div>
                          <div className="mt-2 h-[3px] w-full max-w-md rounded-full bg-border/40 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                op.totalProfit >= 0 ? 'bg-success' : 'bg-destructive'
                              }`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between lg:flex-col lg:items-end w-full lg:w-auto lg:min-w-[160px] lg:text-right">
                        <p className={`text-xl font-bold tracking-tight ${op.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {op.totalProfit >= 0 ? '+' : ''}{formatBRL(op.totalProfit)}
                        </p>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Lucro
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EQUIPE */}
      {activeTab === 'Equipe' && (
        <div className="animate-fade-in space-y-5">
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">Membros da equipe</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{affiliatedUsers.length} operador(es) vinculado(s).</p>
          </div>

          {affiliatedUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-muted/20 border border-border/40 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-muted-foreground/60" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Sua equipe está vazia</h3>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">Compartilhe o link de cadastro.</p>
              <button onClick={handleCopyLink} className="mt-5 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-bold text-xs transition-all">
                <LinkIcon className="w-3.5 h-3.5" /> Gerar link
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {affiliatedUsers.map(u => {
                const displayName = u.displayName || u.username;
                const initials = displayName.substring(0, 2).toUpperCase();
                const opStats = operatorData.find(o => o.id === u.username);
                return (
                  <div key={u.id} className="rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground text-sm truncate">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">@{u.username}</p>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40">
                      <div>
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Metas</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{opStats?.metas || 0}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Deps</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{opStats?.deps || 0}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Lucro</p>
                        <p className={`text-sm font-bold mt-0.5 ${(opStats?.totalProfit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatBRL(opStats?.totalProfit || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FOLHA DE PAGAMENTO */}
      {activeTab === 'Folha de pagamento' && (
        <div className="animate-fade-in space-y-5">

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] mb-1.5">Pendente de pagamento</p>
                  <p className="text-4xl font-bold text-foreground tracking-tight">{formatBRL(folhaPendente)}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    R$ 2,00 / dep. normal · R$ 1,00 / dep. baixo
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/30 p-6">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em] mb-1.5">Total no período</p>
              <p className="text-2xl font-bold text-foreground tracking-tight">{formatBRL(folhaTotal)}</p>
              <p className="text-xs text-muted-foreground mt-2">Inclui valores já pagos</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar operador..."
              className="w-full bg-card/30 border border-border/50 rounded-lg pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Operator payment cards */}
          {filteredOps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
              Nenhum operador encontrado.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOps.map(op => {
                const opHistory = history.filter(h => h.operatorId === op.id);
                const paidUntil = opHistory.length > 0 && opHistory[0].newPaidUntil ? opHistory[0].newPaidUntil : null;
                const isPaidUp = op.pendingSalary === 0 && (paidUntil || op.salary === 0);
                const isConfirm = confirmPayId === op.id;
                const isUndoConfirm = confirmUndoId === op.id;
                const lastPaidLabel = opHistory.length > 0 ? format(new Date(opHistory[0].paidAt), "dd MMM 'às' HH:mm", { locale: ptBR }) : null;
                const isExpanded = expandedHistory === op.id;
                const totalPaidAllTime = opHistory.reduce((s, h) => s + (h.amount || 0), 0);

                return (
                  <div key={op.id} className={`group rounded-xl border transition-all ${
                    isPaidUp
                      ? 'border-success/30 bg-success/[0.03]'
                      : 'border-border/50 bg-card/30 hover:bg-card/50 hover:border-border'
                  }`}>
                    <div className="flex items-center gap-4 flex-wrap p-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isPaidUp ? 'bg-success/15 border border-success/40 text-success' : 'bg-primary/10 border border-primary/30 text-primary'
                      }`}>
                        {op.initials}
                      </div>

                      <div className="flex-1 min-w-[180px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground text-sm">{op.name}</p>
                          {isPaidUp && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-success/40 bg-success/10 text-success">
                              <BadgeCheck className="w-2.5 h-2.5" /> Pago
                            </span>
                          )}
                          {opHistory.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-border/50 bg-muted/30 text-muted-foreground">
                              {opHistory.length} pgto{opHistory.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {op.metas} metas · {op.deps} deps
                          {lastPaidLabel && <span className="ml-2 text-success/80">· último pgto {lastPaidLabel}</span>}
                          {totalPaidAllTime > 0 && <span className="ml-2">· total pago {formatBRL(totalPaidAllTime)}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Total período</p>
                          <p className="text-sm font-bold text-foreground/80 mt-0.5">{formatBRL(op.salary)}</p>
                        </div>
                        <div className="text-right min-w-[90px]">
                          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">A pagar</p>
                          <p className={`text-lg font-bold tracking-tight mt-0.5 ${op.pendingSalary > 0 ? 'text-success' : 'text-muted-foreground/60'}`}>
                            {formatBRL(op.pendingSalary)}
                          </p>
                          <p className="text-[9px] text-muted-foreground/80 mt-0.5">
                            {op.pendingNormais}×R$2 · {op.pendingBaixas}×R$1
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isConfirm ? (
                            <>
                              <span className="text-[10px] font-bold text-success mr-1">Confirmar?</span>
                              <button
                                onClick={() => handleMarkPaid(op)}
                                disabled={loadingAction}
                                className="p-2 rounded-lg bg-success/15 hover:bg-success/25 text-success border border-success/40 transition-colors"
                                title="Confirmar pagamento"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmPayId(null)}
                                className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40 transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : isUndoConfirm ? (
                            <>
                              <span className="text-[10px] font-bold text-warning mr-1">Desfazer último?</span>
                              <button
                                onClick={() => handleUndoLastPayment(op)}
                                disabled={loadingAction}
                                className="p-2 rounded-lg bg-warning/15 hover:bg-warning/25 text-warning border border-warning/40 transition-colors"
                                title="Confirmar desfazer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmUndoId(null)}
                                className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40 transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {opHistory.length > 0 && (
                                <button
                                  onClick={() => setExpandedHistory(isExpanded ? null : op.id)}
                                  className={`p-2 rounded-lg border transition-colors ${
                                    isExpanded
                                      ? 'bg-primary/15 text-primary border-primary/40'
                                      : 'bg-muted/10 hover:bg-muted/30 text-muted-foreground hover:text-foreground border-border/40'
                                  }`}
                                  title="Ver histórico"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                              )}
                              {opHistory.length > 0 && (
                                <button
                                  onClick={() => setConfirmUndoId(op.id)}
                                  disabled={loadingAction}
                                  className="p-2 rounded-lg bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30 transition-colors"
                                  title="Desfazer último pagamento"
                                >
                                  <Undo2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setConfirmPayId(op.id)}
                                disabled={op.pendingSalary === 0}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                                  op.pendingSalary === 0
                                    ? 'bg-muted/10 text-muted-foreground/50 border-border/30 cursor-not-allowed'
                                    : 'bg-success/10 hover:bg-success/20 text-success border-success/30 hover:-translate-y-0.5'
                                }`}
                                title="Marcar como pago"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Marcar pago
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && opHistory.length > 0 && (
                      <div className="border-t border-border/40 bg-muted/[0.02] px-4 py-3 animate-fade-in">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <History className="w-3 h-3" /> Histórico de pagamentos
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {opHistory.length} registro{opHistory.length > 1 ? 's' : ''} · total {formatBRL(totalPaidAllTime)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {opHistory.map((h, idx) => (
                            <div
                              key={h.id}
                              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs ${
                                idx === 0
                                  ? 'border-success/30 bg-success/[0.04]'
                                  : 'border-border/40 bg-card/30'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                idx === 0 ? 'bg-success/15 text-success border border-success/30' : 'bg-muted/30 text-muted-foreground border border-border/40'
                              }`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-foreground">{formatBRL(h.amount)}</span>
                                  {idx === 0 && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-success/40 bg-success/10 text-success">
                                      Mais recente
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                                  <CalendarIcon className="w-2.5 h-2.5" />
                                  {format(new Date(h.paidAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                  <span className="opacity-50">·</span>
                                  <UserIcon className="w-2.5 h-2.5" /> {h.paidBy || '—'}
                                </p>
                              </div>
                              {idx === 0 ? (
                                <button
                                  onClick={() => handleUndoLastPayment(op)}
                                  disabled={loadingAction}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30 text-[10px] font-bold transition-colors"
                                  title="Desfazer este pagamento"
                                >
                                  <Undo2 className="w-3 h-3" /> Desfazer
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeleteHistoryEntry(h)}
                                  disabled={loadingAction}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  title="Remover registro"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONFIGURAÇÕES */}
      {activeTab === 'Configurações' && (
        <div className="animate-fade-in space-y-4">
          <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40">
              <h3 className="text-sm font-bold text-foreground tracking-tight">Gerenciar operadores</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Renomeie ou remova operadores vinculados.</p>
            </div>

            <div className="p-3 space-y-1.5">
              {affiliatedUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">Nenhum operador vinculado ainda.</p>
              )}

              {affiliatedUsers.map(u => {
                const displayName = u.displayName || u.username;
                const initials = displayName.substring(0, 2).toUpperCase();
                const isEditing = editingId === u.id;
                const isConfirmDelete = deletingId === u.id;

                return (
                  <div key={u.id} className="flex items-center gap-3 hover:bg-foreground/[0.03] border border-transparent hover:border-border/40 rounded-lg px-3 py-2.5 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveName(u); if (e.key === 'Escape') setEditingId(null); }}
                          className="w-full bg-background border border-primary/40 rounded-md px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                          placeholder="Novo nome..."
                        />
                      ) : (
                        <div>
                          <p className="font-bold text-foreground text-sm truncate">{displayName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">@{u.username}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveName(u)} disabled={loadingAction} className="p-2 rounded-md bg-success/10 hover:bg-success/20 text-success border border-success/30 transition-colors" title="Salvar">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 rounded-md bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40 transition-colors" title="Cancelar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : isConfirmDelete ? (
                        <>
                          <span className="text-[11px] text-destructive font-semibold mr-1">Confirmar?</span>
                          <button onClick={() => handleDeleteOperator(u)} disabled={loadingAction} className="p-2 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 transition-colors" title="Confirmar">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeletingId(null)} className="p-2 rounded-md bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40 transition-colors" title="Cancelar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStartEdit(u)} className="p-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors" title="Renomear">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeletingId(u.id)} className="p-2 rounded-md bg-destructive/5 hover:bg-destructive/15 text-destructive border border-destructive/20 transition-colors" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Operators;
