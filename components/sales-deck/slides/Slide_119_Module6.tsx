"use client";

import { ModuleSlide } from "../ModuleSlide";

/** Слайд 119 · Модуль 6 — слайд модуля. STRUCTURE 1512-1513. Пара → 119b. */
export function Slide_119_Module6() {
  return (
    <ModuleSlide
      no="06"
      bgImage="/cards-gifs-screenshots/module-bg/m06.jpg"
      lessons="4 урока"
      title="АРМИЯ АГЕНТОВ"
      promise="Вы руководите командой из агентов. Собираете продукты в 2-3 раза быстрее."
      items={[
        "Агент действует сам — без твоей команды",
        "Несколько копий проекта — параллельная работа",
        "Команда агентов: руководитель и подчинённые в ролях",
        "Практика: сборка реального проекта силами нескольких агентов — от начала до конца",
      ]}
      variant="lime-right"
    />
  );
}
