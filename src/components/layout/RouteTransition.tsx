import { type ReactNode, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Lightweight cross-fade for route changes.
 * IMPORTANT: We must NOT use key={pathname} on the outer wrapper because that
 * forces React to unmount/remount the entire tree (including Suspense boundaries),
 * causing a black screen while lazy-loaded pages re-initialize.
 * Instead, we animate only a transparent overlay element keyed by pathname.
 */
export const RouteTransition = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

  if (isMobile) return <>{children}</>;

  return (
    <div style={{ position: 'relative', minHeight: '100dvh' }}>
      {/* Overlay that fades in on each route change — keyed so it remounts and replays animation */}
      <div
        key={pathname}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: 'hsl(var(--background))',
          animation: `nytzer-route-overlay 220ms ${easing} both`,
          pointerEvents: 'none',
          zIndex: 10,
          willChange: 'opacity',
        }}
      />
      {/* Children are NEVER remounted — only the overlay above animates */}
      <div style={{ position: 'relative', zIndex: 11 }}>
        {children}
      </div>
      <style>{`
        @keyframes nytzer-route-overlay {
          0%   { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes nytzer-route-overlay { from, to { opacity: 0; } }
        }
      `}</style>
    </div>
  );
};
