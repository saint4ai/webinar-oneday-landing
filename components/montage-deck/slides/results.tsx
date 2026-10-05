"use client";

import { motion } from "framer-motion";
import { ExtrudedNumber, ScreenStage3D } from "../fx";
import { RESULTS, fmtStat, type Stat } from "../results";
import { Statement } from "../Statement";
import { T, card } from "../theme";
import { EASE, Em, Fill, Note, Num, STEP } from "../ui";

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

/** 22r · 30 дней: что смонтировал агент. Цифры и подписи — RESULTS.montage (срез 4 октября, три площадки). */
export function M_ResultMontage() {
  const r = RESULTS.montage;
  return (
    <Statement kicker="Результаты за месяц · монтаж" title={r.title} size="2.5cqw">
      <div className="flex items-end gap-[2.4cqw]">
        <MainStat value={r.views} label={r.viewsLabel} size="6.6cqw" />
      </div>
      <div className="grid grid-cols-3 gap-[0.8cqw]" style={{ marginTop: "1.8cqw", maxWidth: "44cqw" }}>
        {r.small.map((s, i) => <SmallStat key={s.label} i={i + 1} value={s.value} label={s.label} />)}
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

/** Скрин рилса в рамке 9:16. Нет файла — пунктирное место с номером и путём, куда положить скрин. */
const ReelShot = ({ src, n, file }: { src?: string; n: number; file: string }) => (
  <div style={{ width: "100%", aspectRatio: "9 / 16", borderRadius: "0.9cqw", overflow: "hidden", background: src ? T.card : `${T.card}99`,
    boxShadow: src ? `0 0 0 1px ${T.line}, ${T.shadowSm}` : "none", border: src ? "none" : `1.5px dashed ${T.brownLt}`,
    display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
    {src ? <img src={src} alt={`Рилс ${n}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : (
      <div style={{ padding: "0.6cqw" }}>
        <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.6cqw", color: T.brownLt }}>{n}</div>
        <div style={{ ...lbl, fontSize: "0.68cqw", marginTop: "0.4cqw" }}>скрин рилса<br />с просмотрами</div>
        <div style={{ ...lbl, fontSize: "0.58cqw", marginTop: "0.4cqw", color: T.brownLt, wordBreak: "break-all" }}>results/{file}.png</div>
      </div>
    )}
  </div>
);

/** «135 тыс.» → число «135» крупно и «тыс. просмотров» мелко: в узкой плитке одна строка из Unbounded не помещается. */
const splitViews = (v: string): [string, string] => {
  const m = /^(.+?)\s+(тыс\.|млн)$/.exec(v);
  return m ? [m[1], `${m[2]} просмотров`] : [v, "просмотров"];
};

/** 10v · Рилсы, которые залетели: шесть скринов волной, под каждым — просмотры и тема. Цифры и файлы — RESULTS.viral. */
export function M_ViralReels({ shots = [] }: { shots?: (string | undefined)[] }) {
  return (
    <Statement kicker="Результаты · рилсы" title="Рилсы, которые залетели" size="2.6cqw"
      lead={RESULTS.viralSource ?? <>Скрины из Instagram, просмотры на <Fill>дата скринов</Fill></>}>
      <div className="grid grid-cols-6 gap-[0.9cqw]" style={{ maxWidth: "54cqw" }}>
        {RESULTS.viral.map((r, i) => {
          const [num, unit] = r.views == null ? ["", ""] : splitViews(r.views);
          return (
            <motion.div key={r.file} initial={{ opacity: 0, y: "3cqw", rotate: i % 2 ? 3 : -3 }} animate={{ opacity: 1, y: i % 2 ? "1.2cqw" : "0cqw", rotate: 0 }}
              transition={{ delay: 0.35 + i * 0.09, type: "spring", stiffness: 160, damping: 16 }}>
              <ReelShot src={shots[i]} n={i + 1} file={r.file} />
              <div style={{ marginTop: "0.6cqw" }}>
                {r.views == null ? <Waiting /> : <>
                  <Num size="1.5cqw" color={T.brown}>{num}</Num>
                  <div style={{ ...lbl, fontSize: "0.75cqw" }}>{unit}</div>
                </>}
                {r.title && <div style={{ ...lbl, fontSize: "0.75cqw", marginTop: "0.3cqw", color: T.ink }}>{r.title}</div>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Statement>
  );
}

/** 10g · 30 дней: охваты и подписчики. Два скрина панели Instagram на плитах, справа три цифры ровно с этих скринов (RESULTS.growth). */
export function M_Growth30({ reach, followers }: { reach?: string; followers?: string }) {
  const g = RESULTS.growth;
  return (
    <Statement kicker="Результаты · 30 дней" title={<>30 дней: <Em>охваты и подписчики</Em></>} size="2.6cqw">
      <div className="grid items-center gap-[1.4cqw]" style={{ gridTemplateColumns: "15cqw 15cqw minmax(0, 1fr)", maxWidth: "54cqw" }}>
        <div style={{ height: "25cqw" }}>
          <ScreenStage3D src={reach} alt="Просмотры, подписчики и неподписчики за 30 дней" empty={`Сюда скрин просмотров за 30 дней: results/${g.reachShot}.png`} />
        </div>
        <div style={{ height: "25cqw" }}>
          <ScreenStage3D src={followers} alt="Подписчики и часы наибольшей активности" empty={`Сюда скрин подписчиков: results/${g.followersShot}.png`} />
        </div>
        <div className="grid gap-[0.7cqw]">
          {g.stats.map((s, i) => <SmallStat key={s.label} i={i + 1} value={s.value} label={s.label} />)}
        </div>
      </div>
      <Note style={{ marginTop: "1cqw" }}>{g.source ?? <>Источник: <Fill>статистика Instagram, даты периода</Fill></>}</Note>
    </Statement>
  );
}

/** 10i · Обращения за 30 дней: одна объёмная цифра (RESULTS.inquiries), без разбивки по услугам и обучению. */
export function M_Inquiries() {
  const q = RESULTS.inquiries;
  return (
    <Statement kicker="Результаты · заявки" title={<>Обращения за 30 дней: <Em>контент приводит клиентов</Em></>} size="2.6cqw">
      <MainStat value={q.total} label={q.label} size="9cqw" />
      <In i={3}><Note style={{ marginTop: "1.6cqw" }}>{q.source ?? <>Откуда цифры: <Fill>CRM или директ, даты периода</Fill></>}</Note></In>
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
