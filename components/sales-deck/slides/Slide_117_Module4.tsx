"use client";

import { ModuleSlide } from "../ModuleSlide";

/** Слайд 117 · Модуль 4 — слайд модуля. STRUCTURE 1478-1479. Пара → 117b. */
export function Slide_117_Module4() {
  return (
    <ModuleSlide
      no="04"
      bgImage="/cards-gifs-screenshots/module-bg/m04.jpg"
      lessons="3 урока"
      title="РЕЗЕРВНАЯ КОПИЯ"
      promise="Спите спокойно — даже если завтра сгорит комп, проект на месте."
      items={[
        "GitHub за 15 минут: приватное хранилище и первое сохранение версии проекта",
        "Сохраняем версии и откатываемся к рабочей",
        "Что нельзя выкладывать в открытый доступ — защита ключей и паролей",
      ]}
      variant="aura-tl"
    />
  );
}
