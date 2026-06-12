import { useLocalStorage } from './useLocalStorage';
import { useMemo } from 'react';

export type PlanStatus = 'trial' | 'active' | 'expired' | 'none' | 'eternal';

export interface PlanInfo {
  status: PlanStatus;
  daysLeft: number;
  hoursLeft: number;
  planName: string;
  planExpiry: string | null;
  trialStartedAt: string | null;
  isAdmin: boolean;
  canAccess: boolean;
}

// Contas de desenvolvedor com acesso eterno
const DEV_ACCOUNTS = ['nytzer'];

export const usePlan = (): PlanInfo => {
  const [user] = useLocalStorage<any>('nytzer-user', null);

  return useMemo(() => {
    const isAdmin = user?.role === 'ADMIN';
    const isDev = !!user?.username && DEV_ACCOUNTS.includes(String(user.username).toLowerCase());

    if (isDev) {
      return {
        status: 'eternal',
        daysLeft: Infinity,
        hoursLeft: Infinity,
        planName: 'Desenvolvedor · Eterno',
        planExpiry: null,
        trialStartedAt: user?.createdAt || null,
        isAdmin: true,
        canAccess: true,
      };
    }

    if (!user || !isAdmin) {
      return {
        status: 'none',
        daysLeft: 0,
        hoursLeft: 0,
        planName: 'Operador',
        planExpiry: null,
        trialStartedAt: null,
        isAdmin: false,
        canAccess: true, // Operadores sempre têm acesso (gerenciado pelo ADMIN)
      };
    }

    const now = new Date();
    const planExpiry = user.planExpiry ? new Date(user.planExpiry) : null;
    const plan = user.plan || 'none';

    if (plan === 'active' && planExpiry && planExpiry > now) {
      const msLeft = planExpiry.getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      return {
        status: 'active',
        daysLeft,
        hoursLeft: Math.ceil(msLeft / (1000 * 60 * 60)),
        planName: user.planTier === 'pro' ? 'Pro' : user.planTier === 'business' ? 'Business' : 'Básico',
        planExpiry: user.planExpiry,
        trialStartedAt: user.trialStartedAt || null,
        isAdmin: true,
        canAccess: true,
      };
    }

    if (plan === 'trial') {
      const trialStart = user.trialStartedAt ? new Date(user.trialStartedAt) : now;
      const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 dias
      const msLeft = trialEnd.getTime() - now.getTime();

      if (msLeft > 0) {
        const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
        return {
          status: 'trial',
          daysLeft,
          hoursLeft,
          planName: 'Trial Grátis',
          planExpiry: trialEnd.toISOString(),
          trialStartedAt: user.trialStartedAt,
          isAdmin: true,
          canAccess: true,
        };
      } else {
        return {
          status: 'expired',
          daysLeft: 0,
          hoursLeft: 0,
          planName: 'Trial Expirado',
          planExpiry: null,
          trialStartedAt: user.trialStartedAt,
          isAdmin: true,
          canAccess: false,
        };
      }
    }

    // Sem plano ou expirado
    return {
      status: 'expired',
      daysLeft: 0,
      hoursLeft: 0,
      planName: 'Sem Plano',
      planExpiry: null,
      trialStartedAt: null,
      isAdmin: true,
      canAccess: false,
    };
  }, [user]);
};
