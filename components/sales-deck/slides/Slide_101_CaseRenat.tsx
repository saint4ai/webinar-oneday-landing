"use client";

import { CaseSlide } from "../CaseSlide";

/**
 * Слайд 101 · Кейс 2 — Ренат. Текст по STRUCTURE 1246-1257.
 * TG-скрин: public/testimonials/renat.png.
 */
export function Slide_101_CaseRenat() {
  return (
    <CaseSlide
      caseNo="2"
      name="РЕНАТ"
      sub="Идея AI-трекера тренировок сидела в голове год. Собрал за время курса."
      screenshot="/testimonials/renat.png"
      handle="Ренат · AI-tracker"
      pain="Платить разработчикам — 2-3 млн ₸ и минимум 3 месяца. За чужие подписки платить не хотел."
      result="Веб-платформа + Telegram-приложение + AI-генератор программ тренировок."
      chips={["Веб-платформа", "Telegram-app", "AI-программы"]}
      payoff="Идея в голове → продукт на рынке. Без разработчиков, без команды."
      stack="MVP за 1 неделю"
      variant="aura-tr"
    />
  );
}
