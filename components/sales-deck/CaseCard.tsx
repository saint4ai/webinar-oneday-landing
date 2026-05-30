"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CaseCardProps {
  name: string;
  role?: string;
  quote: string;
  metric?: string;
  metricLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
  /** CSS object-position для центрирования лица. По умолчанию "center top" */
  imagePosition?: string;
  delay?: number;
  className?: string;
  children?: ReactNode;
}

/**
 * CaseCard — карточка кейса (ученик / выпускник).
 * Используется в Slide_10 Мейрам и подобных social-proof слайдах.
 *
 * Если imageSrc отсутствует — показывается lime-stroke placeholder.
 * Slide-up анимация от низа.
 */
export function CaseCard({
  name,
  role,
  quote,
  metric,
  metricLabel,
  imageSrc,
  imageAlt = "",
  imagePosition = "center top",
  delay = 0,
  className,
  children,
}: CaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "relative rounded-2xl border border-white/10 overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-6",
        className
      )}
      style={{
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
      }}
    >
      {/* Image / placeholder */}
      <div className="shrink-0 w-full md:w-[200px] aspect-square rounded-xl overflow-hidden bg-black/40 relative">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-cover"
            style={{ objectPosition: imagePosition }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xs uppercase tracking-[0.12em] font-mono text-white/40"
            style={{
              border: "2px dashed rgba(182,255,0,0.35)",
              background: "rgba(182,255,0,0.04)",
            }}
          >
            PLACEHOLDER
            <br />
            фото
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3
            className="font-bold uppercase text-white text-xl md:text-2xl tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-benzin), system-ui, sans-serif" }}
          >
            {name}
          </h3>
          {role && (
            <span className="text-white/55 text-xs md:text-sm uppercase tracking-[0.12em] font-mono">
              · {role}
            </span>
          )}
        </div>

        <p className="text-white/85 text-base md:text-lg leading-snug">
          {quote}
        </p>

        {metric && (
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="font-bold text-2xl md:text-3xl"
              style={{
                color: "#B6FF00",
                fontFamily: "var(--font-benzin), system-ui, sans-serif",
                textShadow: "0 0 24px rgba(182,255,0,0.35)",
              }}
            >
              {metric}
            </span>
            {metricLabel && (
              <span className="text-white/55 text-xs md:text-sm uppercase tracking-[0.12em] font-mono">
                {metricLabel}
              </span>
            )}
          </div>
        )}

        {children}
      </div>
    </motion.div>
  );
}
