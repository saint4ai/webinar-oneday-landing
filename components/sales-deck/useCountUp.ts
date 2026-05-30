"use client";

import { useEffect, useState } from "react";

/**
 * useCountUp — счёт от 0 до target на маунте (ease-out-cubic). Для гигант-цифр.
 * Слайды деки маунтятся при навигации → анимация играет при показе.
 */
export function useCountUp(target: number, duration = 1.6, delay = 0.35) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const id = setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const p = Math.min((now - start) / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(Math.floor(target * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
        else setV(target);
      };
      raf = requestAnimationFrame(tick);
    }, delay * 1000);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return v;
}
