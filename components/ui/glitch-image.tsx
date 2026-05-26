"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Лёгкий глитч на изображении — срабатывает раз в ~3 секунды на короткое время.
 * 2 цветных слоя (orange/lime) едва сдвигаются, base layer переключает clip-path.
 * IntersectionObserver — пауза анимации когда вне viewport.
 */
type Props = {
  src: string;
  alt: string;
  className?: string;
  intervalMs?: number;
};

export const GlitchImage = ({
  src,
  alt,
  className,
  intervalMs = 3000,
}: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(true);

  // IntersectionObserver
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Глитч цикл
  useEffect(() => {
    if (!visible) return;
    const trigger = () => {
      setActive(true);
      const off = setTimeout(() => setActive(false), 220);
      return () => clearTimeout(off);
    };
    const id = setInterval(trigger, intervalMs);
    return () => clearInterval(id);
  }, [visible, intervalMs]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Базовый слой */}
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 500px"
        className={cn(
          "object-cover object-top relative z-10 transition-transform duration-150",
          active && "translate-x-[1px]"
        )}
        style={{
          filter:
            "drop-shadow(0 20px 40px rgba(252, 92, 2, 0.35)) drop-shadow(0 0 60px rgba(252, 92, 2, 0.2))",
        }}
      />

      {/* Глитч-слой orange — только во время active */}
      {active && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            mixBlendMode: "screen",
            transform: "translate(-3px, 1px)",
            filter:
              "drop-shadow(2px 0 0 rgba(252,92,2,0.7)) drop-shadow(-2px 0 0 rgba(205,235,82,0.6))",
            clipPath: "inset(20% 0 60% 0)",
          }}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 500px"
            className="object-cover object-top"
            aria-hidden
          />
        </div>
      )}

      {/* Глитч-слой lime — другой clip */}
      {active && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            mixBlendMode: "screen",
            transform: "translate(2px, -1px)",
            filter: "drop-shadow(-2px 0 0 rgba(205,235,82,0.5))",
            clipPath: "inset(55% 0 18% 0)",
          }}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 500px"
            className="object-cover object-top"
            aria-hidden
          />
        </div>
      )}
    </div>
  );
};
