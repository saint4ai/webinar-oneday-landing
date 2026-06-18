"use client";

import React, { useEffect, useState } from "react";
import { getNextWorkshop } from "@/lib/workshop-date";

/**
 * Таймер до следующего живого эфира: каждый день 20:00 по Алматы.
 * Дата и обратный отсчёт считаются от текущего времени (см. lib/workshop-date),
 * поэтому после 20:00 всё автоматически переключается на завтрашний эфир.
 */
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
  const [dateLabel, setDateLabel] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const w = getNextWorkshop();
      setMs(w.msUntil);
      setDateLabel(w.dateLabel);
    };
    tick();
    const id = setInterval(tick, 1000);
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
          // {dateLabel}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45 mt-0.5">
          живой эфир · 20:00 алматы
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
