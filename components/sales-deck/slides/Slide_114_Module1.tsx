"use client";

import { ModuleSlide } from "../ModuleSlide";

/** Слайд 114 · Модуль 1 — слайд модуля. Текст 1-в-1 STRUCTURE 1426-1428. Пара → 114b (результат). */
export function Slide_114_Module1() {
  return (
    <ModuleSlide
      no="01"
      lessons="4 урока"
      title="ЗАПУСК ДВИГАТЕЛЯ"
      promise="После первой недели — ваш первый работающий сайт. Без программистов. Без Python."
      items={[
        "Что такое vibe coding и почему это твой новый скилл",
        "Выбор подписки: какой тариф под твою задачу",
        "Рабочая среда за 30 минут: Claude Code + AI-Workspace",
        "Первый лендинг за один вечер",
      ]}
      variant="aura-tl"
    />
  );
}
