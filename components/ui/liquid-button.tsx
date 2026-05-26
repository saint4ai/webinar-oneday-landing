"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface LiquidButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "ghost";
}

/**
 * Premium liquid-glass CTA в бренд-коде onAI.
 * Адаптация Aceternity UI "shadow button" + glass-эффект.
 * Hover: radial-glow orange (бренд) + subtle scale.
 */
export const LiquidButton = ({
  children,
  href,
  onClick,
  className,
  variant = "primary",
}: LiquidButtonProps) => {
  const isPrimary = variant === "primary";

  const Inner = (
    <span
      className={cn(
        "group cursor-pointer relative shadow-2xl rounded-full p-px inline-block transition-all duration-300",
        isPrimary
          ? "bg-gradient-to-b from-[#fc5c02]/40 via-white/10 to-white/5 shadow-[0_25px_60px_-15px_rgba(252,92,2,0.55)] hover:shadow-[0_25px_70px_-10px_rgba(252,92,2,0.75)]"
          : "bg-white/10 hover:bg-white/15 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.7)]",
        className
      )}
    >
      {/* Glow overlay при hover */}
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            isPrimary
              ? "bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(252,92,2,0.7)_0%,rgba(252,92,2,0)_75%)]"
              : "bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(205,235,82,0.4)_0%,rgba(205,235,82,0)_75%)]"
          )}
        />
      </span>

      {/* Основное тело кнопки */}
      <span
        className={cn(
          "relative flex items-center justify-center gap-2.5 sm:gap-3 rounded-full px-5 py-4 sm:px-7 sm:py-5 lg:px-9 lg:py-5 z-10 ring-1 backdrop-blur-md transition-all duration-300",
          isPrimary
            ? "bg-[#fc5c02] ring-white/15 group-hover:bg-[#ff6f1a]"
            : "bg-black/70 ring-white/15 group-hover:ring-white/30"
        )}
      >
        <span
          className={cn(
            "font-extrabold uppercase tracking-wider text-[12px] sm:text-sm lg:text-base text-center",
            isPrimary ? "text-black" : "text-white"
          )}
        >
          {children}
        </span>

        {/* Стрелка */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={cn(
            "transition-transform duration-300 group-hover:translate-x-0.5 flex-shrink-0 sm:w-[18px] sm:h-[18px]",
            isPrimary ? "text-black" : "text-white"
          )}
        >
          <path
            d="M5 12h14M13 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );

  if (href) {
    return (
      <a href={href} className="inline-block w-full sm:w-auto">
        {Inner}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className="inline-block w-full sm:w-auto bg-transparent border-0 p-0"
    >
      {Inner}
    </button>
  );
};
