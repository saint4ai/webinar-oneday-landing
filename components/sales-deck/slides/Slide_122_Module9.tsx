"use client";

import { ModuleSlide } from "../ModuleSlide";

/** Слайд 122 · Модуль 9 — слайд модуля. STRUCTURE 1563-1565. Пара → 122b. */
export function Slide_122_Module9() {
  return (
    <ModuleSlide
      no="09"
      lessons="5 уроков"
      title="ДЕНЬГИ НА СЧЁТ"
      promise="Первая оплата падает на ваш счёт. Уведомление в Telegram. Доступ клиенту выдан автоматически."
      items={[
        "Как работают платёжки и что нужно для KZ",
        "Robokassa: регистрация и подключение магазина",
        "Интеграция Robokassa в проект",
        "Уведомления в Telegram о каждой продаже",
        "Подписочная модель и куда расти дальше",
      ]}
      variant="lime-right"
    />
  );
}
