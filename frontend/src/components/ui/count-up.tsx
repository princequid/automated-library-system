// frontend/src/components/ui/count-up.tsx
// Counts from 0 to a value once, on first mount only (600ms ease-out). It does NOT
// re-trigger on refetch - only on the very first successful render.
import * as React from 'react';

export function CountUp({
  value,
  duration = 600,
  decimals = 0,
  prefix = '',
  suffix = '',
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = React.useState(0);
  const done = React.useRef(false);

  React.useEffect(() => {
    if (done.current) {
      setDisplay(value);
      return;
    }
    done.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
