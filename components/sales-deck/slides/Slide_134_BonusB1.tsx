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
      cardImage="/cards-gifs-screenshots/bonus/bonus-b1-claude-code.png"
      title="ОБУЧЕНИЕ «CLAUDE CODE · БАЗОВЫЙ»"
      sub="5 уроков · 3 часа практики. Доступ открывается сразу после предоплаты — сегодня вечером ты уже работаешь по-новому."
      inside={[
        "5 уроков: vibe coding · установка Claude Code + OpenWhisper · 1 файл → 4 артефакта · день со мной (созвон → ТЗ → КП → договор за 30 минут).",
        "Claude Code установлен + заполненный CLAUDE.md — агент знает, кто ты.",
        "AI-Workspace папка + 30 промптов + 5 шаблонов (договор, КП, опросник, NDA, отчёт).",
        "Бонус-урок: «AI-Таргетолог» как скилл — бесплатный канал клиентов.",
      ]}
      limeBlock="Не «прийти на обучение через 2 недели». Начни сегодня вечером — придёшь на поток с готовым настроенным агентом."
      slotLabel="обложка «Claude Code · Базовый»"
    />
  );
}
