import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Lightweight cross-fade for route changes. We re-key the wrapper on
 * pathname so the new page mounts with a soft fade + tiny rise, avoiding
 * the "hard cut" feel while keeping navigation snappy.
 */
export const RouteTransition = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <>
      <div
        key={pathname}
        style={{
          animation: `nytzer-route-in 420ms ${easing} both`,
          willChange: 'opacity, transform, filter',
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes nytzer-route-in {
          0%   { opacity: 0; transform: translateY(8px) scale(0.994); filter: blur(4px); }
          55%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes nytzer-route-in { from,to { opacity: 1; transform: none; filter: none; } }
        }
      `}</style>
    </>
  );
};
