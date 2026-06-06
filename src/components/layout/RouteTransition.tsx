import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Cross-fade route transition. Keeps the previous page mounted for a brief
 * window so we get a true overlap between out → in instead of a hard cut.
 * Avoids layout shift by absolutely positioning the outgoing layer.
 */
export const RouteTransition = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [current, setCurrent] = useState({ key: location.pathname, node: children });
  const [previous, setPrevious] = useState<{ key: string; node: ReactNode } | null>(null);
  const prevKeyRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname === prevKeyRef.current) {
      // Same path — just refresh node reference
      setCurrent({ key: location.pathname, node: children });
      return;
    }
    setPrevious(current);
    setCurrent({ key: location.pathname, node: children });
    prevKeyRef.current = location.pathname;
    const t = window.setTimeout(() => setPrevious(null), 360);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, children]);

  const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <div className="relative isolate">
      {previous && (
        <div
          key={previous.key}
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            animation: `nytzer-route-out 320ms ${easing} forwards`,
            willChange: 'opacity, transform',
          }}
        >
          {previous.node}
        </div>
      )}
      <div
        key={current.key}
        style={{
          animation: `nytzer-route-in 380ms ${easing} both`,
          willChange: 'opacity, transform',
        }}
      >
        {current.node}
      </div>

      <style>{`
        @keyframes nytzer-route-in {
          0%   { opacity: 0; transform: translateY(6px) scale(0.992); filter: blur(2px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes nytzer-route-out {
          0%   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          100% { opacity: 0; transform: translateY(-4px) scale(0.998); filter: blur(2px); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes nytzer-route-in  { from,to { opacity: 1; transform: none; filter: none; } }
          @keyframes nytzer-route-out { from,to { opacity: 0; transform: none; filter: none; } }
        }
      `}</style>
    </div>
  );
};
