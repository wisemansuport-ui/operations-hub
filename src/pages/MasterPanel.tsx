import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Crown, DollarSign, Calendar as CalendarIcon, 
  Ban, CheckCircle2, MoreVertical, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { Navigate } from 'react-router-dom';

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MasterPanel = () => {
  const { users } = useFirestoreData();
  const [payments, setPayments] = useState<any[]>([]);
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const [loading, setLoading] = useState(true);

  // Security check: Only allow 'nytzer'
  if (user?.username !== 'nytzer') {
    return <Navigate to="/app" replace />;
  }

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'subscription_payments'), orderBy('date', 'desc')), (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const admins = useMemo(() => {
    return users.filter(u => u.role === 'ADMIN' && u.username !== 'nytzer');
  }, [users]);

  const stats = useMemo(() => {
    const activeAdmins = admins.filter(a => {
      const exp = a.planExpiry ? new Date(a.planExpiry) : new Date(0);
      return isAfter(exp, new Date());
    }).length;

    // Fixed price R$ 500
    const mrr = activeAdmins * 500;

    const currentMonthRevenue = payments.reduce((acc, p) => {
      const pDate = new Date(p.date + 'T12:00:00');
      if (isSameMonth(pDate, new Date())) {
        return acc + Number(p.amount);
      }
      return acc;
    }, 0);

    return { activeAdmins, totalAdmins: admins.length, mrr, currentMonthRevenue };
  }, [admins, payments]);

  const handleRenew = async (adminId: string, username: string, currentExpiry: string) => {
    if (!window.confirm(`Registrar pagamento de R$ 500 e renovar +30 dias para ${username}?`)) return;

    try {
      let baseDate = currentExpiry ? new Date(currentExpiry) : new Date();
      if (!isAfter(baseDate, new Date())) {
        baseDate = new Date(); // If expired, 30 days from today
      }
      
      const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await updateDoc(doc(db, 'users', adminId), {
        planExpiry: newExpiry,
        plan: 'active'
      });

      await addDoc(collection(db, 'subscription_payments'), {
        adminId,
        adminUsername: username,
        amount: 500,
        date: format(new Date(), 'yyyy-MM-dd'),
        createdAt: serverTimestamp()
      });

      toast.success('Assinatura renovada com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao renovar assinatura.');
    }
  };

  const handleBlock = async (adminId: string, username: string) => {
    if (!window.confirm(`Bloquear o acesso de ${username} imediatamente?`)) return;
    try {
      await updateDoc(doc(db, 'users', adminId), {
        planExpiry: new Date(Date.now() - 1000).toISOString() // expired
      });
      toast.success('Usuário bloqueado com sucesso.');
    } catch (e) {
      toast.error('Erro ao bloquear usuário.');
    }
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
              Controle de assinaturas e faturamento
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">MRR (Recorrente)</div>
              <div className="mt-2 text-2xl font-bold text-foreground tabular-nums">{formatBRL(stats.mrr)}</div>
              <div className="mt-1 text-xs text-muted-foreground">Previsão baseada em {stats.activeAdmins} ativos</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Faturamento (Mês Atual)</div>
              <div className="mt-2 text-2xl font-bold text-foreground tabular-nums">{formatBRL(stats.currentMonthRevenue)}</div>
              <div className="mt-1 text-xs text-muted-foreground">Entradas deste mês</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Total de Mestres</div>
              <div className="mt-2 text-2xl font-bold text-foreground tabular-nums">{stats.totalAdmins}</div>
              <div className="mt-1 text-xs text-muted-foreground">{stats.activeAdmins} ativos • {stats.totalAdmins - stats.activeAdmins} inativos</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Admins */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Gerenciamento de Clientes (Mestres)</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase tracking-widest text-muted-foreground bg-secondary/50">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-l-lg">Mestre (Admin)</th>
                <th className="px-4 py-3 font-semibold text-center">Operadores</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Vencimento</th>
                <th className="px-4 py-3 font-semibold text-right rounded-r-lg">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {admins.map(admin => {
                const operatorCount = users.filter(u => u.affiliatedTo === admin.username).length;
                const expDate = admin.planExpiry ? new Date(admin.planExpiry) : new Date(0);
                const isActive = isAfter(expDate, new Date());
                
                return (
                  <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{admin.username}</div>
                      {admin.fullName && <div className="text-xs text-muted-foreground">{admin.fullName}</div>}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground font-medium">
                      {operatorCount}
                    </td>
                    <td className="px-4 py-3">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                          <Ban className="w-3.5 h-3.5" /> Expirado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {format(expDate, "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRenew(admin.id, admin.username, admin.planExpiry)}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-medium text-xs inline-flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Renovar
                        </button>
                        <button
                          onClick={() => handleBlock(admin.id, admin.username)}
                          disabled={!isActive}
                          className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all font-medium text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5" /> Bloquear
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {admins.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MasterPanel;
