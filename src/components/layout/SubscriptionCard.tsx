import { useNavigate } from 'react-router-dom';
import { Zap, Crown, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { usePlan } from '../../hooks/usePlan';

export const SubscriptionCard = ({ collapsed }: { collapsed: boolean }) => {
  const navigate = useNavigate();
  const plan = usePlan();

  if (!plan.isAdmin || collapsed) return null;

  const isTrial = plan.status === 'trial';
  const isActive = plan.status === 'active';
  const isExpired = plan.status === 'expired';

  // Urgência: menos de 24h restantes
  const isUrgent = isTrial && plan.hoursLeft <= 24;

  if (isActive) {
    return (
      <div
        onClick={() => navigate('/subscription')}
        className="mx-3 mb-1 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 cursor-pointer hover:bg-primary/10 transition-all group"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-wide">Assinatura Ativa</span>
          </div>
          <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {plan.planName} · {plan.daysLeft}d restantes
        </p>
      </div>
    );
  }

  if (isTrial) {
    return (
      <div
        onClick={() => navigate('/subscription')}
        className={`mx-3 mb-1 rounded-xl border px-3 py-2.5 cursor-pointer transition-all group ${
          isUrgent
            ? 'border-red-500/50 bg-red-500/10 hover:bg-red-500/15'
            : 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {isUrgent
              ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              : <Clock className="w-3.5 h-3.5 text-yellow-400" />
            }
            <span className={`text-[11px] font-bold uppercase tracking-wide ${isUrgent ? 'text-red-400' : 'text-yellow-400'}`}>
              Trial Grátis
            </span>
          </div>
          <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>

        {/* Timer bar */}
        <div className="w-full h-1 rounded-full bg-black/30 mb-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isUrgent ? 'bg-red-500' : 'bg-yellow-400'}`}
            style={{ width: `${Math.max(2, (plan.hoursLeft / 72) * 100)}%` }}
          />
        </div>

        <p className={`text-[10px] font-medium ${isUrgent ? 'text-red-300' : 'text-yellow-300/80'}`}>
          {plan.daysLeft > 0
            ? `${plan.daysLeft}d ${plan.hoursLeft % 24}h restantes`
            : `${plan.hoursLeft}h restantes`
          } · Assinar agora
        </p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div
        onClick={() => navigate('/subscription')}
        className="mx-3 mb-1 rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2.5 cursor-pointer hover:bg-red-500/15 transition-all group animate-pulse"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wide">Acesso Bloqueado</span>
          </div>
          <ChevronRight className="w-3 h-3 text-red-400" />
        </div>
        <p className="text-[10px] text-red-300/80">Trial expirado · Clique para assinar</p>
      </div>
    );
  }

  // Sem plano (novo admin sem trial)
  return (
    <div
      onClick={() => navigate('/subscription')}
      className="mx-3 mb-1 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 px-3 py-2.5 cursor-pointer hover:from-primary/15 transition-all group"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold text-primary uppercase tracking-wide">Começar Trial</span>
        </div>
        <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <p className="text-[10px] text-muted-foreground">3 dias grátis · Sem cartão</p>
    </div>
  );
};
