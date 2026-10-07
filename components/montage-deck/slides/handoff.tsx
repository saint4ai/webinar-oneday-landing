"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { VoxelField } from "../fx";
import { MontageBg } from "../MontageBg";
import { T } from "../theme";
import { EASE, Em, H, Kicker, Px, RISE_DUR, STEP, glueNode } from "../ui";

/**
 * pr · Подводка к живой практике (Александр, 07.10 вечером). После практик 2 и 3 на этом слайде Александр переключает экран в OBS
 * и проводит три практических урока одним видео. Слайд без лишнего текста: кикер, заголовок и один LEGO-объект по смыслу
 * (рабочее место монтажёра, lg-s59-desk: его в колоде нигде нет). Стиль экрана главы: ночь, поле столбиков, золотая линия. Всё в левых 60%.
 */
export function M_ToPractice() {
  const after = 0.3;
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="night"><VoxelField /></MontageBg>} contentMinWidth={0}>
      <Px name="lg-s59-desk" size="17cqw" delay={0.1} style={{ marginLeft: "-0.9cqw" }} />
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: after - STEP, ease: EASE }}
        style={{ width: "6cqw", height: "0.2cqw", background: T.gold2, margin: "2.2cqw 0 1.6cqw", borderRadius: 2, transformOrigin: "left" }} />
      <motion.div initial={{ opacity: 0, x: "-1.5cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ duration: RISE_DUR, delay: after, ease: EASE }}>
        <Kicker color={T.gold}>Три практики подряд</Kicker>
        <H size="3.6cqw" color={T.nightText} style={{ maxWidth: "50cqw" }}>
          {glueNode(<>Теперь приступаем <Em night>к практике</Em></>)}
        </H>
      </motion.div>
      <div style={{ display: "grid", gap: "0.9cqw", marginTop: "1.8cqw", maxWidth: "50cqw" }}>
        {[
          ["1", "Рилс без знаний монтажа", "агент собирает графику, субтитры и звук по голосу"],
          ["2", "Презентация по брифу", "структура, тексты и слайды без дизайнера"],
          ["3", "Приложение из описания", "Google AI Studio и Claude Code"],
        ].map(([n, t, d], i) => (
          <motion.div key={n} initial={{ opacity: 0, x: "-1.2cqw" }} animate={{ opacity: 1, x: "0cqw" }}
            transition={{ duration: RISE_DUR, delay: after + 0.25 + i * STEP, ease: EASE }}
            style={{ display: "flex", alignItems: "baseline", gap: "1cqw" }}>
            <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.5cqw", color: T.gold2, minWidth: "1.6cqw" }}>{n}</span>
            <span style={{ fontWeight: 700, fontSize: "1.4cqw", color: T.nightText, lineHeight: 1.3 }}>
              {glueNode(<>{t}<span style={{ fontWeight: 500, opacity: 0.72 }}>: {d}</span></>)}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: RISE_DUR, delay: after + 0.25 + 3 * STEP, ease: EASE }}
        style={{ marginTop: "1.6cqw", fontSize: "1.15cqw", color: T.nightText, opacity: 0.72 }}>
        Смотрите, как это делаю я, и повторяйте у себя.
      </motion.div>
    </SlideLayout>
  );
}
