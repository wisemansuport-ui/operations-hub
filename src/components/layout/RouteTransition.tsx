import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Lightweight cross-fade for route changes.
 * No blur filter (too expensive on mobile GPUs) and shorter duration
 * so navigation feels snappy.
 */
export const RouteTransition = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

  if (isMobile) return <>{children}</>;

  return (
    <>
      <div
        key={pathname}
        style={{
          animation: `nytzer-route-in 180ms ${easing} both`,
          minHeight: '100dvh',
          background: 'hsl(var(--background))',
          willChange: 'opacity, transform',
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes nytzer-route-in {
          0%   { opacity: 0.15; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes nytzer-route-in { from,to { opacity: 1; transform: none; } }
        }
      `}</style>
    </>
  );
};
