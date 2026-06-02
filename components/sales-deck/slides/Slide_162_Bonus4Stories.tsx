"use client";

import { BonusCardSlide } from "../BonusCardSlide";

/**
 * Слайд 162 · Бонус 4 за отметку в сторис. Текст 1-в-1 STRUCTURE 2248-2254.
 * 📌 HIGGSFIELD-ПРОМПТ: премиум-карточка бонуса. Модель nano_banana_2 (Pro).
 * Стиль Apple Liquid Glass / glassmorphism. Палитра чёрный #000 + лайм #B6FF00 + оранж #FC5C02.
 * Правила: memory/feedback_higgsfield_premium_cards.md · шаблон: references/HIGGSFIELD_PROMPTS_LIBRARY.md
 */
export function Slide_162_Bonus4Stories() {
  return (
    <BonusCardSlide
      badge="БОНУС 4"
      marketPrice="15 000 ₸"
      condition="за отметку в сторис"
      title="+ БОНУС 4 ЗА ОТМЕТКУ В СТОРИС"
      sub="Отметьте меня @saint4ai в сторис с инсайтом из эфира. Это сверху основных 3 бонусов — не вместо, а в дополнение."
      inside={[
        "PDF-гайд «AI Workspace — структура папки для Claude Code» (5 страниц, готовый шаблон).",
        "Условие: скрин сторис с отметкой @saint4ai.",
        "Присылаете мне в директ → получаете гайд.",
      ]}
      limeBlock="Сторис с @saint4ai → директ → PDF-гайд AI Workspace. Сверху трёх основных бонусов."
      slotLabel="карточка «Бонус 4 · сторис @saint4ai»"
    />
  );
}
