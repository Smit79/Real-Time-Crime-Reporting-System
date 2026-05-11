import { useEffect, useState } from 'react';

const useCountUp = ({ end = 0, duration = 900, start = 0 }) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    const target = Number(end);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCount(target);
      return;
    }

    const startAt = performance.now();
    let frameId = null;

    const animate = (now) => {
      const progress = Math.min((now - startAt) / duration, 1);
      const next = Math.round(start + (target - start) * progress);
      setCount(next);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [duration, end, start]);

  return count;
};

export default useCountUp;
