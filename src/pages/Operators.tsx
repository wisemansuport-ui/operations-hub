import React, { useState, useMemo } from 'react';
import { Users, Link as LinkIcon, Pencil, Trash2, Check, X, Crown, Trophy, Medal, Sparkles, TrendingUp, DollarSign, Target, UserCheck, Wallet, ArrowUpRight, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useFirestoreData } from "../hooks/useFirestoreData";
import { OperationMeta } from "./Tasks";
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
  salary: number;
  normais: number;
  baixas: number;
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
    } catch (e) {
      toast.error('Erro ao salvar nome. Tente novamente.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteOperator = async (u: any) => {
    setLoadingAction(true);
    try {
      await deleteDoc(doc(db, 'users', u.id));
      toast.success(`Operador "${u.displayName || u.username}" removido com sucesso.`);
      setDeletingId(null);
    } catch (e) {
      toast.error('Erro ao excluir operador. Tente novamente.');
    } finally {
      setLoadingAction(false);
    }
  };

  const { operatorData, folhaTotal, totalMetas, totalContas, totalLucroEquipe } = useMemo(() => {
    const opMap: Record<string, any> = {};
    let tmpFolhaTotal = 0;
    let tmpTotalMetasCount = 0;
    let tmpTotalContasCount = 0;
    let tmpTotalLucroEquipe = 0;

    users.forEach(u => {
      if (u.affiliatedTo === activeOperator) {
        opMap[u.username] = { id: u.username, name: u.username, deps: 0, metas: 0, totalProfit: 0, normais: 0, baixas: 0, salary: 0 };
      }
    });

    metas.forEach(meta => {
      if (meta.status !== 'fechada' || meta.isAdminMeta) return;
      const isAffiliated = (users.find(u => u.username === meta.operador)?.affiliatedTo === activeOperator);
      if (!isAffiliated) return;

      const opName = meta.operador || 'Operador Central';
      if (!opMap[opName]) {
        opMap[opName] = { id: opName, name: opName, deps: 0, metas: 0, totalProfit: 0, normais: 0, baixas: 0, salary: 0 };
      }

      let metaLucro = 0;
      let metaNormais = 0;
      let metaBaixas = 0;
      let metaContas = 0;

      (meta.remessas || []).forEach(r => {
        const normais = (r as any).contasNormais || 0;
        const baixas = (r as any).contasBaixas || 0;
        metaNormais += normais;
        metaBaixas += baixas;
        metaLucro += (r.saque - r.deposito);
        metaContas += r.contas;
      });

      const metaSalary = ((metaNormais * 2) + (metaBaixas * 1));
      const faturamentoExtra = meta.salarioOperador ? Number(meta.salarioOperador) : 0;

      opMap[opName].deps += metaContas;
      opMap[opName].metas += 1;
      opMap[opName].totalProfit += (metaLucro + faturamentoExtra);
      opMap[opName].normais += metaNormais;
      opMap[opName].baixas += metaBaixas;
      opMap[opName].salary += metaSalary;

      tmpFolhaTotal += metaSalary;
      tmpTotalMetasCount += 1;
      tmpTotalContasCount += metaContas;
      tmpTotalLucroEquipe += (metaLucro + faturamentoExtra);
    });

    const ranked = Object.values(opMap).map(op => {
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
    }).sort((a, b) => b.totalProfit - a.totalProfit) as OperatorData[];

    ranked.forEach((op, i) => op.rank = i + 1);

    return { operatorData: ranked, folhaTotal: tmpFolhaTotal, totalMetas: tmpTotalMetasCount, totalContas: tmpTotalContasCount, totalLucroEquipe: tmpTotalLucroEquipe };
  }, [metas, users, activeOperator]);

  const handleCopyLink = () => {
    const activeAdmin = user?.username || 'admin';
    const inviteLink = `${window.location.origin}/login?ref=${activeAdmin}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link único gerado e copiado para a área de transferência!");
  };

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const maxProfit = Math.max(...operatorData.map(o => o.totalProfit), 1);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-3.5 h-3.5" />;
    if (rank === 2) return <Trophy className="w-3.5 h-3.5" />;
    if (rank === 3) return <Medal className="w-3.5 h-3.5" />;
    return null;
  };

  const rankAccent = (rank: number) => {
    if (rank === 1) return 'from-primary via-primary/60 to-transparent';
    if (rank === 2) return 'from-foreground/40 via-foreground/20 to-transparent';
    if (rank === 3) return 'from-amber-700/60 via-amber-700/30 to-transparent';
    return 'from-border to-transparent';
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-16 relative z-10 w-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/60 via-card/30 to-transparent backdrop-blur-2xl p-8">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-success/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-2xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Equipe · v2.0</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Operadores de Elite</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Performance individual, ranking automatizado e folha de pagamento calculada em tempo real.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="group inline-flex items-center gap-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.4)]"
          >
            <LinkIcon className="w-4 h-4" />
            Gerar link de cadastro
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* Tab bar — pill style */}
      <div className="relative flex items-center gap-1 p-1.5 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xl overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 min-w-fit px-5 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                active
                  ? 'bg-foreground/[0.06] text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && <span className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 h-0.5 w-8 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]" />}
              {tab}
            </button>
          );
        })}
      </div>

      {/* RANKING */}
      {activeTab === 'Ranking' && (
        <div className="space-y-8 animate-fade-in">
          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: UserCheck, label: 'Operadores', value: String(operatorData.length), accent: 'bg-blue-500/20' },
              { icon: Target, label: 'Metas Totais', value: String(totalMetas), accent: 'bg-primary/20' },
              { icon: TrendingUp, label: 'Depositantes', value: String(totalContas), accent: 'bg-purple-500/20' },
              { icon: DollarSign, label: 'Lucro Equipe', value: formatBRL(totalLucroEquipe), accent: 'bg-success/20', highlight: totalLucroEquipe >= 0 },
            ].map((k) => (
              <div key={k.label} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300">
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity ${k.accent}`} />
                <div className="relative flex items-center justify-between mb-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.accent}`}>
                    <k.icon className="w-4 h-4 text-foreground" />
                  </div>
                </div>
                <p className="relative text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">{k.label}</p>
                <p className={`relative text-2xl font-bold tracking-tight ${
                  k.highlight === undefined ? 'text-foreground' : k.highlight ? 'text-success' : 'text-destructive'
                }`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Insight bar */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4 flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
            <p className="text-xs font-medium text-foreground/80">
              Ranking global da equipe — dados financeiros refletem performance bruta consolidada por operador.
            </p>
          </div>

          {/* Ranking */}
          {operatorData.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <h3 className="text-base font-bold text-foreground">Nenhum operador na sua equipe ainda</h3>
              <p className="text-sm text-muted-foreground mt-2">Use o botão acima para gerar um link de cadastro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {operatorData.map((op) => {
                const widthPct = op.totalProfit > 0 ? Math.max(8, (op.totalProfit / maxProfit) * 100) : 8;
                const isTop = op.rank === 1;
                return (
                  <div
                    key={op.id}
                    className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl hover:border-primary/40 hover:bg-card/60 transition-all duration-300"
                  >
                    {/* Left accent strip */}
                    <div className={`absolute top-0 left-0 bottom-0 w-[3px] bg-gradient-to-b ${rankAccent(op.rank)}`} />

                    {/* Background glow for #1 */}
                    {isTop && (
                      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                    )}

                    <div className="relative p-5 pl-7 flex flex-col lg:flex-row items-start lg:items-center gap-5">
                      {/* Rank + avatar */}
                      <div className="flex items-center gap-4 flex-1 w-full">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Rank</span>
                          <div className="relative">
                            {op.rank <= 3 && (
                              <span className="absolute -top-1 -right-1 text-primary">{rankIcon(op.rank)}</span>
                            )}
                            <span className={`text-2xl font-black tracking-tighter ${isTop ? 'text-primary' : op.rank <= 3 ? 'text-foreground' : 'text-foreground/50'}`}>
                              #{op.rank}
                            </span>
                          </div>
                        </div>

                        <div className="h-14 w-px bg-border/50 shrink-0" />

                        <div className="relative shrink-0">
                          {isTop && <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />}
                          <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-base ${
                            isTop
                              ? 'bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/50 text-primary'
                              : 'bg-muted/40 border border-border/60 text-foreground'
                          }`}>
                            {op.initials}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base font-bold text-foreground tracking-tight truncate">{op.name}</h3>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${op.badgeColor}`}>
                              {op.badge}
                            </span>
                          </div>
                          <div className="flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                              <span className="font-bold text-foreground">{op.deps}</span> deps
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                              <span className="font-bold text-foreground">{op.metas}</span> metas
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-primary" />
                              <span className="font-bold text-primary">{formatBRL(op.profitPerConta)}</span>
                              <span>/conta</span>
                            </span>
                          </div>

                          <div className="mt-3 h-1 w-full rounded-full bg-border/40 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                op.totalProfit >= 0 ? 'bg-gradient-to-r from-success/60 to-success' : 'bg-gradient-to-r from-destructive/60 to-destructive'
                              }`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Profit */}
                      <div className="flex justify-between lg:flex-col lg:items-end w-full lg:w-auto lg:min-w-[180px] lg:text-right pt-4 lg:pt-0 border-t lg:border-t-0 border-border/40">
                        <p className={`text-2xl font-bold tracking-tight ${op.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {op.totalProfit >= 0 ? '+' : ''}{formatBRL(op.totalProfit)}
                        </p>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                          {op.deps} depositantes
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

      {/* EQUIPE — modern member grid */}
      {activeTab === 'Equipe' && (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Membros da equipe</h2>
              <p className="text-xs text-muted-foreground mt-1">{affiliatedUsers.length} operador(es) vinculado(s) a você.</p>
            </div>
          </div>

          {affiliatedUsers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <h3 className="text-base font-bold text-foreground">Sua equipe está vazia</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Compartilhe o link de cadastro para começar a vincular operadores.</p>
              <button onClick={handleCopyLink} className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5">
                <LinkIcon className="w-4 h-4" /> Gerar link
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {affiliatedUsers.map(u => {
                const displayName = u.displayName || u.username;
                const initials = displayName.substring(0, 2).toUpperCase();
                const opStats = operatorData.find(o => o.id === u.username);
                return (
                  <div key={u.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center font-bold text-primary">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground truncate">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.username}</p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_hsl(var(--success))] shrink-0" />
                    </div>
                    <div className="relative grid grid-cols-3 gap-2 pt-4 border-t border-border/40">
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
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-1 p-1.5 rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl w-fit">
              {(['Hoje', '7 dias', '30 dias', 'Tudo']).map(f => (
                <button
                  key={f}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${f === '30 dias' ? 'bg-foreground/[0.06] text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))]' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Hero summary card */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/40 to-card/20 backdrop-blur-2xl p-8">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] mb-1">Modelo automático</p>
                  <p className="text-sm text-foreground/90">
                    <strong className="text-foreground">R$ 2,00</strong> por depositante normal · <strong className="text-foreground">R$ 1,00</strong> por dep. baixo
                  </p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em] mb-1">Total a pagar</p>
                <p className="text-4xl font-bold text-success tracking-tight">{formatBRL(folhaTotal)}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4">Operador</th>
                    <th className="px-6 py-4 text-center">Metas</th>
                    <th className="px-6 py-4 text-center">Deps</th>
                    <th className="px-6 py-4 text-right">Lucro</th>
                    <th className="px-6 py-4 text-right">A pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {operatorData.map(op => (
                    <tr key={op.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">{op.initials}</div>
                          <div>
                            <p className="font-bold text-foreground">{op.name}</p>
                            <p className="text-[10px] text-muted-foreground">Operador ativo</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-foreground">{op.metas}</td>
                      <td className="px-6 py-4 text-center font-bold text-foreground">{op.deps}</td>
                      <td className={`px-6 py-4 text-right font-bold ${op.totalProfit > 0 ? 'text-success' : 'text-destructive'}`}>
                        {op.totalProfit > 0 ? '+' : ''}{formatBRL(op.totalProfit)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-success">{formatBRL(op.salary)}</p>
                        <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{op.normais} × R$ 2 · {op.baixas} × R$ 1</p>
                      </td>
                    </tr>
                  ))}
                  {operatorData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">Nenhum dado para exibir.</td>
                    </tr>
                  )}
                </tbody>
                {operatorData.length > 0 && (
                  <tfoot className="bg-primary/5 border-t border-primary/20">
                    <tr>
                      <td className="px-6 py-5 font-black text-primary uppercase tracking-widest text-xs">Total geral</td>
                      <td className="px-6 py-5 text-center font-black text-foreground">{totalMetas}</td>
                      <td className="px-6 py-5 text-center font-black text-foreground">{totalContas}</td>
                      <td className={`px-6 py-5 text-right font-black ${totalLucroEquipe >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {totalLucroEquipe > 0 ? '+' : ''}{formatBRL(totalLucroEquipe)}
                      </td>
                      <td className="px-6 py-5 text-right font-black text-primary text-xl tracking-tight">{formatBRL(folhaTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURAÇÕES */}
      {activeTab === 'Configurações' && (
        <div className="animate-fade-in space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground tracking-tight">Gerenciar operadores</h3>
              <p className="text-xs text-muted-foreground mt-1">Renomeie ou remova operadores vinculados à sua equipe.</p>
            </div>

            <div className="p-4 space-y-2">
              {affiliatedUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">Nenhum operador vinculado ainda.</p>
              )}

              {affiliatedUsers.map(u => {
                const displayName = u.displayName || u.username;
                const initials = displayName.substring(0, 2).toUpperCase();
                const isEditing = editingId === u.id;
                const isConfirmDelete = deletingId === u.id;

                return (
                  <div key={u.id} className="flex items-center gap-3 bg-muted/5 hover:bg-muted/15 border border-border/40 rounded-xl px-4 py-3 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center font-bold text-primary shrink-0">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveName(u); if (e.key === 'Escape') setEditingId(null); }}
                          className="w-full bg-background border border-primary/40 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                          placeholder="Novo nome..."
                        />
                      ) : (
                        <div>
                          <p className="font-bold text-foreground text-sm truncate">{displayName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{u.username}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveName(u)} disabled={loadingAction} className="p-2 rounded-lg bg-success/10 hover:bg-success/20 text-success border border-success/30 transition-colors" title="Salvar">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40 transition-colors" title="Cancelar">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : isConfirmDelete ? (
                        <>
                          <span className="text-xs text-destructive font-semibold mr-1">Confirmar?</span>
                          <button onClick={() => handleDeleteOperator(u)} disabled={loadingAction} className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 transition-colors" title="Confirmar exclusão">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingId(null)} className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40 transition-colors" title="Cancelar">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStartEdit(u)} className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors" title="Renomear">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingId(u.id)} className="p-2 rounded-lg bg-destructive/5 hover:bg-destructive/15 text-destructive border border-destructive/20 transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
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
