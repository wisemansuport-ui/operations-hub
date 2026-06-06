import { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { TOURS, TOUR_STORAGE_KEY, type ActiveTourState } from '@/lib/tours';

const PAD = 10;

export const GuidedTour = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<ActiveTourState | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Bootstrap from localStorage + listen to start event
  useEffect(() => {
    const load = () => {
      const raw = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!raw) return setState(null);
      try { setState(JSON.parse(raw)); } catch { setState(null); }
    };
    load();
    const onStart = (e: Event) => {
      const detail = (e as CustomEvent).detail as ActiveTourState;
      setState(detail);
    };
    window.addEventListener('nytzer-tour-start', onStart);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('nytzer-tour-start', onStart);
      window.removeEventListener('storage', load);
    };
  }, []);

  const tour = state ? TOURS[state.tourId] : null;
  const step = tour && state ? tour.steps[state.step] : null;

  // Navigate to step route when out of sync
  useEffect(() => {
    if (!step) return;
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [step, location.pathname, navigate]);

  // Track target rect
  useLayoutEffect(() => {
    if (!step) { setRect(null); return; }
    if (location.pathname !== step.route) { setRect(null); return; }

    let raf = 0;
    let tries = 0;
    const tryFind = () => {
      tries++;
      const el = step.selector ? document.querySelector(step.selector) as HTMLElement | null : null;
      if (el) {
        setRect(el.getBoundingClientRect());
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (step.selector && tries < 40) {
        raf = window.setTimeout(tryFind, 100) as unknown as number;
        return;
      } else {
        setRect(null);
      }
    };
    tryFind();

    const onResize = () => {
      const el = step.selector ? document.querySelector(step.selector) as HTMLElement | null : null;
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      clearTimeout(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [step, location.pathname]);

  const close = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setState(null);
    setRect(null);
  }, []);

  const goto = useCallback((idx: number) => {
    if (!tour || !state) return;
    const next: ActiveTourState = { tourId: state.tourId, step: idx };
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(next));
    setState(next);
  }, [tour, state]);

  if (!tour || !step || !state) return null;
  // While navigating, hold rendering until we land on right route
  if (location.pathname !== step.route) return null;

  const isLast = state.step === tour.steps.length - 1;
  const isFirst = state.step === 0;

  // Compute tooltip position
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10000,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: 'min(420px, 92vw)',
  };
  if (rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const TT_W = 380;
    const TT_H = 200;
    const spaceRight = vw - rect.right;
    const spaceBelow = vh - rect.bottom;
    if (spaceRight > TT_W + 24) {
      tooltipStyle = {
        position: 'fixed',
        zIndex: 10000,
        left: Math.min(rect.right + 20, vw - TT_W - 16),
        top: Math.max(16, Math.min(rect.top, vh - TT_H - 16)),
        width: TT_W,
      };
    } else if (spaceBelow > TT_H + 24) {
      tooltipStyle = {
        position: 'fixed',
        zIndex: 10000,
        left: Math.max(16, Math.min(rect.left, vw - TT_W - 16)),
        top: rect.bottom + 16,
        width: TT_W,
      };
    } else {
      tooltipStyle = {
        position: 'fixed',
        zIndex: 10000,
        left: Math.max(16, Math.min(rect.left, vw - TT_W - 16)),
        top: Math.max(16, rect.top - TT_H - 16),
        width: TT_W,
      };
    }
  }

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 9990 }}>
      {/* Backdrop with optional spotlight hole via SVG mask */}
      {rect ? (
        <svg className="fixed inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 9991 }}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - PAD}
                y={rect.top - PAD}
                width={rect.width + PAD * 2}
                height={rect.height + PAD * 2}
                rx={16}
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.78)" mask="url(#tour-mask)" />
          <rect
            x={rect.left - PAD}
            y={rect.top - PAD}
            width={rect.width + PAD * 2}
            height={rect.height + PAD * 2}
            rx={16}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            style={{ filter: 'drop-shadow(0 0 18px hsl(var(--primary) / 0.7))' }}
          />
        </svg>
      ) : (
        <div className="fixed inset-0 bg-black/80 pointer-events-auto" style={{ zIndex: 9991 }} />
      )}

      {/* Tooltip card */}
      <div style={tooltipStyle} className="surface-3 hairline-gold rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-fade-in">
        <div className="flex items-center justify-between mb-2 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em] font-black text-primary">
              Passo {state.step + 1} de {tour.steps.length}
            </span>
          </div>
          <button onClick={close} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Sair do tour">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-1 rounded-full bg-muted/40 overflow-hidden mb-4">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((state.step + 1) / tour.steps.length) * 100}%` }}
          />
        </div>

        <h3 className="text-base font-black text-foreground tracking-tight mb-1.5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> {step.title}
        </h3>
        <p className="text-xs text-foreground/85 leading-relaxed mb-4">{step.description}</p>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={close}
            className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
          >
            Sair
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => goto(state.step - 1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 border border-border text-foreground transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Anterior
              </button>
            )}
            {isLast ? (
              <button
                onClick={close}
                className="inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] transition-all"
              >
                <Check className="w-3.5 h-3.5" /> Concluir
              </button>
            ) : (
              <button
                onClick={() => goto(state.step + 1)}
                className="inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] transition-all"
              >
                Próximo <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
