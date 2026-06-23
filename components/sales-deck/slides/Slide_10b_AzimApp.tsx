"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { IPhoneMockup } from "../IPhoneMockup";
import { AzimAppMockup } from "../AzimAppMockup";

/**
 * Слайд 10b · Приложение Азима — iPhone mockup AlemAI (AI Tax Assistant для KZ бухгалтеров).
 *
 * Layout: iPhone mockup слева, метрики справа.
 * Александр: «следующий слайд: "Вот так выглядит его приложение". Данные:
 * 17 юзеров, 3 купили подписку по 3000 тенге».
 */
export function Slide_10b_AzimApp() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="28cqw"
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
      leftObject={
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="relative"
          style={{ height: "82cqh", maxHeight: "780px" }}
        >
          <IPhoneMockup>
            <AzimAppMockup />
          </IPhoneMockup>
        </motion.div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ПРИЛОЖЕНИЕ АЗИМА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-4"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.4cqw, 50px)",
        }}
      >
        ВОТ ТАК ВЫГЛЯДИТ
        <br />
        ЕГО <span className="text-[#B6FF00]">ПРИЛОЖЕНИЕ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-white/80 text-sm md:text-base leading-relaxed mb-8 max-w-lg"
      >
        Бухгалтер спрашивает голосом — AI находит ответ в Налоговом кодексе РК <span className="text-white font-semibold">за 3 секунды</span> и даёт ссылку на статью. Плюс контроль дедлайнов, чтобы <span className="text-[#FC5C02] font-semibold">не попасть на штраф</span>.
      </motion.div>

      {/* 3 метрики в столбик — компактные, цифры не уезжают (min-w + меньше шрифт) */}
      <div className="flex flex-col gap-3 max-w-md">
        {[
          { val: "17", color: "#B6FF00", t1: "человек скачали", t2: "за 1.5 месяца", bg: "rgba(182,255,0,0.06)", br: "rgba(182,255,0,0.18)", d: 0.8 },
          { val: "3", color: "#FC5C02", t1: "купили подписку", t2: "платно, каждый месяц", bg: "rgba(252,92,2,0.06)", br: "rgba(252,92,2,0.18)", d: 0.95 },
          { val: "3 000 ₸", color: "#B6FF00", t1: "подписка / месяц", t2: "монетизация работает", bg: "rgba(182,255,0,0.06)", br: "rgba(182,255,0,0.18)", d: 1.1 },
        ].map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: m.d }}
            className="rounded-2xl p-3.5 flex items-center gap-4"
            style={{ background: m.bg, border: `1px solid ${m.br}` }}
          >
            <div
              className="font-bold leading-none shrink-0 whitespace-nowrap"
              style={{
                color: m.color,
                fontFamily: "var(--font-benzin), system-ui, sans-serif",
                fontSize: m.val.length > 3 ? "clamp(26px, 2.8cqw, 42px)" : "clamp(32px, 3.2cqw, 48px)",
                textShadow: `0 0 24px ${m.color}40`,
              }}
            >
              {m.val}
            </div>
            <div className="text-white/70 text-xs md:text-sm uppercase tracking-[0.08em] font-mono leading-snug">
              {m.t1}
              <br />
              <span className="text-white/45">{m.t2}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
