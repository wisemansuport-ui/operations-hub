import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Crown, ArrowRight, Zap } from 'lucide-react';
import { usePlan } from '../hooks/usePlan';

export const PlanGuard = ({ children }: { children: ReactNode }) => {
  const plan = usePlan();
  const navigate = useNavigate();

  // Operadores e usuários sem role admin sempre passam
  if (!plan.isAdmin) return <>{children}</>;

  // Plano ativo ou trial válido — acesso liberado
  if (plan.canAccess) return <>{children}</>;

  // Trial expirado ou sem plano — tela de bloqueio
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground">Acesso suspenso</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Seu período de trial gratuito de <strong className="text-foreground">3 dias</strong> expirou.
            Assine um dos nossos planos para continuar gerenciando suas operações sem interrupção.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/subscription')}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-[0_5px_20px_hsl(var(--primary)/0.3)]"
          >
            <Crown className="w-5 h-5" />
            Ver planos e assinar
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-3 gap-2 text-center">
            {['A partir de R$ 49/mês', 'Cancele quando quiser', 'Ative em segundos'].map((text) => (
              <div key={text} className="rounded-lg bg-muted/30 border border-border/30 px-2 py-2">
                <p className="text-[10px] text-muted-foreground font-medium leading-tight">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground/50">
          <Zap className="w-4 h-4" />
          <span className="text-xs font-bold tracking-widest uppercase">NytzerVision</span>
        </div>
      </div>
    </div>
  );
};
