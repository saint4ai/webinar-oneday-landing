"use client";

import { BonusCardSlide } from "../BonusCardSlide";

/**
 * Слайд 135 · Бонус Б-2 — AI-Таргетолог как скилл. Текст по STRUCTURE 1809-1829.
 * 📌 HIGGSFIELD-ПРОМПТ (слот): nano_banana_2 (Pro), Apple Liquid Glass / glassmorphism,
 * чёрный + лайм #B6FF00 + оранж #FC5C02, иконка Meta-рекламы + лого GitHub + плашка
 * «AI-ТАРГЕТОЛОГ · СКИЛЛ ДЛЯ CLAUDE CODE». Правила: memory/feedback_higgsfield_premium_cards.md.
 */
export function Slide_135_BonusB2() {
  return (
    <BonusCardSlide
      badge="БОНУС Б-2"
      marketPrice="от 49 000 ₸/мес"
      cardImage="/cards-gifs-screenshots/bonus/bonus-b2-targetolog.png"
      title="AI-ТАРГЕТОЛОГ КАК СКИЛЛ"
      sub="Мой production-сервис app.aoneagency.kz (60+ клиентов, чек 49-99К ₸/мес) — его «мозг» я отдаю тебе как скилл к Claude Code."
      inside={[
        "Публичный GitHub-репо (MIT-лицензия) — клонируешь одной командой, ставится за 2 минуты.",
        "Подключение к Facebook Ads Manager через Pipeboard MCP (OAuth, без токенов руками).",
        "Pre-flight чек-лист инфраструктуры Facebook + демо: креативы → голосовое ТЗ → кампании.",
        "Готовый канал первых клиентов — для себя или на продажу как услугу.",
      ]}
      limeBlock="Я этот сервис продаю по 49-99К ₸/мес. Ты получаешь его архитектуру и используешь для себя — бесплатно."
      slotLabel="карточка «AI-Таргетолог · скилл»"
    />
  );
}
