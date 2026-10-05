"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Бесконечная лента рилсов: карточки едут справа налево без конца, края ленты растворяются.
 * amp > 0 — «змейка»: каждая карточка плывёт по синусоиде, соседние всегда в противофазе (одна выше, другая ниже),
 * и по мере движения плавно меняются местами, с лёгким наклоном по ходу волны.
 * Позиции считаются в requestAnimationFrame и пишутся прямо в transform, без перерисовки React.
 * Если карточек мало для бесконечности, набор повторяется, пока лента не станет шире окна на одну карточку.
 */
export function ReelRail<T>({ items, render, itemWidth, gap = 0.12, amp = 0, speed = 0.32, tilt = 3, style }: {
  items: T[];
  render: (item: T, i: number) => ReactNode;
  itemWidth: string; // ширина карточки, например "9cqw"
  gap?: number; // зазор между карточками в долях ширины карточки
  amp?: string | number; // амплитуда змейки, например "1.6cqw"; 0 — ровная лента
  speed?: number; // скорость в ширинах карточки за секунду
  tilt?: number; // наклон на гребне волны, градусы (только для змейки)
  style?: CSSProperties;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const ampRef = useRef<HTMLDivElement>(null);
  const snake = amp !== 0 && amp !== "0";

  // повторяем набор, чтобы его хватало на окно плюс запас: окно ленты не шире 7 карточек
  const reps = Math.max(1, Math.ceil(8 / Math.max(1, items.length)));
  const list = Array.from({ length: reps }, () => items).flat();

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const first = cells.current[0];
      if (first && wrap.current) {
        const iw = first.offsetWidth;
        const pitch = iw * (1 + gap);
        const total = pitch * list.length;
        const a = snake ? ampRef.current?.offsetHeight ?? 0 : 0;
        const off = (((now - t0) / 1000) * speed * iw) % total;
        cells.current.forEach((el, i) => {
          if (!el) return;
          let x = i * pitch - off;
          if (x < -pitch) x += total;
          // волна длиной в две карточки: соседи в противофазе, при движении плавно меняются местами
          const ph = (x / pitch) * Math.PI;
          const y = snake ? a * Math.sin(ph) : 0;
          const r = snake ? tilt * Math.cos(ph) : 0;
          el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${r}deg)`;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [list.length, gap, speed, snake, tilt]);

  const fade = "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)";
  return (
    <div ref={wrap} className="relative overflow-hidden" style={{ WebkitMaskImage: fade, maskImage: fade, paddingBlock: snake ? amp : 0, ...style }}>
      {/* невидимый замер амплитуды в cqw → px */}
      {snake && <div ref={ampRef} aria-hidden style={{ position: "absolute", height: amp, width: 0 }} />}
      {/* первая карточка в потоке задаёт высоту ленты, остальные лежат поверх абсолютно */}
      {list.map((it, i) => (
        <div key={i} ref={(el) => { cells.current[i] = el; }} style={{ width: itemWidth, position: i === 0 ? "relative" : "absolute", top: snake ? amp : 0, left: 0, willChange: "transform" }}>
          {render(it, i % items.length)}
        </div>
      ))}
    </div>
  );
}
