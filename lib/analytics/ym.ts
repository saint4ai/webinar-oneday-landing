/**
 * Яндекс.Метрика — клиентский хелпер целей (reachGoal).
 * Базовый счётчик грузится в app/layout.tsx. Идентификаторы целей здесь
 * должны 1-в-1 совпадать с целями типа «JS-событие» в дашборде Метрики
 * (см. projects/webinar_oneday/ad_campaign/YM_SETUP_TZ.md).
 */
export const YM_ID = 109147153;

declare global {
  interface Window {
    ym?: (id: number, action: string, target?: string) => void;
  }
}

export function ymGoal(name: string): void {
  if (typeof window !== "undefined" && typeof window.ym === "function") {
    window.ym(YM_ID, "reachGoal", name);
  }
}
