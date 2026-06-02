"use client";

import { CaseSlide } from "../CaseSlide";

/**
 * Слайд 103 · Кейс 4 — Владислав. Текст по STRUCTURE 1276-1287.
 * TG-скрин: public/testimonials/vladislav.png (CASE_STUDY.md + дашборд).
 */
export function Slide_103_CaseVladislav() {
  return (
    <CaseSlide
      caseNo="4"
      name="ВЛАДИСЛАВ"
      sub="Считал прибыль экспедиторам в Excel. После обучения — запустил для них SaaS."
      screenshot="/testimonials/vladislav.png"
      handle="Владислав · CASE_STUDY.md"
      pain="Готовых SaaS под экспедиторов KZ нет. Глобальные — английские, не работают с курсом НБ РК."
      result="SaaS управления для экспедиторских компаний с авто-конвертацией USD по курсу НБ РК."
      chips={["Прибыль по рейсам", "Курс НБ РК", "Дашборд"]}
      payoff="Локальная боль, которую большие SaaS не закроют — рынок мал для них, денег много для тебя."
      variant="climax"
    />
  );
}
