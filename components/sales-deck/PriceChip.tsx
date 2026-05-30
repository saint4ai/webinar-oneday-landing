"use client";

import { TrendingUp } from "lucide-react";
import { BorderBeam } from "./BorderBeam";

/**
 * PriceChip — лайм-чип цены/окупаемости для слайдов-решений ниша-арки (42/44/48).
 * Цифры берутся 1-в-1 из STRUCTURE (от 500 000 ₸ / от 700 000 ₸ и т.п.).
 */
export function PriceChip({ price, payback }: { price: string; payback: string }) {
  return (
    <div
      className="relative overflow-hidden flex-1 min-w-[200px] rounded-xl px-4 py-3 flex flex-col justify-center"
      style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.3)" }}
    >
      <BorderBeam color="#B6FF00" duration={6} lightWidth={120} />
      <div
        className="font-bold text-[#B6FF00] leading-none whitespace-nowrap"
        style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(17px,1.4vw,23px)" }}
      >
        {price}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-[#B6FF00]/70" strokeWidth={2} />
        <span className="text-white/55 text-[11px] md:text-xs">{payback}</span>
      </div>
    </div>
  );
}
