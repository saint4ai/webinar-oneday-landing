"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { VoxelField } from "../fx";
import { MontageBg } from "../MontageBg";
import { T } from "../theme";
import { EASE, Em, H, Kicker, NIGHT_HALO, Px, RISE_DUR, STEP, glueNode, nightScrim } from "../ui";

/** Семь шагов пути рилса: те же слова, что в видеоуроке (docs/workshop-v2/videourok-pipeline.md, карта пути). */
const STEPS = [
  "Идея по референсам",
  "Сценарий скриптолога",
  "Раздаточный материал",
  "Режиссура и монтаж",
  "Голос: свой или ElevenLabs",
  "Публикация с кодовым словом",
  "Ассистент в директе и заявка вам",
];

/**
 * pr · Подводка к видеоуроку (Александр, 08.10: воркшоп только про AI-монтаж, практика теперь один видеоурок, следующий слайд lv).
 * Раньше здесь были три практики, которые Александр проводил вживую в OBS. Слайд без лишнего текста: кикер, заголовок, семь шагов пути рилса
 * и один LEGO-объект по смыслу (рабочее место монтажёра, lg-s59-desk). Стиль экрана главы: ночь, поле столбиков, золотая линия. Всё в левых 60%.
 */
export function M_ToPractice() {
  const after = 0.3;
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="night"><VoxelField /><div aria-hidden style={nightScrim("30% 74%", "60%", "40%")} /></MontageBg>} contentMinWidth={0}>
      <Px name="lg-s59-desk" size="11cqw" delay={0.1} style={{ marginLeft: "-0.9cqw" }} />
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: after - STEP, ease: EASE }}
        style={{ width: "6cqw", height: "0.2cqw", background: T.gold2, margin: "1.6cqw 0 1.4cqw", borderRadius: 2, transformOrigin: "left" }} />
      <motion.div initial={{ opacity: 0, x: "-1.5cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ duration: RISE_DUR, delay: after, ease: EASE }} style={{ textShadow: NIGHT_HALO }}>
        <Kicker color={T.gold}>Практика</Kicker>
        <H size="3.4cqw" color={T.nightText} style={{ maxWidth: "50cqw" }}>
          {glueNode(<>Смотрим <Em night>видеоурок</Em>: весь путь рилса</>)}
        </H>
      </motion.div>
      <div style={{ display: "grid", gap: "0.7cqw", marginTop: "1.5cqw", maxWidth: "50cqw", textShadow: NIGHT_HALO }}>
        {STEPS.map((t, i) => (
          <motion.div key={t} initial={{ opacity: 0, x: "-1.2cqw" }} animate={{ opacity: 1, x: "0cqw" }}
            transition={{ duration: RISE_DUR, delay: after + 0.25 + i * STEP, ease: EASE }}
            style={{ display: "flex", alignItems: "baseline", gap: "1cqw" }}>
            <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.3cqw", color: T.gold2, minWidth: "1.6cqw" }}>{i + 1}</span>
            <span style={{ fontWeight: 700, fontSize: "1.35cqw", color: T.nightText, lineHeight: 1.3 }}>{glueNode(t)}</span>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: RISE_DUR, delay: after + 0.25 + STEPS.length * STEP, ease: EASE }}
        style={{ marginTop: "1.4cqw", fontSize: "1.15cqw", color: T.nightText, opacity: 0.72, textShadow: NIGHT_HALO }}>
        Этот урок смонтировал агент, а голос сгенерирован нейросетью.
      </motion.div>
    </SlideLayout>
  );
}
