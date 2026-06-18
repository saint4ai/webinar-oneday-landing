"use client";

import { DiscountAlertBase } from "../DiscountAlertBase";

/**
 * Слайд-вспышка «ВНИМАНИЕ · СКИДКА −25%» — финальная скидка перед раскрытием цены 290 900 ₸.
 * 390 000 → 290 900 ₸ ≈ −25% (точно −25,4%; округлено вниз, не завышаем). С падающими подарками.
 */
export function Slide_FinalDiscountAlert() {
  return <DiscountAlertBase discount="−25%" subtitle="финальная скидка для участников этого эфира" gifts />;
}
