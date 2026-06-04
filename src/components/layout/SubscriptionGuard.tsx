import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFirestoreData } from '../../hooks/useFirestoreData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { isAfter } from 'date-fns';
import { AlertTriangle, Lock } from 'lucide-react';

export const SubscriptionGuard = ({ children }: { children: React.ReactNode }) => {
  const { users, loading } = useFirestoreData();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const location = useLocation();

  if (loading || !user) return <>{children}</>;

  // O master 'nytzer' nunca é bloqueado
  if (user.username === 'nytzer') {
    return <>{children}</>;
  }

  // Descobrir quem é o admin responsável
  let adminUser = user.role === 'ADMIN' 
    ? users.find(u => u.username === user.username)
    : users.find(u => u.username === user.affiliatedTo);

  // Se não encontrar, apenas permite (fallback)
  if (!adminUser) return <>{children}</>;

  const expDate = adminUser.planExpiry ? new Date(adminUser.planExpiry) : null;
  
  // Se não tem data de expiração, permite acesso (contas muito antigas talvez?)
  // Idealmente, todos terão planExpiry agora.
  if (!expDate) return <>{children}</>;

  const isExpired = !isAfter(expDate, new Date());

  if (isExpired) {
    // Redireciona para a tela de assinatura bloqueada se tentar acessar outras rotas
    if (location.pathname !== '/subscription') {
      return <Navigate to="/subscription" replace />;
    }
  }

  return <>{children}</>;
};
