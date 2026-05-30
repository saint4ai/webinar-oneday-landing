"use client";

import { ReactNode } from "react";

interface IPhoneMockupProps {
  children: ReactNode;
  /** Высота iPhone (по умолчанию автоматически от высоты контейнера). */
  height?: number | string;
  className?: string;
}

/**
 * IPhoneMockup — реалистичная iPhone 15 Pro frame (Dynamic Island, закругления, кнопки).
 * Внутри — screen-зона куда сетится контент приложения.
 * Аспект ~ 9:19.5 (iPhone 15 Pro).
 */
export function IPhoneMockup({ children, height = "100%", className = "" }: IPhoneMockupProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        height,
        aspectRatio: "195 / 400",
        filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(182,255,0,0.15))",
      }}
    >
      {/* Внешняя рамка телефона (titanium grey) */}
      <div
        className="absolute inset-0 rounded-[14%/7%] p-[2.5%]"
        style={{
          background:
            "linear-gradient(135deg, #3a3a3c 0%, #1c1c1e 50%, #2c2c2e 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.4)",
        }}
      >
        {/* Внутренняя стеклянная рамка (bezel) */}
        <div
          className="relative w-full h-full rounded-[12%/6%] overflow-hidden"
          style={{
            background: "#000",
            boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.9)",
          }}
        >
          {/* Dynamic Island */}
          <div
            className="absolute top-[1.5%] left-1/2 -translate-x-1/2 z-30 rounded-full"
            style={{
              width: "30%",
              height: "3.2%",
              background: "#000",
              boxShadow: "0 0 0 1px rgba(40,40,40,0.6)",
            }}
          />

          {/* Screen content */}
          <div className="absolute inset-0">{children}</div>
        </div>
      </div>

      {/* Боковые кнопки */}
      <div
        className="absolute left-[-0.5%] top-[18%] w-[1%] h-[6%] rounded-l-sm"
        style={{ background: "#2a2a2c" }}
      />
      <div
        className="absolute left-[-0.5%] top-[28%] w-[1%] h-[10%] rounded-l-sm"
        style={{ background: "#2a2a2c" }}
      />
      <div
        className="absolute left-[-0.5%] top-[40%] w-[1%] h-[10%] rounded-l-sm"
        style={{ background: "#2a2a2c" }}
      />
      <div
        className="absolute right-[-0.5%] top-[28%] w-[1%] h-[16%] rounded-r-sm"
        style={{ background: "#2a2a2c" }}
      />
    </div>
  );
}
