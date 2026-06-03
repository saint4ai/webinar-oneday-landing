"use client";

import { ModuleSlide } from "../ModuleSlide";

/** Слайд 116 · Модуль 3 — слайд модуля. STRUCTURE 1460-1462. Пара → 116b. */
export function Slide_116_Module3() {
  return (
    <ModuleSlide
      no="03"
      bgImage="/cards-gifs-screenshots/module-bg/m03.jpg"
      lessons="4 урока"
      title="КОНСТИТУЦИЯ ПРОЕКТА"
      promise="Авторская система памяти — метод onAI. За неё ко мне и приходят. Ваш проект не развалится на 3-м месяце."
      items={[
        "Почему проект разваливается без правил — кейс автора",
        "Конституция проекта — файл, который агент читает первым",
        "Пятиуровневая система памяти — метод onAI",
        "Добавляем новые функции, не ломая то что уже работает",
      ]}
      variant="lime-right"
    />
  );
}
