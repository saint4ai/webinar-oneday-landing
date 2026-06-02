"use client";

import { ModuleSlide } from "../ModuleSlide";

/** Слайд 117 · Модуль 4 — слайд модуля. STRUCTURE 1478-1479. Пара → 117b. */
export function Slide_117_Module4() {
  return (
    <ModuleSlide
      no="04"
      lessons="3 урока"
      title="РЕЗЕРВНАЯ КОПИЯ"
      promise="Спите спокойно — даже если завтра сгорит комп, проект на месте."
      items={[
        "GitHub за 15 минут: приватный репозиторий и первый push",
        "Сохраняем версии и откатываемся к рабочей",
        "Что нельзя коммитить — защита ключей и секретов",
      ]}
      variant="aura-tl"
    />
  );
}
