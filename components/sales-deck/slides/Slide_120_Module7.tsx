"use client";

import { ModuleSlide } from "../ModuleSlide";

/** Слайд 120 · Модуль 7 — слайд модуля. STRUCTURE 1528-1530. Пара → 120b. */
export function Slide_120_Module7() {
  return (
    <ModuleSlide
      no="07"
      bgImage="/cards-gifs-screenshots/module-bg/m07.jpg"
      lessons="5 уроков"
      title="БОЕВОЙ ЗАПУСК"
      promise="Ваш продукт в интернете по красивому домену. Клиенты могут платить уже сегодня."
      items={[
        "Запуск в сеть одной кнопкой",
        "Подключаем свой домен",
        "Telegram-бот за 20 минут без своего сервера",
        "Свой сервер для больших проектов",
        "Защита запущенного сайта от падений и взлома",
      ]}
      variant="aura-tl"
    />
  );
}
