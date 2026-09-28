"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { useCountUp } from "@/components/sales-deck/useCountUp";
import { MontageBg } from "../MontageBg";
import { Phone } from "../Phone";
import { T } from "../theme";
import { H, Kicker, Lead, Chip, Rise, thousands } from "../ui";

/** 1 ✦ Заставка: телефон с MCP-рилсом въезжает, счётчик докручивается до 107 237. */
export function M_Cover() {
  const views = useCountUp(107237, 2.2, 0.7);
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg />} objectColumnSize="21cqw" objectOverflow="visible"
      leftObject={
        <motion.div className="flex flex-col items-center gap-[1cqw]"
          initial={{ opacity: 0, y: "10cqw", rotate: -7 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.15 }}>
          <Phone video="/montage/reels/mcp.mp4" src="/montage/reels/mcp.jpg" views={thousands(views)} caption="Четыре подключения для Claude" width="14.5cqw" showTop={false} />
          <div style={{ fontFamily: "var(--font-manrope)", fontSize: "0.72cqw", color: T.muted }}>просмотров на 26 сентября</div>
        </motion.div>
      }>
      <Rise><img src="/montage/onai-logo-cacao.svg" alt="onAI Academy" style={{ height: "1.9cqw", width: "auto", marginBottom: "2.6cqw" }} /></Rise>
      <Rise delay={0.1}><Kicker>Эфир · Vibe Production</Kicker></Rise>
      <Rise delay={0.18}><H size="2.75cqw">Рилсы без знаний монтажа</H></Rise>
      <Rise delay={0.26}><Lead style={{ marginTop: "1.6cqw", maxWidth: "30cqw" }}>Монтирует ИИ-агент по вашему голосу. Заявки с рилсов обрабатывает ИИ-менеджер.</Lead></Rise>
      <Rise delay={0.34} className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "2.4cqw" }}>
        <Chip>Четверг, 1 октября</Chip><Chip>20:00</Chip><Chip>3 урока за вечер</Chip>
      </Rise>
    </SlideLayout>
  );
}

