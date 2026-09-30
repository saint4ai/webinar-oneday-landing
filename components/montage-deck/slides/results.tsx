"use client";

import { motion } from "framer-motion";
import { ExtrudedNumber, ScreenStage3D } from "../fx";
import { RESULTS, fmtStat, type Stat } from "../results";
import { Statement } from "../Statement";
import { T, card } from "../theme";
import { EASE, Note, Num, STEP } from "../ui";

/**
 * Три слайда «результаты за месяц»: 22r (монтаж), 46r (ИИ-бот), 47r (заявки с блога).
 * Цифры — только из results.ts; null → «—» и пометка «ждёт цифры». Всё в левых 60% кадра.
 */

const lbl: React.CSSProperties = { fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "0.95cqw", lineHeight: 1.3, color: T.muted };

/** Пометка для пустой цифры: владелец ещё не вписал её в results.ts. */
const Waiting = ({ style }: { style?: React.CSSProperties }) => (
  <span style={{ display: "inline-block", fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.75cqw", letterSpacing: ".1em", textTransform: "uppercase",
    color: T.brownLt, border: `1px dashed ${T.brownLt}`, borderRadius: 999, padding: "0.2cqw 0.7cqw", whiteSpace: "nowrap", ...style }}>ждёт цифры</span>
);

const In = ({ i, children, style, className }: { i: number; children: React.ReactNode; style?: React.CSSProperties; className?: string }) => (
  <motion.div className={className} style={style} initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.3 + i * STEP, duration: 0.42, ease: EASE }}>{children}</motion.div>
);

/** Малая цифра в карточке сайта. */
const SmallStat = ({ value, label, i }: { value: Stat | string; label: string; i: number }) => {
  const empty = value == null;
  return (
    <In i={i} style={{ ...card, borderRadius: 20, padding: "1cqw 1.2cqw" }}>
      {/* Строка («40 секунд») длиннее числа — мельче, чтобы не вылезала из карточки */}
      <Num size={typeof value === "string" && value.length > 5 ? "1.35cqw" : "2.1cqw"} color={empty ? T.muted : T.ink}>{typeof value === "string" ? value : fmtStat(value)}</Num>
      <div style={{ ...lbl, marginTop: "0.5cqw" }}>{label}</div>
      {empty && <Waiting style={{ marginTop: "0.5cqw" }} />}
    </In>
  );
};

/** Главная цифра: объёмная, коричневая. Пустая — спокойное «—» с подписью и пометкой, без объёма. */
const MainStat = ({ value, label, size }: { value: Stat; label: string; size: string }) =>
  value == null ? (
    <In i={0}>
      <Num size={size} color={T.line}>—</Num>
      <div className="flex items-center gap-[0.8cqw]" style={{ marginTop: "1.2cqw" }}>
        <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9cqw", letterSpacing: ".14em", textTransform: "uppercase", color: T.accent }}>{label}</span>
        <Waiting />
      </div>
    </In>
  ) : (
    <div style={{ marginTop: "1.4cqw" }}><ExtrudedNumber value={fmtStat(value)} label={label} size={size} /></div>
  );

/** 22r · Сентябрь: что смонтировал агент. */
export function M_ResultMontage() {
  const r = RESULTS.montage;
  return (
    <Statement kicker="Результаты за месяц · монтаж" title={`${RESULTS.month}: что смонтировал агент`} size="2.5cqw">
      <div className="flex items-end gap-[2.4cqw]">
        <MainStat value={r.views} label="просмотров" size="6.6cqw" />
      </div>
      <div className="grid grid-cols-3 gap-[0.8cqw]" style={{ marginTop: "1.8cqw", maxWidth: "44cqw" }}>
        <SmallStat i={1} value={r.reels} label="роликов" />
        <SmallStat i={2} value={r.saves} label="сохранений" />
        <SmallStat i={3} value={r.followers} label="новых подписчиков" />
      </div>
      <div className="flex gap-[0.7cqw]" style={{ marginTop: "1.4cqw" }}>
        {r.covers.map((c, i) => (
          <In key={c} i={4 + i} style={{ width: "5.2cqw", aspectRatio: "9 / 16", borderRadius: "0.7cqw", overflow: "hidden", boxShadow: `0 0 0 1px ${T.line}, ${T.shadowSm}`, background: T.card }}>
            <img src={`/montage/reels/${c}.jpg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </In>
        ))}
      </div>
      <Note style={{ marginTop: "1cqw" }}>{r.source}</Note>
    </Statement>
  );
}

/** 46r · Сентябрь: ИИ-бот в директе. Справа от цифр — скрин бота на плите. */
export function M_ResultBot({ shot }: { shot?: string }) {
  const r = RESULTS.bot;
  return (
    <Statement kicker="Результаты за месяц · ИИ-бот" title={`${RESULTS.month}: ИИ-бот в директе`} size="2.5cqw">
      <div className="grid items-center gap-[2cqw]" style={{ gridTemplateColumns: "minmax(0, 1fr) 16cqw", maxWidth: "53cqw" }}>
        <div>
          <MainStat value={r.dialogs} label="диалогов" size="5.6cqw" />
          <div className="grid grid-cols-3 gap-[0.7cqw]" style={{ marginTop: "1.8cqw" }}>
            <SmallStat i={1} value={r.codeWords} label="кодовых слов" />
            <SmallStat i={2} value={r.leads} label="заявок передано менеджеру" />
            <SmallStat i={3} value={r.avgReply} label="среднее время ответа" />
          </div>
          <Note>{r.source}</Note>
        </div>
        <div style={{ height: "26cqw" }}>
          <ScreenStage3D src={shot} alt="ИИ-бот в директе Instagram" empty={`Сюда скрин бота: public/montage/results/${r.screenshot}`} />
        </div>
      </div>
    </Statement>
  );
}

/** 47r · Заявки с блога за месяц: слева скрин заявок на плите, справа число и откуда оно. */
export function M_ResultBlog({ shot }: { shot?: string }) {
  const r = RESULTS.blog;
  return (
    <Statement kicker="Результаты за месяц · заявки" title={`${RESULTS.month}: заявки с блога`} size="2.5cqw">
      <div className="grid items-center gap-[2.6cqw]" style={{ gridTemplateColumns: "22cqw minmax(0, 1fr)", maxWidth: "52cqw" }}>
        <div style={{ height: "26cqw" }}>
          <ScreenStage3D src={shot} alt="Заявки с блога в CRM" empty={`Сюда скрин заявок из CRM за месяц: public/montage/results/${r.screenshot}`} />
        </div>
        <div>
          <MainStat value={r.leads} label="заявок" size="7cqw" />
          <In i={2}><Note style={{ marginTop: "1.2cqw", fontSize: "0.95cqw" }}>{r.source ?? <>Откуда цифра: <Waiting /></>}</Note></In>
        </div>
      </div>
    </Statement>
  );
}
