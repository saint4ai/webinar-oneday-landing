"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Activity, Megaphone, Image as ImageIcon, Target } from "lucide-react";

/**
 * AnalyticsDashboard — мокап дашборда сквозной аналитики с живыми графиками.
 * Лёгкие CSS/SVG-анимации (без нагрузки): бары пульсируют, линия течёт, donut вращается.
 * Used by: Slide 27 (Направление 1 — свой сервис на продажу).
 *
 * Бренд: чёрный + лайм #B6FF00 + оранж #FC5C02.
 */
const LIME = "#B6FF00";
const ORANGE = "#FC5C02";

const BARS = [0.4, 0.6, 0.45, 0.72, 0.55, 0.85, 0.65, 0.95, 0.7, 1.0, 0.8, 0.9];
const LINE = [0.5, 0.35, 0.55, 0.42, 0.68, 0.58, 0.8, 0.72, 0.92];

export function AnalyticsDashboard() {
  // area path
  const W = 100, H = 40;
  const pts = LINE.map((v, i) => ({ x: (i / (LINE.length - 1)) * W, y: H - v * (H - 4) - 2 }));
  const line = pts.reduce((a, p, i) => i === 0 ? `M ${p.x},${p.y}` : `${a} L ${p.x},${p.y}`, "");
  const area = `${line} L ${W},${H} L 0,${H} Z`;

  return (
    <div
      className="w-full rounded-2xl overflow-hidden p-5"
      style={{
        background: "linear-gradient(160deg, #0d120d 0%, #070707 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 30px 60px -25px rgba(182,255,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Header дашборда */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-white font-bold text-sm md:text-base leading-none">Сквозная аналитика</div>
          <div className="text-white/40 text-[10px] font-mono uppercase tracking-[0.1em] mt-1">live · обновлено сейчас</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: `${LIME}14`, border: `1px solid ${LIME}33` }}>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: LIME }}
          />
          <span className="text-[9px] font-mono uppercase" style={{ color: LIME }}>online</span>
        </div>
      </div>

      {/* KPI-строка 1 — финансы */}
      <div className="grid grid-cols-4 gap-2.5 mb-2.5">
        {[
          { icon: DollarSign, val: "4.8M", label: "выручка", c: LIME },
          { icon: Users, val: "1 240", label: "лиды", c: "#fff" },
          { icon: TrendingUp, val: "+32%", label: "рост", c: LIME },
          { icon: Activity, val: "18%", label: "конверсия", c: ORANGE },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <Icon className="w-3.5 h-3.5 mb-2" style={{ color: k.c }} />
              <div className="font-bold leading-none" style={{ color: k.c, fontSize: "18px", fontFamily: "var(--font-benzin), system-ui" }}>{k.val}</div>
              <div className="text-white/35 text-[9px] uppercase tracking-[0.06em] mt-1.5 font-mono">{k.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* KPI-строка 2 — каналы и креативы */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { icon: Megaphone, val: "ROI 4.2x", label: "Facebook Ads", c: LIME },
          { icon: ImageIcon, val: "87 / 100", label: "оценка креативов", c: "#fff" },
          { icon: Target, val: "92%", label: "эффективность", c: LIME },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${LIME}14`, border: `1px solid ${LIME}22` }}>
                <Icon className="w-4 h-4" style={{ color: k.c }} />
              </div>
              <div>
                <div className="font-bold leading-none" style={{ color: k.c, fontSize: "16px", fontFamily: "var(--font-benzin), system-ui" }}>{k.val}</div>
                <div className="text-white/35 text-[9px] uppercase tracking-[0.06em] mt-1.5 font-mono">{k.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Графики: area + bars */}
      <div className="grid grid-cols-5 gap-3">
        {/* Area chart — течёт */}
        <div className="col-span-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-white/50 text-[9px] uppercase tracking-[0.1em] font-mono mb-2">воронка продаж</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "70px" }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LIME} stopOpacity="0.4" />
                <stop offset="100%" stopColor={LIME} stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}
              d={area} fill="url(#dashArea)"
            />
            <motion.path
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.6, ease: "easeInOut" }}
              d={line} fill="none" stroke={LIME} strokeWidth="1.5" strokeLinecap="round"
            />
            <motion.circle
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2" fill={LIME}
            />
          </svg>
        </div>

        {/* Bars — пульсируют */}
        <div className="col-span-2 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-white/50 text-[9px] uppercase tracking-[0.1em] font-mono mb-2">по каналам</div>
          <div className="flex items-end gap-[3px]" style={{ height: "70px" }}>
            {BARS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: [b * 0.85, b, b * 0.85] }}
                transition={{ duration: 2 + (i % 3) * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
                className="flex-1 rounded-t-[2px] origin-bottom"
                style={{
                  height: "100%",
                  background: i === BARS.length - 1 ? ORANGE : `linear-gradient(to top, ${LIME}, ${LIME}66)`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
