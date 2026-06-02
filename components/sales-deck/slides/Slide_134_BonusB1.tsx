"use client";

import { BonusCardSlide } from "../BonusCardSlide";

/**
 * Слайд 134 · Бонус Б-1 — Курс «Claude Code · Базовый». Текст по STRUCTURE 1773-1796.
 * 📌 HIGGSFIELD-ПРОМПТ (для обложки в слоте): nano_banana_2 (Pro), Apple Liquid Glass /
 * glassmorphism, палитра чёрный #000 + лайм #B6FF00 + оранж #FC5C02, лого Claude + плашка
 * «БОНУС Б-1 · 5 УРОКОВ · 3 ЧАСА» + иконка подарка. Правила: memory/feedback_higgsfield_premium_cards.md.
 */
export function Slide_134_BonusB1() {
  return (
    <BonusCardSlide
      badge="БОНУС Б-1"
      marketPrice="50 000 ₸"
      cardImage="/cards-gifs-screenshots/bonus/bonus-b1-claude-code.png"
      title="ОБУЧЕНИЕ «CLAUDE CODE · БАЗОВЫЙ»"
      sub="5 уроков · 3 часа практики. Доступ открывается сразу после предоплаты — сегодня вечером ты уже работаешь по-новому."
      inside={[
        "5 уроков по шагам: от вайбкодинга до договора с первым клиентом — голосом, без кода.",
        "Claude Code установлен и настроен под тебя — агент уже знает, над чем ты работаешь.",
        "Рабочая папка + 30 промптов + 5 готовых шаблонов: договор, коммерческое, опросник, NDA, отчёт.",
        "Бонус-урок: AI-Таргетолог — бесплатный канал клиентов.",
      ]}
      limeBlock="Не «прийти на обучение через 2 недели». Начни сегодня вечером — придёшь на поток с готовым настроенным агентом."
      slotLabel="обложка «Claude Code · Базовый»"
    />
  );
}
