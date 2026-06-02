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
      cardImage="/cards-gifs-screenshots/bonus/bonus-stories-aicreator.png"
      condition="за отметку в сторис"
      title="ИИ-КРЕАТОРСТВО: МУЛЬТИКИ И СЕРИАЛЫ"
      sub="Мини-обучение: как создавать мультфильмы и сериалы нейросетями — от идеи до готовой серии."
      inside={[
        "Генерация консистентных персонажей и миров нейросетями.",
        "Сцены, движение, озвучка — серия без студии и аниматоров.",
        "Условие: сторис с отметкой @saint4ai → в директ → забираешь обучение.",
      ]}
      limeBlock="Целое новое направление дохода — ИИ-мультики и сериалы. Сверху трёх основных бонусов."
      slotLabel="карточка «ИИ-креаторство · сторис @saint4ai»"
    />
  );
}
