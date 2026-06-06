import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, Lock, Zap, ArrowRight, Ban, CreditCard, Copy } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Subscription() {
  const navigate = useNavigate();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const { users } = useFirestoreData();

  // Find the admin user for the current user
  const adminUser = user?.role === 'ADMIN' 
    ? users.find(u => u.username === user.username)
    : users.find(u => u.username === user.affiliatedTo);

  const expDate = adminUser?.planExpiry ? new Date(adminUser.planExpiry) : null;
  const isExpired = expDate ? !isAfter(expDate, new Date()) : false;

  const handleCopyPix = () => {
    navigator.clipboard.writeText('SUA-CHAVE-PIX-AQUI');
    toast.success('Chave PIX copiada!');
  };

  return (
    <div className="relative min-h-full -mx-2 sm:-mx-4 -my-4 px-4 sm:px-6 py-10 bg-[#07070a] text-foreground flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        
        <div className="text-center space-y-3">
          {isExpired ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 mb-4">
              <Ban className="w-8 h-8 text-destructive" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          )}
          
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            {isExpired ? 'Acesso Bloqueado' : 'Sua Assinatura Nytzer'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {isExpired 
              ? 'O período da sua assinatura expirou. Renove agora para liberar o acesso de toda a sua operação.'
              : 'Você tem acesso liberado a todos os recursos da plataforma.'}
          </p>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-background/50 border border-border/30">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">
                Status Atual
              </div>
              <div className="text-lg font-black text-foreground flex items-center gap-2">
                {isExpired ? (
                  <><span className="w-2 h-2 rounded-full bg-destructive"></span> Expirada</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-primary"></span> Ativa</>
                )}
              </div>
            </div>
            {expDate && (
              <div className="md:text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">
                  Válida até
                </div>
                <div className="text-lg font-black text-foreground">
                  {format(expDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-border/30">
            <h3 className="text-lg font-bold text-foreground">Como renovar?</h3>
            <p className="text-sm text-muted-foreground">
              O valor da renovação mensal é de <strong>R$ 500,00</strong>. Faça o pagamento via PIX para a chave abaixo e envie o comprovante para o administrador central.
            </p>
            
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Chave PIX (E-mail ou CPF/CNPJ)</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-background border border-border/50 text-primary font-mono text-sm">
                    pix@nytzervision.com
                  </code>
                  <button 
                    onClick={handleCopyPix}
                    className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isExpired && (
          <div className="text-center">
            <button 
              onClick={() => navigate('/app')} 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
            >
              ← Voltar ao dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
