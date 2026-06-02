"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

/**
 * AdReportDashboard — мокап готового HTML-дашборда «Отчёт по рекламе» в бренд-коде.
 * Roistat-стиль: KPI (расход / доход / ROMI / заявки) + доход-vs-расход по неделям
 * + каналы «топ-3 в плюсе / в минусе» (под команду «дай саммари»).
 * Анимации лёгкие: бары растут на mount + лёгкое idle-дыхание дохода. KZ-айдентика (₸).
 * Used by: Slide 90 (Один Excel — четыре документа).
 *
 * Цифры — иллюстративные демо-данные примера, не реальный клиент.
 * Бренд: чёрный + лайм #B6FF00 + оранж #FC5C02.
 */
const LIME = "#B6FF00";
const ORANGE = "#FC5C02";
const AMBER = "#FACC15";

// доход / расход по неделям (млн ₸). Сумма дохода ≈ 11.3M, расхода ≈ 2.48M.
const WEEKS = [
  { w: "Н1", rev: 1.6, cost: 0.42 },
  { w: "Н2", rev: 2.1, cost: 0.48 },
  { w: "Н3", rev: 2.4, cost: 0.51 },
  { w: "Н4", rev: 2.7, cost: 0.53 },
  { w: "Н5", rev: 2.5, cost: 0.54 },
];
const MAX_REV = 2.7;

// каналы по ROMI — топ-3 в плюсе (лайм) / в минусе (оранж)
const CHANNELS = [
  { name: "Instagram", romi: 612 },
  { name: "Google Ads", romi: 428 },
  { name: "2GIS", romi: 295 },
  { name: "TikTok", romi: 86 },
  { name: "YouTube", romi: -24 },
];
const ROMI_MAX = 650;

function romiColor(r: number) {
  if (r >= 250) return LIME;
  if (r >= 0) return AMBER;
  return ORANGE;
}

const KPIS = [
  { label: "Расход", val: "2 480 000", unit: "₸", c: "#fff" },
  { label: "Доход", val: "11 300 000", unit: "₸", c: LIME },
  { label: "ROMI", val: "356", unit: "%", c: LIME, up: true },
  { label: "Заявки", val: "1 247", unit: "", c: "#fff", sub: "CPL 1 990 ₸" },
];

export function AdReportDashboard() {
  return (
    <div
      className="w-full h-full flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0d120d 0%, #070707 100%)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 30px 60px -25px rgba(182,255,0,0.28), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Window chrome / header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="text-white font-bold text-[13px] leading-none">onAI Analytics</span>
          <span className="text-white/40 text-[11px] font-mono">· Отчёт по рекламе · Май 2026</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: `${LIME}14`, border: `1px solid ${LIME}33` }}>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
          <span className="text-[9px] font-mono uppercase tracking-[0.1em]" style={{ color: LIME }}>live</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-3.5 gap-3">
        {/* KPI row */}
        <div className="shrink-0 grid grid-cols-4 gap-2.5">
          {KPIS.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.09 }}
              className="rounded-xl px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="text-white/40 text-[9px] uppercase tracking-[0.1em] font-mono mb-1.5">{k.label}</div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold leading-none" style={{ color: k.c, fontSize: "clamp(15px,1.5vw,21px)", fontFamily: "var(--font-benzin), system-ui" }}>{k.val}</span>
                {k.unit && <span className="font-bold leading-none" style={{ color: k.c, fontSize: "12px", fontFamily: "var(--font-benzin), system-ui" }}>{k.unit}</span>}
                {k.up && <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" style={{ color: LIME }} strokeWidth={2.5} />}
              </div>
              {k.sub && <div className="text-white/35 text-[9px] font-mono mt-1">{k.sub}</div>}
            </motion.div>
          ))}
        </div>

        {/* Main: chart + channels */}
        <div className="flex-1 min-h-0 grid grid-cols-5 gap-3">
          {/* Доход vs расход по неделям */}
          <div className="col-span-3 rounded-xl p-3 flex flex-col min-h-0" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="shrink-0 flex items-center justify-between mb-2">
              <span className="text-white/55 text-[9px] uppercase tracking-[0.1em] font-mono">доход / расход · по неделям</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[9px] font-mono text-white/45"><span className="w-2 h-2 rounded-sm" style={{ background: LIME }} />доход</span>
                <span className="flex items-center gap-1 text-[9px] font-mono text-white/45"><span className="w-2 h-2 rounded-sm" style={{ background: `${ORANGE}99` }} />расход</span>
              </span>
            </div>
            <div className="flex-1 min-h-0 flex items-end justify-between gap-2.5">
              {WEEKS.map((wk, i) => (
                <div key={wk.w} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
                  <div className="w-full flex-1 min-h-0 flex items-end justify-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(wk.rev / MAX_REV) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.5 + i * 0.1, ease: [0.25, 1, 0.5, 1] }}
                      className="w-full max-w-[26px] rounded-t-[3px] origin-bottom"
                      style={{ background: `linear-gradient(to top, ${LIME}, ${LIME}88)`, boxShadow: `0 0 14px -2px ${LIME}66` }}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(wk.cost / MAX_REV) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.6 + i * 0.1, ease: [0.25, 1, 0.5, 1] }}
                      className="w-full max-w-[16px] rounded-t-[3px] origin-bottom"
                      style={{ background: `${ORANGE}88` }}
                    />
                  </div>
                  <span className="shrink-0 text-white/35 text-[9px] font-mono">{wk.w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Каналы — топ в плюсе / в минусе */}
          <div className="col-span-2 rounded-xl p-3 flex flex-col min-h-0" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="shrink-0 text-white/55 text-[9px] uppercase tracking-[0.1em] font-mono mb-2">каналы · ROMI</div>
            <div className="flex-1 min-h-0 flex flex-col justify-between gap-1.5">
              {CHANNELS.map((ch, i) => {
                const c = romiColor(ch.romi);
                const wpct = Math.max(6, (Math.abs(ch.romi) / ROMI_MAX) * 100);
                return (
                  <motion.div
                    key={ch.name}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                    className="flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-[11px] font-medium leading-none">{ch.name}</span>
                      <span className="flex items-center gap-0.5 font-bold leading-none" style={{ color: c, fontSize: "12px", fontFamily: "var(--font-benzin), system-ui" }}>
                        {ch.romi < 0 ? <ArrowDownRight className="w-3 h-3" strokeWidth={2.5} /> : <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />}
                        {ch.romi > 0 ? "+" : ""}{ch.romi}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${wpct}%` }}
                        transition={{ duration: 0.8, delay: 0.8 + i * 0.1, ease: [0.25, 1, 0.5, 1] }}
                        className="h-full rounded-full"
                        style={{ background: c, boxShadow: `0 0 10px -1px ${c}88` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
