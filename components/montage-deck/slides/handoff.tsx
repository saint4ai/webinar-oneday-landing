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
        <Kicker color={T.gold}>Практика</Kicker>
        <H size="3.4cqw" color={T.nightText} style={{ maxWidth: "50cqw" }}>
          {glueNode(<>А теперь покажу, как я <Em night>делаю монтаж</Em> при помощи Claude</>)}
        </H>
      </motion.div>
    </SlideLayout>
  );
}
