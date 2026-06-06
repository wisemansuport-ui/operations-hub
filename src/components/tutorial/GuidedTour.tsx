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
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const GuidedTour = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<ActiveTourState | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const prevStepRef = useRef<number>(-1);
  const prevRouteRef = useRef<string | null>(null);

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

  // Hide tooltip immediately on step change — it fades back in once the target
  // is measured and stable, so the user never sees a misaligned tooltip.
  useEffect(() => {
    if (!state) { setTooltipVisible(false); return; }
    if (prevStepRef.current !== state.step) {
      setTooltipVisible(false);
      prevStepRef.current = state.step;
    }
  }, [state]);

  // Navigate immediately when the step's route differs. No artificial pause —
  // the perceived smoothness comes from cross-fading the spotlight/tooltip.
  useEffect(() => {
    if (!step) return;
    if (location.pathname !== step.route) {
      setRect(null);
      setTooltipVisible(false);
      setTransitioning(true);
      navigate(step.route);
      return;
    }
    if (prevRouteRef.current !== step.route) {
      prevRouteRef.current = step.route;
    }
  }, [step, location.pathname, navigate]);

  // Track target rect with scroll-aware measurements, then reveal the tooltip
  // only after the rect has been stable for a couple of frames so it never
  // appears misaligned during the smooth-scroll animation.
  useLayoutEffect(() => {
    if (!step) { setRect(null); return; }
    if (location.pathname !== step.route) { setRect(null); return; }

    let retryTimer = 0;
    let followRaf = 0;
    let stableTimer = 0;
    let tries = 0;
    let cancelled = false;
    let lastSig = '';
    let stableSince = 0;

    const getTarget = () => (step.selector ? document.querySelector(step.selector) as HTMLElement | null : null);

    const sig = (r: DOMRect) => `${Math.round(r.left)}x${Math.round(r.top)}x${Math.round(r.width)}x${Math.round(r.height)}`;

    const followScroll = (el: HTMLElement, startedAt = performance.now()) => {
      if (cancelled) return;
      const next = el.getBoundingClientRect();
      if (next.width > 0 && next.height > 0) {
        setRect(next);
        const s = sig(next);
        const now = performance.now();
        if (s === lastSig) {
          if (now - stableSince > 140) {
            setTransitioning(false);
            setTooltipVisible(true);
            return;
          }
        } else {
          lastSig = s;
          stableSince = now;
        }
      }
      if (performance.now() - startedAt < 1600) {
        followRaf = requestAnimationFrame(() => followScroll(el, startedAt));
      } else {
        setTransitioning(false);
        setTooltipVisible(true);
      }
    };

    const tryFind = () => {
      tries++;
      const el = getTarget();
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) setRect(r);
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        followScroll(el);
      } else if (step.selector && tries < 50) {
        retryTimer = window.setTimeout(tryFind, 80) as unknown as number;
        return;
      } else {
        setRect(null);
        // No target — show the centered fallback tooltip after a short beat
        stableTimer = window.setTimeout(() => {
          setTransitioning(false);
          setTooltipVisible(true);
        }, 220) as unknown as number;
      }
    };
    tryFind();

    const onResize = () => {
      const el = getTarget();
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      clearTimeout(stableTimer);
      cancelAnimationFrame(followRaf);
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
    setTransitioning(true);
    setTooltipVisible(false);
    setRect(null);
    setTimeout(() => {
      close();
      navigate('/tutorial');
    }, 360);
  }, [state, close, navigate]);

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
    ? (() => {
        const width = Math.min(rect.width + PAD * 2, vw - 24);
        const height = Math.min(rect.height + PAD * 2, vh - 24);
        return {
          left: clamp(rect.left - PAD, 12, Math.max(12, vw - width - 12)),
          top: clamp(rect.top - PAD, 12, Math.max(12, vh - height - 12)),
          width,
          height,
        };
      })()
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
    <div
      className="fixed inset-0"
      style={{
        zIndex: 9990,
        opacity: transitioning ? 0 : 1,
        transition: `opacity 320ms ${easing}`,
      }}
    >
      {/* Backdrop click-catcher */}
      <div className="fixed inset-0 pointer-events-auto" style={{ zIndex: 9990 }} aria-hidden />

      {/* Animated spotlight via box-shadow trick — the transform follows route
          changes and scroll motion smoothly instead of snapping. */}
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 9991,
          left: 0,
          top: 0,
          width: spot.width,
          height: spot.height,
          transform: `translate3d(${spot.left}px, ${spot.top}px, 0)`,
          borderRadius: 16,
          boxShadow:
            '0 0 0 9999px hsl(var(--background) / 0.82), 0 0 0 1px hsl(var(--primary) / 0.88), 0 0 34px 6px hsl(var(--primary) / 0.42), inset 0 0 18px hsl(var(--primary) / 0.12)',
          transition: `transform 720ms ${easing}, width 640ms ${easing}, height 640ms ${easing}, box-shadow 420ms ease-out, opacity 260ms ease-out`,
          opacity: rect ? 1 : 0.92,
          willChange: 'transform, width, height, opacity',
        }}
      />

      {/* Tooltip card */}
      <div
        style={{
          ...tooltipStyle,
          transform: rect
            ? `translateY(${tooltipVisible ? 0 : 10}px) scale(${tooltipVisible ? 1 : 0.98})`
            : `translate(-50%, ${tooltipVisible ? 0 : 10}px) scale(${tooltipVisible ? 1 : 0.98})`,
          transition: `opacity 320ms ease-out, transform 440ms ${easing}, left 560ms ${easing}, top 560ms ${easing}`,
          opacity: tooltipVisible ? 1 : 0,
          willChange: 'transform, opacity, left, top',
        }}
        className="surface-3 hairline-gold rounded-2xl p-5 shadow-[0_24px_70px_hsl(var(--background)/0.65)] pointer-events-auto"
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
