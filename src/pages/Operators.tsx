import React, { useState, useMemo } from 'react';
import { Users, Link as LinkIcon, Star, TrendingUp, TrendingDown, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useFirestoreData } from "../hooks/useFirestoreData";
import { OperationMeta } from "./Tasks";

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

const Operators = () => {
  const [activeTab, setActiveTab] = useState('Ranking');
  const { metas, users } = useFirestoreData();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const activeOperator = user?.username || 'admin';

  // Manage state for rename/delete
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // List of operators affiliated to the current admin
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

     // Pré-preenche o mapa com todos os operadores afiliados (mesmo os que não têm metas ainda)
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
        // Use displayName if available (admin can rename)
        const userRecord = users.find((u: any) => u.username === op.id);
        const displayName = userRecord?.displayName || op.name;
        const initials = displayName.substring(0,2).toUpperCase();
        const profitPerConta = op.deps > 0 ? (op.totalProfit / op.deps) : 0;
        let badge = 'Em progressão';
        let badgeColor = 'text-emerald-500/70 border-emerald-500/30';
        if (profitPerConta > 2 && op.totalProfit > 100) { badge = 'Top performer'; badgeColor = 'text-primary border-primary'; }
        else if (op.totalProfit < 0) { badge = 'Prejuízo'; badgeColor = 'text-red-500 border-red-500/50'; }

        return { ...op, name: displayName, initials, profitPerConta, badge, badgeColor };
     }).sort((a,b) => b.totalProfit - a.totalProfit) as OperatorData[];

     ranked.forEach((op, i) => op.rank = i + 1);

     return { operatorData: ranked, folhaTotal: tmpFolhaTotal, totalMetas: tmpTotalMetasCount, totalContas: tmpTotalContasCount, totalLucroEquipe: tmpTotalLucroEquipe };

  }, [metas]);

  const handleCopyLink = () => {
    const activeAdmin = user?.username || 'admin';
    const inviteLink = `${window.location.origin}/login?ref=${activeAdmin}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link único gerado e copiado para a área de transferência!");
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12 relative z-10 w-full">
      {/* Header & Link Gen */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-xl relative overflow-hidden shrink-0 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
            <Users className="w-6 h-6 text-primary relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Operadores de Elite</h1>
            <p className="text-sm text-muted-foreground mt-1">Ranking por lucro e performance individual da equipe.</p>
          </div>
        </div>

        <button 
          onClick={handleCopyLink}
          className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 shadow-[0_0_10px_hsl(var(--primary)/0.1)]"
        >
          <LinkIcon className="w-4 h-4" />
          Gerar Link de Cadastro
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted/20 border border-border/50 rounded-lg p-1.5 overflow-x-auto hide-scrollbar">
        {['Ranking', 'Equipe', 'Folha de pagamento', 'Configurações'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap flex-1 text-center ${
              activeTab === tab 
                ? 'bg-muted text-foreground shadow-sm border border-border/50' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'Ranking' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="glass-card rounded-xl p-5 border-border/40 hover:border-border/80 transition-colors bg-card/40 backdrop-blur-md">
           <p className="text-[10px] text-muted-foreground font-bold tracking-widest mb-3 uppercase">Operadores</p>
           <p className="text-3xl font-extrabold text-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{operatorData.length}</p>
         </div>
         <div className="glass-card rounded-xl p-5 border-border/40 hover:border-border/80 transition-colors bg-card/40 backdrop-blur-md">
           <p className="text-[10px] text-muted-foreground font-bold tracking-widest mb-3 uppercase">Metas Totais</p>
           <p className="text-3xl font-extrabold text-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{totalMetas}</p>
         </div>
         <div className="glass-card rounded-xl p-5 border-border/40 hover:border-border/80 transition-colors bg-card/40 backdrop-blur-md">
           <p className="text-[10px] text-muted-foreground font-bold tracking-widest mb-3 uppercase">Depositantes Totais</p>
           <p className="text-3xl font-extrabold text-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{totalContas}</p>
         </div>
         <div className="glass-card bg-primary/5 rounded-xl p-5 border-primary/20 hover:border-primary/50 transition-colors backdrop-blur-md shadow-[0_0_15px_hsl(var(--primary)/0.05)]">
           <p className="text-[10px] text-primary font-bold tracking-widest mb-3 uppercase drop-shadow-[0_0_5px_hsl(var(--primary)/0.5)]">Lucro Equipe</p>
           <p className={`text-3xl font-extrabold ${totalLucroEquipe >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'text-red-500'}`}>R$ {totalLucroEquipe.toFixed(2).replace('.', ',')}</p>
         </div>
      </div>

      {/* Alert */}
      <div className="glass-card bg-primary/10 border-primary/30 p-4 rounded-xl flex items-center gap-3 shadow-[0_0_10px_hsl(var(--primary)/0.1)]">
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_8px_hsl(var(--primary)/0.8)] animate-pulse" />
        <p className="text-xs font-semibold text-primary/90">Este é o ranking global da sua equipe. Os dados financeiros refletem a performance bruta para o administrador.</p>
      </div>

      {/* Ranking List */}
      <div className="pt-2">
        <div className="space-y-4">
          {operatorData.map((op) => (
            <div key={op.id} className="glass-card py-5 px-6 rounded-2xl border-border/40 hover:bg-card/70 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
              
              <div className="flex items-center gap-4 w-full md:w-auto flex-1 relative z-10">
                
                {/* Ranking Circular Position */}
                <div className="relative flex items-center justify-center w-12 h-12 shrink-0 bg-muted rounded-full border border-border/50 font-bold text-foreground font-mono">
                  {op.rank}
                </div>
                
                <div className="relative flex items-center justify-center w-12 h-12 shrink-0 bg-primary/10 rounded-full border border-primary/30 font-bold text-primary text-xl">
                  {op.initials}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-lg font-extrabold text-foreground tracking-tight">{op.name}</span>
                    {op.badge === 'Top performer' ? <TrendingUp className="w-3.5 h-3.5 text-primary" /> : <TrendingDown className="w-3.5 h-3.5 text-warning" />}
                    <span className={`text-[9px] px-2 py-0.5 rounded bg-muted border border-border/50 font-bold uppercase tracking-wider ${op.badgeColor}`}>
                      {op.badge}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                    <span><span className="text-foreground font-bold">{op.deps}</span> deps</span>
                    <span className="px-1 text-border/50">•</span>
                    <span><span className="text-foreground font-bold">{op.metas}</span> metas</span>
                    <span className="px-1 text-border/50">•</span>
                    <span className="px-1.5 py-0.5 bg-black/40 rounded border border-border/50">
                      R$ {op.profitPerConta.toFixed(2).replace('.', ',')}/conta
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-border/40 rounded-full h-1 overflow-hidden mt-3 shadow-inner">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 relative" 
                      style={{ 
                        width: op.totalProfit > 0 ? `${Math.min(100, Math.max(10, op.totalProfit / 5))}%` : '15%', 
                        backgroundColor: op.totalProfit > 0 ? 'rgba(52, 211, 153, 0.8)' : 'rgba(248, 113, 113, 0.8)' 
                      }} 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between md:flex-col md:items-end w-full md:w-auto pt-5 md:pt-0 border-t border-border/50 md:border-t-0 mt-3 md:mt-0 relative z-10">
                <div className="text-right mt-1">
                  <p className={`text-xl font-extrabold drop-shadow-md ${op.totalProfit > 0 ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]'}`}>
                    {op.totalProfit > 0 ? '+' : ''}R$ {op.totalProfit.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-bold tracking-[0.1em] uppercase hover:text-muted-foreground transition-colors mt-0.5">
                    {op.deps} depositantes
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>
          </div>
        </div>
      )}

      {activeTab === 'Folha de pagamento' && (
        <div className="animate-fade-in space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div className="flex gap-2 p-1.5 bg-black/20 rounded-lg w-fit border border-border/40">
              {(['Hoje', '7 dias', '30 dias', 'Tudo']).map(f => (
                <button 
                  key={f}
                  className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${f === '30 dias' ? 'bg-muted/50 text-foreground shadow-lg border border-border/50' : 'text-muted-foreground hover:bg-muted/30'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <p className="text-sm font-medium text-muted-foreground">Modelo: <strong className="text-foreground">R$ 2,00 por depositante (NORMAL) e R$ 1,00 (DEP BAIXO)</strong></p>
             <div className="text-right">
                <p className="text-2xl font-extrabold text-emerald-400">R$ {folhaTotal.toFixed(2).replace('.', ',')}</p>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-1">Total a pagar (Automático)</p>
             </div>
          </div>



          <div className="glass-card rounded-2xl border-border/40 overflow-hidden mt-6 hide-scrollbar overflow-x-auto">
             <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/10 border-b border-border/40">
                   <tr>
                      <th className="px-6 py-4">Operador</th>
                      <th className="px-6 py-4 text-center">Metas</th>
                      <th className="px-6 py-4 text-center">Deps</th>
                      <th className="px-6 py-4 text-right">Lucro</th>
                      <th className="px-6 py-4 text-right">A Pagar</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                   {operatorData.map(op => {
                      return (
                         <tr key={op.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">{op.initials}</div>
                                  <div>
                                     <p className="font-bold text-foreground">{op.name}</p>
                                     <p className="text-xs text-muted-foreground">Operador ativo</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold">{op.metas}</td>
                            <td className="px-6 py-4 text-center font-bold">{op.deps}</td>
                            <td className={`px-6 py-4 text-right font-bold ${op.totalProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                               {op.totalProfit > 0 ? '+' : ''}R$ {op.totalProfit.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <p className="font-extrabold text-emerald-400">R$ {op.salary.toFixed(2).replace('.', ',')}</p>
                               <p className="text-[9px] text-muted-foreground font-medium mt-1">{op.normais} x R$ 2,00 | {op.baixas} x R$ 1,00</p>
                            </td>
                         </tr>
                      )
                   })}
                </tbody>
                <tfoot className="bg-primary/5 border-t-2 border-primary/20 shadow-[0_-10px_20px_-10px_hsl(var(--primary)/0.1)] relative">
                   <tr>
                      <td className="px-6 py-5 font-black text-primary uppercase tracking-widest text-sm drop-shadow-sm">TOTAL GERAL</td>
                      <td className="px-6 py-5 text-center font-black text-foreground text-base">{totalMetas}</td>
                      <td className="px-6 py-5 text-center font-black text-foreground text-base">{totalContas}</td>
                      <td className={`px-6 py-5 text-right font-black text-base ${totalLucroEquipe >= 0 ? 'text-emerald-400 drop-shadow-sm' : 'text-red-500 drop-shadow-sm'}`}>{totalLucroEquipe > 0 ? '+' : ''}R$ {totalLucroEquipe.toFixed(2).replace('.', ',')}</td>
                      <td className="px-6 py-5 text-right font-black text-primary text-2xl drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]">R$ {folhaTotal.toFixed(2).replace('.', ',')}</td>
                   </tr>
                </tfoot>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'Equipe' && (
        <div className="glass-card p-16 mt-8 text-center rounded-2xl border-border/40 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Aba em Desenvolvimento</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Os dados para <strong>{activeTab}</strong> serão populados automaticamente em breve.
          </p>
        </div>
      )}

      {activeTab === 'Configurações' && (
        <div className="animate-fade-in space-y-4">
          <div className="glass-card p-5 rounded-xl border-border/40">
            <h3 className="text-sm font-bold text-foreground mb-1">Gerenciar Operadores</h3>
            <p className="text-xs text-muted-foreground mb-5">Renomeie ou remova operadores da sua equipe.</p>

            <div className="space-y-3">
              {affiliatedUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum operador vinculado ainda.</p>
              )}

              {affiliatedUsers.map(u => {
                const displayName = u.displayName || u.username;
                const initials = displayName.substring(0,2).toUpperCase();
                const isEditing = editingId === u.id;
                const isConfirmDelete = deletingId === u.id;

                return (
                  <div key={u.id} className="flex items-center gap-3 bg-muted/10 border border-border/40 rounded-xl px-4 py-3 hover:bg-muted/20 transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary shrink-0">
                      {initials}
                    </div>

                    {/* Name / Edit input */}
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

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveName(u)}
                            disabled={loadingAction}
                            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="Salvar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40 transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : isConfirmDelete ? (
                        <>
                          <span className="text-xs text-red-400 font-semibold mr-1">Confirmar?</span>
                          <button
                            onClick={() => handleDeleteOperator(u)}
                            disabled={loadingAction}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                            title="Confirmar exclusão"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40 transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors"
                            title="Renomear operador"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(u.id)}
                            className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/15 text-red-400 border border-red-500/20 transition-colors"
                            title="Excluir operador"
                          >
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
