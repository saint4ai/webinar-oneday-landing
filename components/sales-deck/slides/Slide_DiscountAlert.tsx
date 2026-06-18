"use client";

import { DiscountAlertBase } from "../DiscountAlertBase";

/**
 * Слайд-вспышка «ВНИМАНИЕ · СКИДКА −20%» — pattern-interrupt (490→390 = −100 000 ₸ ≈ −20%).
 * Анимация и вёрстка — в DiscountAlertBase.
 */
export function Slide_DiscountAlert() {
  return <DiscountAlertBase discount="−20%" subtitle="только для тех, кто решает сегодня" />;
}
