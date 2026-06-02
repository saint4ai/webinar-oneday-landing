"use client";

import { ObjectionSlide } from "../ObjectionSlide";
import { MessageCircle, Clock } from "lucide-react";

/** Слайд 151 · Возражение 2 — не получится → кураторы. Текст 1-в-1 STRUCTURE 2112-2114. */
export function Slide_151_ObjWontWork() {
  return (
    <ObjectionSlide n={2} question="А ЕСЛИ У МЕНЯ НЕ ПОЛУЧИТСЯ?" answer="Кураторы 7 дней в неделю с 10 утра до 10 вечера. Никто не остаётся один." bg="lime-right">
      <div className="flex flex-col gap-3 max-w-2xl">
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.28)" }}>
          <MessageCircle className="w-6 h-6 shrink-0 text-[#B6FF00]" strokeWidth={1.8} />
          <span className="text-white/85 text-sm md:text-base">Чат единомышленников, где можно задать любой вопрос и получить ответ за час.</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Clock className="w-6 h-6 shrink-0 text-white/70" strokeWidth={1.8} />
          <span className="text-white/70 text-sm md:text-base">Кураторы на связи <span className="text-white font-semibold">10:00 — 22:00</span>, без выходных.</span>
        </div>
      </div>
    </ObjectionSlide>
  );
}
