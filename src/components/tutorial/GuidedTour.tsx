import { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';
import {
  TOURS,
  TOUR_STORAGE_KEY,
  markTourStepReached,
  markTourCompleted,
  type ActiveTourState,
} from '@/lib/tours';

const PAD = 10;
const FALLBACK_SIZE = { w: 280, h: 80 };

export const GuidedTour = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<ActiveTourState | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const prevStepRef = useRef<number>(-1);

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

  // Persist progress whenever the visible step changes
  useEffect(() => {
    if (state && tour) markTourStepReached(state.tourId, state.step);
  }, [state, tour]);

  // Smooth fade for tooltip on step change
  useEffect(() => {
    if (!state) { setTooltipVisible(false); return; }
    if (prevStepRef.current !== state.step) {
      setTooltipVisible(false);
      const t = setTimeout(() => setTooltipVisible(true), 180);
      prevStepRef.current = state.step;
      return () => clearTimeout(t);
    }
    setTooltipVisible(true);
  }, [state]);

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
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // give the scroll a moment so the highlight lands where the eye lands
        setTimeout(() => setRect(el.getBoundingClientRect()), 250);
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

  const finish = useCallback(() => {
    if (state) markTourCompleted(state.tourId);
    close();
  }, [state, close]);

  const goto = useCallback((idx: number) => {
    if (!tour || !state) return;
    const next: ActiveTourState = { tourId: state.tourId, step: idx };
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(next));
    setState(next);
  }, [tour, state]);

  if (!tour || !step || !state) return null;
  if (location.pathname !== step.route) return null;

  const isLast = state.step === tour.steps.length - 1;
  const isFirst = state.step === 0;

  // Spotlight box (animated). If no rect, center a soft fallback so the
  // transition between steps still feels alive.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const spot = rect
    ? {
        left: rect.left - PAD,
        top: rect.top - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : {
        left: vw / 2 - FALLBACK_SIZE.w / 2,
        top: vh / 2 - FALLBACK_SIZE.h / 2,
        width: FALLBACK_SIZE.w,
        height: FALLBACK_SIZE.h,
      };

  // Tooltip position
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10000,
    left: '50%',
    top: 'calc(50% + 80px)',
    transform: 'translate(-50%, 0)',
    maxWidth: 'min(420px, 92vw)',
    width: 380,
  };
  if (rect) {
    const TT_W = 380;
    const TT_H = 220;
    const spaceRight = vw - rect.right;
    const spaceBelow = vh - rect.bottom;
    if (spaceRight > TT_W + 24) {
      tooltipStyle = {
        position: 'fixed', zIndex: 10000,
        left: Math.min(rect.right + 20, vw - TT_W - 16),
        top: Math.max(16, Math.min(rect.top, vh - TT_H - 16)),
        width: TT_W,
      };
    } else if (spaceBelow > TT_H + 24) {
      tooltipStyle = {
        position: 'fixed', zIndex: 10000,
        left: Math.max(16, Math.min(rect.left, vw - TT_W - 16)),
        top: rect.bottom + 16,
        width: TT_W,
      };
    } else {
      tooltipStyle = {
        position: 'fixed', zIndex: 10000,
        left: Math.max(16, Math.min(rect.left, vw - TT_W - 16)),
        top: Math.max(16, rect.top - TT_H - 16),
        width: TT_W,
      };
    }
  }

  const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 9990 }}>
      {/* Backdrop click-catcher */}
      <div className="fixed inset-0 pointer-events-auto" style={{ zIndex: 9990 }} aria-hidden />

      {/* Animated spotlight via box-shadow trick — smoothly transitions
          left/top/width/height between steps without SVG remounts. */}
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 9991,
          left: spot.left,
          top: spot.top,
          width: spot.width,
          height: spot.height,
          borderRadius: 16,
          boxShadow:
            '0 0 0 9999px rgba(0,0,0,0.78), 0 0 0 2px hsl(var(--primary)), 0 0 28px 4px hsl(var(--primary) / 0.55)',
          transition: `left 520ms ${easing}, top 520ms ${easing}, width 520ms ${easing}, height 520ms ${easing}, box-shadow 320ms ease-out, opacity 220ms ease-out`,
          opacity: rect ? 1 : 0.92,
        }}
      />

      {/* Tooltip card */}
      <div
        style={{
          ...tooltipStyle,
          transition: `opacity 280ms ease-out, transform 320ms ${easing}, left 420ms ${easing}, top 420ms ${easing}`,
          opacity: tooltipVisible ? 1 : 0,
        }}
        className="surface-3 hairline-gold rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] pointer-events-auto"
      >
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
            className="h-full bg-primary"
            style={{
              width: `${((state.step + 1) / tour.steps.length) * 100}%`,
              transition: `width 600ms ${easing}`,
              boxShadow: '0 0 10px hsl(var(--primary) / 0.6)',
            }}
          />
        </div>

        <div
          key={state.step}
          className="animate-fade-in"
        >
          <h3 className="text-base font-black text-foreground tracking-tight mb-1.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> {step.title}
          </h3>
          <p className="text-xs text-foreground/85 leading-relaxed mb-4">{step.description}</p>
        </div>

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
                onClick={finish}
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
