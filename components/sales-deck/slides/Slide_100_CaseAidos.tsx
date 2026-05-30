"use client";

import { CaseSlide } from "../CaseSlide";

/**
 * Слайд 100 · Кейс 1 — Айдос. Текст по STRUCTURE 1231-1242.
 * TG-скрин: public/testimonials/aidos.png (как сам написал нам про 2 проекта).
 */
export function Slide_100_CaseAidos() {
  return (
    <CaseSlide
      caseNo="1"
      name="АЙДОС"
      sub="Год назад не писал код. Сейчас — сдаёт 3 продакшен-проекта американской компании."
      screenshot="/testimonials/aidos.png"
      handle="Aidos · 22 мая"
      pain="Идеи продуктов в голове. Нанимать программистов — дорого, учить Python самому — 3 года."
      result="3 рабочих продукта в продакшене + контракт с американской компанией."
      chips={["AI-PM для Asana", "Mining Bot", "Фитнес-приложение"]}
      payoff="С локального рынка KZ — на US. Стек английский, чеки в долларах."
      stack="Antigravity · Claude Code · n8n MCP"
      variant="aura-tl"
    />
  );
}
