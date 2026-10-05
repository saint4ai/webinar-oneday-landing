"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CASES, type BizCase } from "../cases";
import { Statement } from "../Statement";
import { T, card } from "../theme";
import { EASE, Em, Note, txt } from "../ui";

/**
 * 08c · Что я собрал для бизнеса: автокарусель кейсов. Окно браузера с экраном решения сменяется каждые 3,4 с,
 * за ним выглядывает следующий кейс, сверху полоса «историй» показывает, сколько решений и какое сейчас.
 * Данные — components/montage-deck/cases.ts. Всё в левых 60% кадра.
 */

const HOLD = 3.4; // секунд на кейс

/** Окно браузера: полоса с тремя точками и адресом страницы кейса, под ней экран решения. */
function Window({ c }: { c: BizCase }) {
  return (
    <div className="h-full w-full overflow-hidden" style={{ ...card, borderRadius: "1.2cqw", background: T.paper, boxShadow: T.shadow }}>
      <div className="flex items-center" style={{ gap: "0.4cqw", padding: "0.55cqw 0.8cqw", borderBottom: `1px solid ${T.line}`, background: T.card }}>
        {[T.gold, T.brownLt, T.line].map((col, k) => <span key={k} style={{ width: "0.55cqw", height: "0.55cqw", borderRadius: 99, background: col }} />)}
        <span style={{ ...txt, fontSize: "0.72cqw", color: T.muted, marginLeft: "0.6cqw", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.url}</span>
      </div>
      <img src={c.shot} alt={`Экран решения: ${c.title}`} draggable={false} style={{ display: "block", width: "100%", aspectRatio: "16 / 10", objectFit: "cover", objectPosition: "top" }} />
    </div>
  );
}

export function M_Cases() {
  const n = CASES.length;
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % n), HOLD * 1000);
    return () => clearInterval(id);
  }, [n]);
  const c = CASES[i];
  const next = CASES[(i + 1) % n];

  return (
    <Statement kicker="Вайбкодинг · решения для бизнеса" title={<>Что я собрал для бизнеса <Em>без программистов</Em></>} size="2.7cqw">
      {/* Полоса «историй»: сколько решений и какое на экране */}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap: "0.6cqw", maxWidth: "54cqw", marginBottom: "1.2cqw" }}>
        {CASES.map((x, k) => (
          <div key={x.slug} className="min-w-0">
            <div style={{ height: "0.35cqw", borderRadius: 99, background: `${T.brown}1F`, overflow: "hidden" }}>
              {k < i && <div style={{ width: "100%", height: "100%", background: T.gold2 }} />}
              {k === i && <motion.div key={`fill-${i}`} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: HOLD, ease: "linear" }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${T.gold}, ${T.gold2})` }} />}
            </div>
            <div style={{ ...txt, fontSize: "0.8cqw", fontWeight: 700, marginTop: "0.45cqw", color: k === i ? T.brown : T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color .3s" }}>{x.title}</div>
          </div>
        ))}
      </div>

      <div className="grid items-center" style={{ gridTemplateColumns: "32cqw minmax(0, 1fr)", gap: "2cqw", maxWidth: "54cqw" }}>
        <div className="relative" style={{ aspectRatio: "16 / 11.3", perspective: "90cqw" }}>
          {/* Следующий кейс выглядывает сзади снизу справа: видно, что решений больше одного, а его адресная строка спрятана за передним окном */}
          {n > 1 && (
            <div className="absolute inset-0" style={{ transform: "translate(1.2cqw, 1.1cqw) scale(0.95)", transformOrigin: "bottom right", opacity: 0.4, filter: "saturate(.7)" }}>
              <Window c={next} />
            </div>
          )}
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={c.slug} className="absolute inset-0" initial={{ opacity: 0, x: "5cqw", rotateY: -14, scale: 0.97 }} animate={{ opacity: 1, x: "0cqw", rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, x: "-5cqw", rotateY: 14, scale: 0.97 }} transition={{ duration: 0.6, ease: EASE }} style={{ transformOrigin: "center" }}>
              <Window c={c} />
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`info-${c.slug}`} className="min-w-0" initial={{ opacity: 0, y: "0.8cqw" }} animate={{ opacity: 1, y: "0cqw" }} exit={{ opacity: 0, y: "-0.6cqw" }} transition={{ duration: 0.35, ease: EASE }}>
            <div style={{ ...txt, fontSize: "0.85cqw", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.accent }}>{c.niche}</div>
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.6cqw", lineHeight: 1.15, color: T.brown, marginTop: "0.5cqw" }}>{c.title}</div>
            <div style={{ ...txt, fontSize: "1.2cqw", fontWeight: 700, lineHeight: 1.3, marginTop: "0.8cqw" }}>{c.oneLiner}</div>
            <div style={{ display: "inline-block", marginTop: "1cqw", borderRadius: 14, padding: "0.6cqw 0.9cqw", border: `1px solid ${T.gold2}`, background: `${T.gold}24`, ...txt, fontSize: "0.95cqw", fontWeight: 700 }}>
              {/* части метрики не рвутся внутри, точка остаётся в конце строки, а не в начале следующей */}
              {c.metric.split(" · ").map((p, k, all) => <span key={k}><span style={{ whiteSpace: "nowrap" }}>{p}{k < all.length - 1 ? " ·" : ""}</span>{k < all.length - 1 ? " " : ""}</span>)}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <Note style={{ marginTop: "1.3cqw", fontSize: "0.95cqw" }}>Все кейсы целиком: onai.academy/saint</Note>
    </Statement>
  );
}
