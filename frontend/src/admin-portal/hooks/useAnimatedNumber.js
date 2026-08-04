// src/admin-portal/hooks/useAnimatedNumber.js
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

const EASE_OUT = (t) => 1 - Math.pow(1 - t, 3);
const DURATION_MS = 600;

/** Animates numeric transitions for KPI figures; snaps instantly under reduced-motion. */
export function useAnimatedNumber(value) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef();

  useEffect(() => {
    const target = typeof value === 'number' && Number.isFinite(value) ? value : 0;

    if (reducedMotion) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    if (from === target) return;

    const start = performance.now();
    cancelAnimationFrame(frameRef.current);

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const eased = EASE_OUT(progress);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reducedMotion]);

  return display;
}
