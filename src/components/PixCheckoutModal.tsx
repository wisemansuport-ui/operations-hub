import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Loader2, QrCode, Smartphone, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { isAfter } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  description: string;
  plan: 'solo' | 'team';
  operators?: number;
  extendDays?: number;
  admin: { id: string; username: string; email?: string; planExpiry?: string | null };
  onPaid?: () => void;
}

interface PixPayload {
  paymentId: number;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
  expiresAt?: string;
  amount: number;
}

export const PixCheckoutModal = ({
  open, onOpenChange, amount, description, plan, operators = 0, extendDays = 30, admin, onPaid,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<PixPayload | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const pollRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const reset = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    if (tickRef.current) window.clearInterval(tickRef.current);
    pollRef.current = null;
    tickRef.current = null;
    setPix(null);
    setStatus('idle');
    setCopied(false);
    setSecondsLeft(15 * 60);
  };

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    void createPix();
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const createPix = async () => {
    setLoading(true);
    setStatus('pending');
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-pix', {
        body: {
          amount,
          description,
          payerEmail: admin.email || `${admin.username}@nytzervision.app`,
          payerName: admin.username,
          adminId: admin.id,
          adminUsername: admin.username,
          plan,
          operators,
          extendDays,
        },
      });
      if (error) throw error;
      if (!data?.qrCode) throw new Error('QR Code não retornado');
      setPix(data as PixPayload);
      startPolling((data as PixPayload).paymentId);
      startTicker();
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      toast.error(e?.message || 'Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  const startTicker = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
  };

  const startPolling = (paymentId: number) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('mercadopago-check-payment', {
          body: { id: paymentId },
        });
        if (error) return;
        if (data?.status === 'approved') {
          if (pollRef.current) window.clearInterval(pollRef.current);
          if (tickRef.current) window.clearInterval(tickRef.current);
          await confirmPayment(paymentId, data.amount);
        }
      } catch (_) { /* silencioso */ }
    }, 3000);
  };

  const confirmPayment = async (paymentId: number, paidAmount: number) => {
    try {
      // Estende o planExpiry +extendDays
      const current = admin.planExpiry ? new Date(admin.planExpiry) : new Date();
      const base = isAfter(current, new Date()) ? current : new Date();
      const newExpiry = new Date(base.getTime() + extendDays * 86400000).toISOString();

      await updateDoc(doc(db, 'users', admin.id), {
        planExpiry: newExpiry,
        plan: 'active',
        planTier: plan === 'team' ? 'pro' : 'solo',
      });

      await addDoc(collection(db, 'subscription_payments'), {
        adminId: admin.id,
        adminUsername: admin.username,
        amount: paidAmount,
        date: new Date().toISOString().slice(0, 10),
        method: 'pix-mercadopago',
        mpPaymentId: String(paymentId),
        plan,
        operators,
        createdAt: serverTimestamp(),
      });

      setStatus('approved');
      toast.success('Pagamento confirmado! Acesso liberado.');
      onPaid?.();
      setTimeout(() => onOpenChange(false), 2500);
    } catch (e) {
      console.error(e);
      toast.error('Pagamento aprovado mas houve erro ao liberar — contate o suporte.');
    }
  };

  const copy = async () => {
    if (!pix?.qrCode) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    toast.success('Código PIX copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-primary/30 bg-background">
        <div className="relative">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />

          <DialogHeader className="relative px-6 pt-6 pb-4 border-b border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-primary" />
              </div>
              <div className="text-[10px] font-bold tracking-widest text-primary uppercase">
                Pagamento via PIX
              </div>
            </div>
            <DialogTitle className="text-xl font-black">
              R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="relative p-6 space-y-4">
            {status === 'approved' ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-400" strokeWidth={3} />
                </div>
                <h3 className="text-lg font-black text-emerald-400">Pagamento confirmado!</h3>
                <p className="text-xs text-muted-foreground">
                  Seu acesso foi liberado por mais {extendDays} dias.
                </p>
              </div>
            ) : status === 'error' ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 border border-destructive/40 flex items-center justify-center">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-black text-destructive">Erro ao gerar PIX</h3>
                <Button onClick={createPix} variant="outline" size="sm">Tentar novamente</Button>
              </div>
            ) : loading || !pix ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-3" />
                <p className="text-xs text-muted-foreground">Gerando QR Code...</p>
              </div>
            ) : (
              <>
                {/* QR Code */}
                <div className="bg-white p-4 rounded-2xl mx-auto w-fit shadow-lg shadow-primary/10">
                  <img
                    src={`data:image/png;base64,${pix.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 block"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-muted-foreground">
                    Aguardando pagamento · expira em <span className="text-primary font-bold tabular-nums">{mm}:{ss}</span>
                  </span>
                </div>

                {/* Copia e cola */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Pix Copia e Cola
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      readOnly
                      value={pix.qrCode}
                      className="flex-1 px-3 py-2 rounded-lg bg-muted/40 border border-border/60 text-[10px] font-mono truncate"
                    />
                    <Button onClick={copy} variant="outline" size="sm" className="shrink-0">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/40">
                    <Smartphone className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <p className="text-[9px] text-muted-foreground leading-tight">Abra o app do banco</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/40">
                    <QrCode className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <p className="text-[9px] text-muted-foreground leading-tight">Escaneie o QR</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/40">
                    <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <p className="text-[9px] text-muted-foreground leading-tight">Liberação automática</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
