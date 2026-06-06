import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  CheckCircle2, Copy, Pencil, Check, X, Undo2, History,
  Calendar as CalendarIcon, User as UserIcon, Wallet, KeyRound, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatBRL = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

interface OperatorLike {
  id: string;
  name: string;
  initials: string;
  metas: number;
  deps: number;
  salary: number;
  pendingSalary: number;
  pendingNormais: number;
  pendingBaixas: number;
}

interface HistoryEntry {
  id: string;
  amount: number;
  paidAt: string;
  paidBy: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  op: OperatorLike | null;
  userRecord: any | null;            // firestore user doc { id, salaryPix?, ... }
  opHistory: HistoryEntry[];
  loadingAction: boolean;
  onMarkPaid: (op: OperatorLike) => void;
  onUndoLast: (op: OperatorLike) => void;
  onDeleteHistory: (entry: HistoryEntry) => void;
  canEditPix: boolean;
}

export const OperatorPayrollSheet: React.FC<Props> = ({
  open, onOpenChange, op, userRecord, opHistory, loadingAction,
  onMarkPaid, onUndoLast, onDeleteHistory, canEditPix,
}) => {
  const [editingPix, setEditingPix] = useState(false);
  const [pixDraft, setPixDraft] = useState('');
  const [savingPix, setSavingPix] = useState(false);
  const [confirmPay, setConfirmPay] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (open) {
      setEditingPix(false);
      setPixDraft(userRecord?.salaryPix || '');
      setConfirmPay(false);
      setConfirmUndo(false);
      setShowHistory(false);
    }
  }, [open, userRecord]);

  if (!op) return null;

  const pix = userRecord?.salaryPix?.trim() || '';
  const hasPix = !!pix;
  const isPaidUp = op.pendingSalary === 0;
  const lastPaidLabel = opHistory[0]
    ? format(new Date(opHistory[0].paidAt), "dd MMM 'às' HH:mm", { locale: ptBR })
    : null;
  const totalPaidAllTime = opHistory.reduce((s, h) => s + (h.amount || 0), 0);

  const savePix = async () => {
    if (!userRecord?.id) {
      toast.error('Operador sem cadastro — não é possível salvar chave PIX.');
      return;
    }
    setSavingPix(true);
    try {
      await updateDoc(doc(db, 'users', userRecord.id), { salaryPix: pixDraft.trim() });
      toast.success('Chave PIX salva');
      setEditingPix(false);
    } catch {
      toast.error('Erro ao salvar chave PIX');
    } finally {
      setSavingPix(false);
    }
  };

  const copyPix = () => {
    if (!hasPix) return;
    navigator.clipboard.writeText(pix);
    toast.success('Chave PIX copiada');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-lg p-0 overflow-hidden border-border/60 bg-card">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border/40 flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
            isPaidUp
              ? 'bg-success/15 border border-success/40 text-success'
              : 'bg-primary/10 border border-primary/30 text-primary'
          }`}>
            {op.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-foreground truncate">{op.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {op.metas} metas · {op.deps} deps
              {lastPaidLabel && <span className="ml-1 text-success/80">· último pgto {lastPaidLabel}</span>}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* A pagar destaque */}
          <div className={`rounded-xl border p-4 ${
            op.pendingSalary > 0
              ? 'border-success/30 bg-success/[0.06]'
              : 'border-border/50 bg-muted/10'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">A pagar</p>
                <p className={`text-3xl font-bold tracking-tight mt-1 ${
                  op.pendingSalary > 0 ? 'text-success' : 'text-muted-foreground/60'
                }`}>
                  {formatBRL(op.pendingSalary)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {op.pendingNormais}×R$2 · {op.pendingBaixas}×R$1
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Período</p>
                <p className="text-sm font-bold text-foreground/80 mt-1">{formatBRL(op.salary)}</p>
                {totalPaidAllTime > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">pago {formatBRL(totalPaidAllTime)}</p>
                )}
              </div>
            </div>
          </div>

          {/* PIX */}
          <div className="rounded-xl border border-border/50 bg-muted/[0.04] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" /> Chave PIX para salário
              </p>
              {canEditPix && !editingPix && (
                <button
                  onClick={() => { setEditingPix(true); setPixDraft(pix); }}
                  className="text-[10px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> {hasPix ? 'Editar' : 'Adicionar'}
                </button>
              )}
            </div>

            {editingPix ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={pixDraft}
                  onChange={(e) => setPixDraft(e.target.value)}
                  placeholder="CPF, e-mail, telefone ou aleatória"
                  className="flex-1 bg-background border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={savePix}
                  disabled={savingPix}
                  className="p-2 rounded-lg bg-success/15 hover:bg-success/25 text-success border border-success/40"
                  title="Salvar"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditingPix(false); setPixDraft(pix); }}
                  className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : hasPix ? (
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm font-mono text-foreground break-all">{pix}</p>
                <button
                  onClick={copyPix}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {canEditPix ? 'Nenhuma chave cadastrada. Toque em "Adicionar".' : 'Operador ainda não informou a chave PIX.'}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="space-y-2">
            {confirmPay ? (
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs font-bold text-success">Confirmar pagamento de {formatBRL(op.pendingSalary)}?</p>
                <button
                  onClick={() => { onMarkPaid(op); setConfirmPay(false); }}
                  disabled={loadingAction}
                  className="px-3 py-2 rounded-lg bg-success/15 hover:bg-success/25 text-success border border-success/40 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Sim
                </button>
                <button
                  onClick={() => setConfirmPay(false)}
                  className="px-3 py-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40 text-xs font-bold"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmPay(true)}
                disabled={op.pendingSalary === 0}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                  op.pendingSalary === 0
                    ? 'bg-muted/10 text-muted-foreground/50 border-border/30 cursor-not-allowed'
                    : 'bg-success/15 hover:bg-success/25 text-success border-success/40'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Marcar como pago
              </button>
            )}

            {opHistory.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {confirmUndo ? (
                  <div className="col-span-2 flex items-center gap-2">
                    <p className="flex-1 text-xs font-bold text-warning">Desfazer último pagamento?</p>
                    <button
                      onClick={() => { onUndoLast(op); setConfirmUndo(false); }}
                      disabled={loadingAction}
                      className="px-3 py-2 rounded-lg bg-warning/15 hover:bg-warning/25 text-warning border border-warning/40 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Sim
                    </button>
                    <button
                      onClick={() => setConfirmUndo(false)}
                      className="px-3 py-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/40 text-xs font-bold"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowHistory(s => !s)}
                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                        showHistory
                          ? 'bg-primary/15 text-primary border-primary/40'
                          : 'bg-muted/10 hover:bg-muted/30 text-muted-foreground border-border/40'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      {showHistory ? 'Ocultar histórico' : `Histórico (${opHistory.length})`}
                    </button>
                    <button
                      onClick={() => setConfirmUndo(true)}
                      disabled={loadingAction}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30 text-xs font-semibold"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Desfazer último
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Histórico */}
          {showHistory && opHistory.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-muted/[0.03] p-3 space-y-1.5 max-h-64 overflow-y-auto">
              {opHistory.map((h, idx) => (
                <div
                  key={h.id}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs ${
                    idx === 0 ? 'border-success/30 bg-success/[0.05]' : 'border-border/40 bg-card/30'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    idx === 0 ? 'bg-success/15 text-success border border-success/30' : 'bg-muted/30 text-muted-foreground border border-border/40'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{formatBRL(h.amount)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <CalendarIcon className="w-2.5 h-2.5" />
                      {format(new Date(h.paidAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                      <span className="opacity-50">·</span>
                      <UserIcon className="w-2.5 h-2.5" /> {h.paidBy || '—'}
                    </p>
                  </div>
                  {idx !== 0 && (
                    <button
                      onClick={() => onDeleteHistory(h)}
                      disabled={loadingAction}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remover registro"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
