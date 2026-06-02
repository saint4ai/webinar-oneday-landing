"use client";

import { BonusCardSlide } from "../BonusCardSlide";

/**
 * Слайд 136 · Бонус Б-3 — Топ-5 TG-каналов + Threads-бот. Текст по STRUCTURE 1841-1855.
 * 📌 HIGGSFIELD-ПРОМПТ (слот): nano_banana_2 (Pro), Apple Liquid Glass / glassmorphism,
 * чёрный + лайм #B6FF00 + оранж #FC5C02, иконка Telegram + лого Threads + стрелка-уведомление
 * «новый заказ». Правила: memory/feedback_higgsfield_premium_cards.md.
 */
export function Slide_136_BonusB3() {
  return (
    <BonusCardSlide
      badge="БОНУС Б-3"
      cardImage="/cards-gifs-screenshots/bonus/bonus-b3-orders.png"
      title="ГОТОВЫЙ ИСТОЧНИК ЗАКАЗОВ"
      sub="Топ-5 Telegram-каналов, где сидят клиенты вайбкодеров, + мой Threads-бот для мониторинга 24/7."
      inside={[
        "Карта Топ-5 TG-каналов: сколько активных запросов в день, средний чек, как заходить, что писать.",
        "Threads-бот мониторит 24/7 — пост «ищу вайбкодера» → моментально в твой Telegram.",
        "Список 5 каналов + подключённый бот — первая заявка может прийти уже на следующий день.",
      ]}
      limeBlock="Канал и бот — поток заявок без бюджета на рекламу. Многие ученики нашли первого клиента в первую неделю именно отсюда."
      slotLabel="карточка «Топ-5 каналов + Threads-бот»"
    />
  );
}
