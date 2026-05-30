"use client";

import { CaseSlide } from "../CaseSlide";

/**
 * Слайд 102 · Кейс 3 — Мерей. Текст по STRUCTURE 1261-1272.
 * TG-скрин: public/testimonials/merey.png (GymTrainer).
 */
export function Slide_102_CaseMerey() {
  return (
    <CaseSlide
      caseNo="3"
      name="МЕРЕЙ"
      sub="Запустила GymTrainer — CRM для фитнес-тренеров Казахстана."
      screenshot="/testimonials/merey.png"
      handle="Мерей · GymTrainer"
      pain="Тренеры держат клиентов в заметках телефона. Готовые приложения не понимают их специфику — тяжёлые и дорогие."
      result="GymTrainer: умный календарь + AI-конструктор программ + LTV-аналитика тренера."
      chips={["Календарь", "AI-программы", "LTV-аналитика"]}
      payoff="Собственный SaaS-продукт. Решает боль, которую сама знала изнутри."
      variant="lime-right"
    />
  );
}
