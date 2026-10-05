"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** Плашка просмотров как в Instagram: глаз и цифра белым на тёмном стекле. Кладётся поверх обложки или видео. */
export function Views({ value, size = "0.9cqw", style }: { value: string; size?: string; style?: CSSProperties }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35em", padding: "0.3em 0.65em", borderRadius: 999, background: "rgba(10,8,7,.62)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#fff", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: size,
      lineHeight: 1, whiteSpace: "nowrap", boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)", ...style }}>
      <svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z" /><circle cx="12" cy="12" r="3.2" />
      </svg>
      {value}
    </span>
  );
}

/**
 * Бесконечная лента рилсов, края ленты растворяются.
 * Горизонтальная (по умолчанию): карточки едут справа налево. amp > 0 — «змейка»: каждая карточка плывёт по синусоиде,
 * соседние всегда в противофазе (одна выше, другая ниже) и по ходу движения плавно меняются местами, с лёгким наклоном.
 * vertical: колонка, карточки летят сверху вниз; высоту ленте задаёт родитель (style.height или h-full).
 * Позиции считаются в requestAnimationFrame и пишутся прямо в transform, без перерисовки React.
 * Если карточек мало для бесконечности, набор повторяется, пока лента не станет длиннее окна.
 */
export function ReelRail<T>({ items, render, itemWidth, gap = 0.12, amp = 0, speed = 0.32, tilt = 3, vertical = false, style }: {
  items: T[];
  render: (item: T, i: number) => ReactNode;
  itemWidth: string; // ширина карточки, например "9cqw"
  gap?: number; // зазор между карточками в долях размера карточки по ходу движения
  amp?: string | number; // амплитуда змейки, например "1.6cqw"; 0 — ровная лента (только горизонтальная)
  speed?: number; // скорость в размерах карточки за секунду
  tilt?: number; // наклон на гребне волны, градусы (только для змейки)
  vertical?: boolean; // колонка, движение вниз
  style?: CSSProperties;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const ampRef = useRef<HTMLDivElement>(null);
  const snake = !vertical && amp !== 0 && amp !== "0";

  // повторяем набор, чтобы его хватало на окно плюс запас
  const reps = Math.max(1, Math.ceil(8 / Math.max(1, items.length)));
  const list = Array.from({ length: reps }, () => items).flat();

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const first = cells.current[0];
      if (first && wrap.current) {
        const size = vertical ? first.offsetHeight : first.offsetWidth;
        const pitch = size * (1 + gap);
        const total = pitch * list.length;
        const a = snake ? ampRef.current?.offsetHeight ?? 0 : 0;
        const off = (((now - t0) / 1000) * speed * size) % total;
        cells.current.forEach((el, i) => {
          if (!el) return;
          if (vertical) {
            // сверху вниз: позиция растёт со временем и заворачивается наверх за край
            const y = ((i * pitch + off) % total) - pitch;
            el.style.transform = `translate3d(0, ${y}px, 0)`;
            return;
          }
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
  }, [list.length, gap, speed, snake, tilt, vertical]);

  const fade = vertical ? "linear-gradient(180deg, transparent, #000 14%, #000 86%, transparent)" : "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)";
  return (
    <div ref={wrap} className="relative overflow-hidden" style={{ WebkitMaskImage: fade, maskImage: fade, paddingBlock: snake ? amp : 0, ...style }}>
      {/* невидимый замер амплитуды в cqw → px */}
      {snake && <div ref={ampRef} aria-hidden style={{ position: "absolute", height: amp, width: 0 }} />}
      {/* горизонтальная: первая карточка в потоке задаёт высоту ленты; вертикальная: все абсолютно, по центру колонки */}
      {list.map((it, i) => (
        <div key={i} ref={(el) => { cells.current[i] = el; }} style={{ width: itemWidth, willChange: "transform",
          position: !vertical && i === 0 ? "relative" : "absolute", top: vertical ? 0 : snake ? amp : 0, left: vertical ? `calc(50% - ${itemWidth} / 2)` : 0 }}>
          {render(it, i % items.length)}
        </div>
      ))}
    </div>
  );
}
