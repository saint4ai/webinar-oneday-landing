"use client";

import React, { useEffect, useState } from "react";

/**
 * Таймер до следующего 20:00 по Алматы (UTC+5).
 * Каждый день в 20:00 идёт автовебинар — таймер обнуляется и считает до следующего эфира.
 */
function getNextAlmaty20(): number {
  const now = new Date();
  // Алматы = UTC+5
  const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;
  const nowAlmatyMs = now.getTime() + ALMATY_OFFSET_MS;
  const nowAlmaty = new Date(nowAlmatyMs);

  // Целевое: 20:00 по Алматы
  const target = new Date(
    Date.UTC(
      nowAlmaty.getUTCFullYear(),
      nowAlmaty.getUTCMonth(),
      nowAlmaty.getUTCDate(),
      20,
      0,
      0,
      0
    )
  );

  // Если уже прошло 20:00 по Алматы — берём завтра
  if (nowAlmatyMs >= target.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  // Возвращаем разницу в миллисекундах (UTC → UTC, без поправки на Almaty offset)
  return target.getTime() - nowAlmaty.getTime();
}

function format(ms: number): { h: string; m: string; s: string } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

export const CountdownTimer = () => {
  const [ms, setMs] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMs(getNextAlmaty20());
    const id = setInterval(() => setMs(getNextAlmaty20()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
          до следующего эфира
        </span>
        <div className="flex items-center gap-1 font-mono">
          <span className="text-white/30 text-2xl tabular-nums">00</span>
          <span className="text-white/30 text-2xl">:</span>
          <span className="text-white/30 text-2xl tabular-nums">00</span>
          <span className="text-white/30 text-2xl">:</span>
          <span className="text-white/30 text-2xl tabular-nums">00</span>
        </div>
      </div>
    );
  }

  const { h, m, s } = format(ms);

  return (
    <div className="inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md px-5 py-3">
      <div className="flex flex-col">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#cdeb52]">
          // старт 31 мая
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45 mt-0.5">
          эфиры каждый день в 20:00 (алматы)
        </span>
      </div>
      <div className="h-10 w-px bg-white/10" />
      <div className="flex items-center gap-1.5">
        <CountUnit value={h} label="ч" />
        <Sep />
        <CountUnit value={m} label="м" />
        <Sep />
        <CountUnit value={s} label="с" />
      </div>
    </div>
  );
};

const CountUnit = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="font-mono font-bold text-xl text-white tabular-nums leading-none">
      {value}
    </span>
    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40 mt-1">
      {label}
    </span>
  </div>
);

const Sep = () => (
  <span className="font-mono font-bold text-xl text-[#fc5c02] leading-none -mt-2">
    :
  </span>
);
