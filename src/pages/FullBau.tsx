import React, { useEffect, useMemo, useState } from 'react';
import { TasksHero } from '@/components/heroes/TasksHero';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  Plus, ArrowLeft, ExternalLink, Link as LinkIcon, Edit2, Trash2,
  Briefcase, CheckSquare, X, ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';

const redes = ['Selecione', 'WE', 'W1', 'VOY', '91', 'DZ', 'A8', 'OKOK', 'ANJO', 'XW', 'EK', 'DY', '777', '888', 'WP', 'BRA', 'GAME', 'ALFA', 'KK', 'MK', 'OUTRAS'];

export interface FullBauLine {
  id: string;
  conta: string;
  cliente: string;
  deposito: number;
  saque: number;
  bau: number;
  status: 'Aguardando' | 'Concluído' | 'Ban';
  obs: string;
}

export interface FullBauOperation {
  id: string;
  plataforma: string;
  rede: string;
  titulo: string;
  contas: number;
  operador?: string;
  totalApv?: number;
  montante?: number;
  link?: string | null;
  status?: 'ativa' | 'fechada' | 'lixeira';
  createdAt: string;
  linhas?: FullBauLine[];
}

const formatBRL = (v: number) =>
  `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const STATUS_COLORS: Record<string, string> = {
  'Aguardando': 'bg-warning/15 text-warning border-warning/30',
  'Concluído': 'bg-success/15 text-success border-success/30',
  'Ban': 'bg-destructive/15 text-destructive border-destructive/30',
};

// ───────────────────────── Detail (lines table) ─────────────────────────
const OperationDetail = ({
  op, onBack, onUpdate,
}: { op: FullBauOperation; onBack: () => void; onUpdate: (o: FullBauOperation) => void }) => {
  const [editingLink, setEditingLink] = useState(false);
  const [linkValue, setLinkValue] = useState(op.link || '');
  const linhas = op.linhas || [];

  const totals = useMemo(() => {
    let dep = 0, saq = 0, bau = 0, lucro = 0;
    linhas.forEach(l => {
      dep += Number(l.deposito) || 0;
      saq += Number(l.saque) || 0;
      bau += Number(l.bau) || 0;
      lucro += ((Number(l.saque) || 0) - (Number(l.deposito) || 0)) + (Number(l.bau) || 0);
    });
    return { dep, saq, bau, lucro };
  }, [linhas]);

  const updateLine = (id: string, patch: Partial<FullBauLine>) => {
    onUpdate({ ...op, linhas: linhas.map(l => l.id === id ? { ...l, ...patch } : l) });
  };
  const addLine = () => {
    const newL: FullBauLine = {
      id: crypto.randomUUID(),
      conta: '', cliente: '', deposito: 0, saque: 0, bau: 0,
      status: 'Aguardando', obs: '',
    };
    onUpdate({ ...op, linhas: [...linhas, newL] });
  };
  const removeLine = (id: string) => {
    onUpdate({ ...op, linhas: linhas.filter(l => l.id !== id) });
  };

  return (
    <div className="space-y-5 animate-fade-in w-full pb-20">
      <button onClick={onBack} className="flex items-center gap-2 hover:bg-muted/50 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            {op.plataforma} {op.rede !== 'Selecione' ? `- ${op.rede}` : ''}
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-primary/40 text-primary bg-primary/10">
            Full Baú
          </span>

          {/* Link */}
          {editingLink ? (
            <div className="flex items-center gap-2 w-full max-w-xl">
              <LinkIcon className="w-4 h-4 text-primary shrink-0" />
              <input
                autoFocus type="url" value={linkValue}
                onChange={e => setLinkValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    onUpdate({ ...op, link: linkValue.trim() || null });
                    setEditingLink(false);
                    toast.success('Link atualizado!');
                  }
                  if (e.key === 'Escape') { setLinkValue(op.link || ''); setEditingLink(false); }
                }}
                placeholder="Link da plataforma"
                className="flex-1 bg-background/50 border border-primary/40 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
              />
              <button onClick={() => { onUpdate({ ...op, link: linkValue.trim() || null }); setEditingLink(false); }}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setLinkValue(op.link || ''); setEditingLink(false); }}
                className="p-1.5 rounded-lg bg-muted/20 text-muted-foreground border border-border/40">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : op.link ? (
            <div className="flex items-center gap-2">
              <a href={op.link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-primary border border-primary/40 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg font-semibold">
                <ExternalLink className="w-3.5 h-3.5" /> Abrir link
              </a>
              <button onClick={() => { setLinkValue(op.link || ''); setEditingLink(true); }}
                className="p-1 rounded-md bg-muted/20 hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border/30">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingLink(true)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary border border-dashed border-border/50 hover:border-primary/50 px-3 py-1.5 rounded-lg">
              <LinkIcon className="w-3.5 h-3.5" /> Adicionar link
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Linhas da operação Full Baú — Depósito, Saque e Baú</p>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Depósito total', val: formatBRL(totals.dep), tone: 'text-foreground' },
          { label: 'Saque total', val: formatBRL(totals.saq), tone: 'text-foreground' },
          { label: 'Baú total', val: formatBRL(totals.bau), tone: 'text-primary' },
          { label: 'Lucro total', val: formatBRL(totals.lucro), tone: totals.lucro >= 0 ? 'text-success' : 'text-destructive' },
        ].map(k => (
          <div key={k.label} className="glass-card rounded-xl p-4 border border-border/40">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{k.label}</p>
            <p className={`text-xl font-black tabular-nums ${k.tone}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Tabela linhas */}
      <div className="glass-card rounded-xl overflow-hidden border border-border/40">
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Linhas da cooperação</h2>
          <button onClick={addLine}
            className="h-8 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            <Plus className="w-3.5 h-3.5" /> Adicionar linha
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-muted/30">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 w-10">#</th>
                <th className="px-3 py-2">Conta</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Depósito</th>
                <th className="px-3 py-2">Saque</th>
                <th className="px-3 py-2">Baú</th>
                <th className="px-3 py-2">Lucro</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Obs.</th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => {
                const lucro = ((Number(l.saque) || 0) - (Number(l.deposito) || 0)) + (Number(l.bau) || 0);
                return (
                  <tr key={l.id} className="border-t border-border/30 hover:bg-muted/10">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-2 py-1">
                      <input value={l.conta} onChange={e => updateLine(l.id, { conta: e.target.value })}
                        className="w-full bg-background/40 border border-border/40 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary/60" />
                    </td>
                    <td className="px-2 py-1">
                      <input value={l.cliente} onChange={e => updateLine(l.id, { cliente: e.target.value })}
                        className="w-full bg-background/40 border border-border/40 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary/60" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" value={l.deposito || ''} onChange={e => updateLine(l.id, { deposito: Number(e.target.value) || 0 })}
                        className="w-full bg-background/40 border border-border/40 rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-primary/60" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" value={l.saque || ''} onChange={e => updateLine(l.id, { saque: Number(e.target.value) || 0 })}
                        className="w-full bg-background/40 border border-border/40 rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-primary/60" />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" value={l.bau || ''} onChange={e => updateLine(l.id, { bau: Number(e.target.value) || 0 })}
                        className="w-full bg-background/40 border border-primary/30 rounded px-2 py-1 text-sm tabular-nums text-primary focus:outline-none focus:border-primary" />
                    </td>
                    <td className={`px-3 py-2 font-bold tabular-nums ${lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatBRL(lucro)}
                    </td>
                    <td className="px-2 py-1">
                      <select value={l.status} onChange={e => updateLine(l.id, { status: e.target.value as any })}
                        className={`w-full rounded px-2 py-1 text-xs font-semibold border focus:outline-none ${STATUS_COLORS[l.status] || ''}`}>
                        <option value="Aguardando">Aguardando</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Ban">Ban</option>
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input value={l.obs} onChange={e => updateLine(l.id, { obs: e.target.value })}
                        className="w-full bg-background/40 border border-border/40 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary/60" />
                    </td>
                    <td className="px-2 py-1">
                      <button onClick={() => removeLine(l.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {linhas.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Nenhuma linha — clique em "Adicionar linha" para começar.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────── Page (list) ─────────────────────────
export default function FullBau() {
  const [ops, setOps] = useState<FullBauOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const activeOperator = user?.username || 'admin';

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'metasFullBau'), snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() } as FullBauOperation));
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOps(arr);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // form state
  const [fPlat, setFPlat] = useState('');
  const [fRede, setFRede] = useState('Selecione');
  const [fTitulo, setFTitulo] = useState('');
  const [fContas, setFContas] = useState<number | ''>('');
  const [fOperador, setFOperador] = useState(activeOperator);
  const [fApv, setFApv] = useState<number | string>('');
  const [fMontante, setFMontante] = useState<number | string>('');
  const [fLink, setFLink] = useState('');

  const resetForm = () => {
    setFPlat(''); setFRede('Selecione'); setFTitulo(''); setFContas('');
    setFOperador(activeOperator); setFApv(''); setFMontante(''); setFLink('');
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fPlat) { toast.error('Informe a plataforma.'); return; }
    const newOp: Omit<FullBauOperation, 'id'> = {
      plataforma: fPlat, rede: fRede, titulo: fTitulo || fPlat,
      contas: Number(fContas) || 0, operador: fOperador,
      totalApv: Number(fApv) || 0, montante: Number(fMontante) || 0,
      link: fLink.trim() || null, status: 'ativa',
      createdAt: new Date().toISOString(), linhas: [],
    };
    await addDoc(collection(db, 'metasFullBau'), newOp);
    toast.success('Operação Full Baú criada!');
    resetForm(); setCreateOpen(false);
  };

  const onUpdateOp = async (o: FullBauOperation) => {
    const { id, ...data } = o;
    await updateDoc(doc(db, 'metasFullBau', id), data as any);
  };
  const onDeleteOp = async (id: string) => {
    if (!confirm('Excluir esta operação Full Baú?')) return;
    await deleteDoc(doc(db, 'metasFullBau', id));
    toast.success('Operação excluída.');
  };

  const selected = ops.find(o => o.id === selectedId);

  const totalLucro = ops.reduce((acc, o) => {
    return acc + (o.linhas || []).reduce((s, l) =>
      s + ((Number(l.saque) || 0) - (Number(l.deposito) || 0)) + (Number(l.bau) || 0), 0);
  }, 0);
  const totalLinhas = ops.reduce((acc, o) => acc + (o.linhas || []).length, 0);

  if (selected) {
    return <OperationDetail op={selected} onBack={() => setSelectedId(null)} onUpdate={onUpdateOp} />;
  }

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20">
      <TasksHero
        eyebrow="Full Baú · Tempo real"
        title="Operação Full Baú"
        description="Configure o link da operação e trabalhe por linhas: Depósito, Saque e Baú. O Baú soma direto no lucro."
        kpis={[
          { label: 'Operações', value: String(ops.length).padStart(2, '0'), accent: true },
          { label: 'Linhas totais', value: String(totalLinhas) },
          { label: 'Lucro acumulado', value: formatBRL(totalLucro), tone: totalLucro >= 0 ? 'success' : 'destructive' },
        ]}
      />

      <div className="flex justify-end">
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Nova Operação Full Baú
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Carregando…</div>
      ) : ops.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-dashed border-border/40">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhuma operação Full Baú criada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ops.map(o => {
            const lucro = (o.linhas || []).reduce((s, l) =>
              s + ((Number(l.saque) || 0) - (Number(l.deposito) || 0)) + (Number(l.bau) || 0), 0);
            const linhasN = (o.linhas || []).length;
            return (
              <div key={o.id}
                className="glass-card rounded-xl border border-border/40 hover:border-primary/40 transition-all p-4 flex items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground truncate">{o.plataforma}</h3>
                    {o.rede !== 'Selecione' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border border-border/40 text-muted-foreground">{o.rede}</span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border border-primary/40 text-primary bg-primary/10">FULL BAÚ</span>
                    {o.operador && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border border-warning/40 text-warning bg-warning/10">
                        OP: {o.operador}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {linhasN} linha(s) · {o.contas || 0} contas previstas
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black tabular-nums ${lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatBRL(lucro)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Lucro acumulado</p>
                </div>
                <button onClick={() => setSelectedId(o.id)}
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button onClick={() => onDeleteOp(o.id)}
                  className="p-2 rounded-lg bg-muted/20 hover:bg-destructive/15 text-muted-foreground hover:text-destructive border border-border/40 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setCreateOpen(false)}>
          <form onSubmit={onCreate} onClick={e => e.stopPropagation()}
            className="glass-card rounded-2xl border border-border/50 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Nova Operação Full Baú</h2>
              <button type="button" onClick={() => setCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Plataforma *</label>
                <input value={fPlat} onChange={e => setFPlat(e.target.value)} required
                  className="w-full mt-1 bg-background/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Rede</label>
                <select value={fRede} onChange={e => setFRede(e.target.value)}
                  className="w-full mt-1 bg-background/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {redes.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Contas previstas</label>
                <input type="number" value={fContas} onChange={e => setFContas(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full mt-1 bg-background/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Título / Identificação</label>
                <input value={fTitulo} onChange={e => setFTitulo(e.target.value)}
                  className="w-full mt-1 bg-background/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Operador</label>
                <input value={fOperador} onChange={e => setFOperador(e.target.value)}
                  className="w-full mt-1 bg-background/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Total APV</label>
                <input type="number" value={fApv} onChange={e => setFApv(e.target.value)}
                  className="w-full mt-1 bg-background/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Montante</label>
                <input type="number" value={fMontante} onChange={e => setFMontante(e.target.value)}
                  className="w-full mt-1 bg-background/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Link de divulgação</label>
                <input type="url" value={fLink} onChange={e => setFLink(e.target.value)} placeholder="https://…"
                  className="w-full mt-1 bg-background/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/30">Cancelar</button>
              <button type="submit"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">Criar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
