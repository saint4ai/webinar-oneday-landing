"use client";

import { BonusCardSlide } from "../BonusCardSlide";

/**
 * Слайд 146 · OTO-4 — Секретный спикер App Store / Google Play. Текст по STRUCTURE 2024-2038.
 * 📌 ПРУФ-ТРЕБУЕТСЯ: реальный спикер согласован? Если нет — заменить на другой бонус (references/PRUFS_TODO.md).
 * 📌 HIGGSFIELD: силуэт спикера с «?» + лого App Store и Google Play.
 */
export function Slide_146_OTO4() {
  return (
    <BonusCardSlide
      badge="БОНУС 4"
      marketPrice="50 000 ₸"
      cardImage="/cards-gifs-screenshots/bonus/bonus-oto4-speaker.png"
      condition="за полную оплату"
      title="СЕКРЕТНЫЙ СПИКЕР"
      sub="Эксперт по публикации приложений в App Store и Google Play. Рыночная цена — 50 000 ₸."
      inside={[
        "Собрал Android-приложение на воркшопе? Дальше нужно опубликовать его в сторах.",
        "Как пройти модерацию с первого раза: что готовить (иконки, скриншоты, описания).",
        "Как избежать отклонения. Имя спикера — в личном кабинете после полной оплаты.",
      ]}
      limeBlock="Без публикации приложение не скачают. Этот бонус закрывает последний шаг — выход в сторы."
      slotLabel="карточка «Секретный спикер» · App Store + Google Play · 50 000 ₸"
    />
  );
}
