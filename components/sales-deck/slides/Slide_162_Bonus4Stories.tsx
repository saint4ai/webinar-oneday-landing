"use client";

import { BonusCardSlide } from "../BonusCardSlide";

/**
 * Слайд 162 · Бонус ЗА ОТМЕТКУ В СТОРИС — курс по созданию вирусного контента при помощи AI (Икреатор).
 * НЕ входит в 3 бонуса за просмотр. Идёт В КОНЦЕ — после того как забрали 3 бонуса по ключевому слову (ВАЙБ).
 * Картинка: bonus-stories-aicreator.png (Higgsfield nano_banana_2 Pro). Правила: feedback_higgsfield_premium_cards.md
 */
export function Slide_162_Bonus4Stories() {
  return (
    <BonusCardSlide
      badge="БОНУС ЗА СТОРИС"
      marketPrice="15 000 ₸"
      cardImage="/cards-gifs-screenshots/bonus/bonus-stories-aicreator.png"
      condition="за отметку @saint4ai в сторис"
      title="КУРС: ВИРУСНЫЙ КОНТЕНТ ЧЕРЕЗ AI"
      sub="Уже забрал 3 бонуса по слову? Тогда вот ещё: отметь меня в сторис — отправлю наш курс по созданию вирусного контента нейросетями."
      inside={[
        "Мультики, ролики, короткие сериалы — нейросетями, без студии и аниматоров.",
        "Персонажи и миры, которые не плывут от кадра к кадру.",
        "Условие: сторис с отметкой @saint4ai → в директ → забираешь курс.",
      ]}
      limeBlock="Это сверх трёх бонусов за просмотр. Целое направление — вирусный контент на нейросетях."
      slotLabel="карточка «вирусный контент через AI · сторис @saint4ai»"
    />
  );
}
