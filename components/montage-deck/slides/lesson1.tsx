"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone } from "../Phone";
import { Statement } from "../Statement";
import { T, glass } from "../theme";
import { Card, EASE, Note, Num, nb } from "../ui";

const txt: React.CSSProperties = { fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "1.05cqw", lineHeight: 1.4, color: T.ink };
const Stagger = ({ i, children, style }: { i: number; children: React.ReactNode; style?: React.CSSProperties }) => (
  <motion.div style={style} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08, duration: 0.45, ease: EASE }}>{children}</motion.div>
);

/** 12 · Монтаж стал узким местом. */
export function M_Bottleneck() {
  const ways = [
    ["Монтажёр", "Дорого, и платить каждый месяц", "lg-i-laptopcoins"],
    ["Сам в CapCut", "Вечер уходит на один ролик", "lg-i-laptopfilm"],
    ["Не выкладываю", "Снял, а монтировать некогда", "lg-i-calendar"],
  ];
  return (
    <Statement kicker="Урок 1 · Проблема" title="Рилсы нужны. Монтаж стал узким местом" size="2.7cqw">
      <div className="grid grid-cols-3 gap-[1cqw]" style={{ maxWidth: "54cqw" }}>
        {ways.map(([t, d, ic], i) => <Stagger key={t} i={i}><Card icon={ic} no={`Путь ${i + 1}`} title={t} text={d} style={{ height: "100%" }} /></Stagger>)}
      </div>
      <Stagger i={4}><div style={{ ...txt, fontSize: "1.3cqw", marginTop: "2cqw", color: T.accent }}>Проблема не в вас. Монтаж перестал быть ручной работой.</div></Stagger>
    </Statement>
  );
}

/** 13 · Вакансия монтажёра. */
export function M_Vacancy() {
  return (
    <Statement obj="lg-s13-editor" kicker="Сколько стоит монтажёр" title={<>Монтажёр на CapCut: от {nb("300 000 ₸")} в месяц</>} size="2.6cqw">
      <div className="grid grid-cols-2 gap-[1cqw]" style={{ maxWidth: "50cqw" }}>
        <Stagger i={0} style={{ ...glass, borderRadius: 22, padding: "1.4cqw 1.6cqw" }}>
          <div style={{ ...txt, color: T.muted, fontSize: "0.85cqw", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Вакансия · hh.kz</div>
          <div style={{ ...txt, fontSize: "1.3cqw", fontWeight: 700, marginTop: "0.7cqw" }}>Видеомонтажёр на CapCut</div>
          <div style={{ ...txt, color: T.muted, fontWeight: 500, marginTop: "0.3cqw" }}>Алматы</div>
          <div style={{ marginTop: "1cqw" }}><Num size="2.2cqw" color={T.accent}>{nb("от 300 000 ₸")}</Num></div>
          <div style={{ ...txt, color: T.muted, fontWeight: 500, fontSize: "0.85cqw", marginTop: "0.5cqw" }}>на руки, в месяц</div>
        </Stagger>
        <Stagger i={1}><Card no="Или самому" title="Premiere и CapCut учить месяцами" text="Сложные программы и ручная работа над каждым роликом." style={{ height: "100%" }} /></Stagger>
      </div>
      <Note>Вакансия на hh.kz, 26 сентября 2026</Note>
    </Statement>
  );
}

/** 14 ✦ · Охват решают первые 3 секунды: лента листается сама, полосы растут. */
export function M_ThreeSeconds() {
  const posters = ["mcp", "zashita", "google10", "papka"];
  const feed = [...posters, ...posters];
  const Row = ({ label, value, pct, strong, i }: { label: string; value: string; pct: number; strong?: boolean; i: number }) => (
    <Stagger i={i} style={{ ...glass, borderRadius: 20, padding: "1.3cqw 1.6cqw" }}>
      <div className="flex items-baseline justify-between gap-[1cqw]">
        <span style={txt}>{label}</span>
        <Num size="2.5cqw" color={strong ? T.accent : T.muted}>{value}</Num>
      </div>
      <div style={{ marginTop: "0.9cqw", height: "0.9cqw", borderRadius: 999, background: "rgba(139,94,60,.1)", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.8 + i * 0.2, duration: 1, ease: EASE }}
          style={{ height: "100%", borderRadius: 999, background: strong ? `linear-gradient(90deg, ${T.gold}, ${T.gold2})` : "rgba(110,95,83,.45)" }} />
      </div>
    </Stagger>
  );
  return (
    <Statement kicker="Моя статистика Instagram · 14 рилсов" title={<>Охват решают<br />первые 3 секунды</>} size="2.8cqw"
      lead="Медиана охвата рилса в зависимости от того, сколько людей пролистали его сразу."
      leftSize="15cqw" leftOverflow="hidden"
      left={
        <div className="relative h-full w-full overflow-hidden" style={{ maskImage: "linear-gradient(transparent, #000 18%, #000 82%, transparent)", WebkitMaskImage: "linear-gradient(transparent, #000 18%, #000 82%, transparent)" }}>
          <motion.div className="flex flex-col items-center gap-[1cqw]" style={{ paddingTop: "1cqw" }}
            animate={{ y: ["0%", "-50%"] }} transition={{ duration: 14, ease: "linear", repeat: Infinity }}>
            {feed.map((p, i) => (
              <div key={i} className="relative" style={{ width: "9.5cqw", aspectRatio: "9/16", borderRadius: "1cqw", overflow: "hidden", boxShadow: T.shadow }}>
                <img src={`/montage/reels/${p}.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-x-[6%] top-[4%] h-[3px] overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.35)" }}>
                  <motion.div className="h-full" style={{ background: T.gold }} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.4 }} />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      }>
      <div className="grid gap-[0.9cqw]" style={{ maxWidth: "42cqw" }}>
        <Row i={0} label="Пролистали меньше 46%" value={nb("4 816")} pct={100} strong />
        <Row i={1} label="Пролистали больше 46%" value={nb("1 098")} pct={23} />
      </div>
      <Note>Данные на 19 сентября 2026. Связь доли пролистываний с охватом: −0,84</Note>
    </Statement>
  );
}

/** 15 · Правило первой фразы. */
export function M_OnePhrase() {
  const rules = ["Огромный шрифт", "Контраст с фоном", "Без мелких подписей"];
  const Bar = ({ label, pct, strong, i }: { label: string; pct: number; strong?: boolean; i: number }) => (
    <div>
      <div className="flex justify-between" style={{ ...txt, fontSize: "0.95cqw" }}><span>{label}</span><span style={{ fontVariantNumeric: "tabular-nums", color: strong ? T.accent : T.muted }}>{pct}%</span></div>
      <div style={{ marginTop: "0.5cqw", height: "0.7cqw", borderRadius: 999, background: "rgba(139,94,60,.1)", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct * 1.6}%` }} transition={{ delay: 0.7 + i * 0.2, duration: 0.9, ease: EASE }}
          style={{ height: "100%", borderRadius: 999, background: strong ? "rgba(110,95,83,.45)" : `linear-gradient(90deg, ${T.gold}, ${T.gold2})` }} />
      </div>
    </div>
  );
  return (
    <Statement kicker="Правило первых 3 секунд" title="Одна фраза-обещание на 4–6 слов" size="2.7cqw">
      <div className="flex flex-wrap gap-[0.7cqw]">
        {rules.map((r, i) => (
          <Stagger key={r} i={i}><span style={{ ...glass, borderRadius: 999, padding: "0.8cqw 1.4cqw", display: "inline-block", ...txt }}>{r}</span></Stagger>
        ))}
      </div>
      <Stagger i={3} style={{ ...glass, borderRadius: 22, padding: "1.4cqw 1.6cqw", marginTop: "1.6cqw", maxWidth: "40cqw" }}>
        <div style={{ ...txt, fontWeight: 700, marginBottom: "1cqw" }}>Тот же голос, два монтажа. Сколько пролистали сразу:</div>
        <div className="grid gap-[0.9cqw]">
          <Bar i={0} label="Оригинал" pct={34} />
          <Bar i={1} label="Красивый перемонтаж" pct={49} strong />
        </div>
      </Stagger>
      <Note>Красота не спасает слабое начало. Данные моей статистики Instagram</Note>
    </Statement>
  );
}

/** 16 · Из 14 залетел 1 → 30 роликов в месяц. */
export function M_OneOf14() {
  return (
    <Statement obj="lg-s16-phones" objSize="4.6cqw" kicker="Моя статистика" title="Из 14 рилсов залетел 1. Поэтому 30 роликов в месяц" size="2.6cqw"
      lead="Пробные рилсы сначала видят неподписчики. Показывать ли ролик подписчикам, решаете по первым 72 часам.">
      <div className="flex flex-wrap gap-[0.5cqw]" style={{ maxWidth: "36cqw" }}>
        {Array.from({ length: 14 }, (_, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: i === 9 ? [1, 1.25, 1] : 1 }}
            transition={{ delay: 0.4 + i * 0.05, duration: i === 9 ? 0.8 : 0.3, ease: EASE }}
            style={{ width: "2.1cqw", height: "3.7cqw", borderRadius: "0.5cqw",
              background: i === 9 ? `linear-gradient(180deg, ${T.gold}, ${T.gold2})` : "rgba(139,94,60,.14)",
              boxShadow: i === 9 ? `0 10px 24px -10px ${T.gold2}` : "none" }} />
        ))}
      </div>
      <Note>14 рилсов на 19 сентября 2026. Охват никто не гарантирует, количество по системе повышает шансы</Note>
    </Statement>
  );
}

/** 17 · Монтажёр живёт на вашем компьютере. */
export function M_AgentOnPC() {
  return (
    <Statement kicker="Как это устроено" title="Монтажёр теперь живёт на вашем компьютере" size="2.7cqw"
      lead="Программировать не нужно. Агент сам ставит всё нужное и ведёт по шагам.">
      <div className="flex items-end gap-[1.2cqw]">
        <motion.img src="/montage/obj/s17-laptop.webp" alt="Монтажёр внутри ноутбука" initial={{ opacity: 0, y: 30, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }} style={{ width: "31cqw", height: "auto", filter: "drop-shadow(0 30px 40px rgba(42,33,28,.22))" }} />
        <Stagger i={6} style={{ ...glass, borderRadius: 22, padding: "1.1cqw 1.2cqw", width: "20cqw", marginBottom: "1.5cqw" }}>
          <div className="flex items-center gap-[0.5cqw]" style={{ marginBottom: "0.7cqw" }}>
            <img src="/montage/logos/claude.svg" alt="" style={{ width: "1.2cqw", height: "1.2cqw" }} />
            <img src="/montage/logos/openai_mark.svg" alt="" style={{ width: "1.2cqw", height: "1.2cqw" }} />
            <span style={{ ...txt, fontSize: "0.78cqw", color: T.muted }}>Одно сообщение на старте</span>
          </div>
          <div style={{ borderRadius: 14, padding: "0.8cqw 0.9cqw", background: "rgba(139,94,60,.08)", ...txt, fontWeight: 500, fontSize: "0.9cqw" }}>
            Прочитай навык монтажа и работай только по нему. Проведи со мной интервью. Финал не собирай, пока я не одобрю кадры и черновик.
          </div>
        </Stagger>
      </div>
    </Statement>
  );
}

/** 18 ✦ · 5 шагов: куски ролика защёлкиваются на дорожке, по ней бежит курсор. */
export function M_FiveSteps() {
  const steps = [
    ["Сценарий", 20], ["Формат и стиль", 18], ["Сборка", 26], ["Проверка кадров", 18], ["Публикация", 18],
  ] as const;
  const tones = ["#E3C07B", "#D8B06A", "#C9A05A", "#B58A4A", "#8B5E3C"];
  return (
    <Statement kicker="Урок 1 · Порядок работы" title="От голоса до ролика: 5 шагов" size="2.9cqw">
      <div className="relative" style={{ maxWidth: "52cqw", paddingTop: "1cqw" }}>
        <div className="flex gap-[0.35cqw]" style={{ height: "4.2cqw", padding: "0.4cqw", borderRadius: 18, background: "rgba(139,94,60,.1)" }}>
          {steps.map(([name, w], i) => (
            <motion.div key={name} initial={{ y: "-5cqw", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.3 + i * 0.18 }}
              className="flex items-center justify-center" style={{ width: `${w}%`, borderRadius: 12, background: tones[i], fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1cqw", color: i > 2 ? T.paper : T.ink }}>
              {i + 1}
            </motion.div>
          ))}
        </div>
        <motion.div className="absolute" initial={{ left: "0%", opacity: 0 }} animate={{ left: ["0%", "100%"], opacity: 1 }}
          transition={{ left: { delay: 1.5, duration: 3.5, ease: "linear", repeat: Infinity, repeatDelay: 0.6 }, opacity: { delay: 1.5, duration: 0.2 } }}
          style={{ top: "0.3cqw", bottom: "-0.4cqw", width: 2, background: T.ink, borderRadius: 2 }} />
        <div className="flex gap-[0.35cqw]" style={{ padding: "0 0.4cqw", marginTop: "0.9cqw" }}>
          {steps.map(([name, w], i) => (
            <motion.div key={name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.18 }}
              style={{ width: `${w}%`, ...txt, fontSize: "0.95cqw", textAlign: "center" }}>{name}</motion.div>
          ))}
        </div>
      </div>
      <Note>Агент останавливается и ждёт вашего одобрения на сценарии, кадрах и черновике</Note>
    </Statement>
  );
}

/** 19 · Шаг 1: голос и расшифровка. */
export function M_StepVoice() {
  const words = [["00:00.4", "Монтаж"], ["00:00.9", "перестал"], ["00:01.3", "быть"], ["00:01.6", "ручной"], ["00:02.1", "работой"]];
  return (
    <Statement kicker="Шаг 1" title="Голос и расшифровка" size="3cqw" lead="Записываете голос на телефон. Агент расшифровывает каждое слово со временем, чтобы субтитры и графика попали точно.">
      <div style={{ ...glass, borderRadius: 24, padding: "1.4cqw 1.6cqw", maxWidth: "46cqw" }}>
        <div className="flex items-center gap-[0.25cqw]" style={{ height: "4cqw" }}>
          {Array.from({ length: 48 }, (_, i) => (
            <motion.div key={i} style={{ width: "0.42cqw", borderRadius: 3, background: i < 30 ? T.gold2 : "rgba(139,94,60,.25)" }}
              animate={{ height: [`${20 + ((i * 37) % 60)}%`, `${35 + ((i * 53) % 65)}%`, `${20 + ((i * 37) % 60)}%`] }}
              transition={{ duration: 1.2 + (i % 5) * 0.15, repeat: Infinity, ease: "easeInOut" }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-[0.5cqw]" style={{ marginTop: "1.2cqw" }}>
          {words.map(([t, w], i) => (
            <motion.div key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.25, duration: 0.3 }}
              style={{ borderRadius: 12, padding: "0.5cqw 0.8cqw", background: "rgba(139,94,60,.08)" }}>
              <div style={{ fontFamily: "var(--font-manrope)", fontSize: "0.7cqw", color: T.muted, fontVariantNumeric: "tabular-nums" }}>{t}</div>
              <div style={{ ...txt, fontWeight: 700 }}>{w}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </Statement>
  );
}

const STYLES = ["prism", "orbit", "trace", "pulse", "glass", "portrait", "apple", "podcast", "expert"];

/** 20 ✦ · Шаг 2: карусель девяти стилей с живыми клипами. Центральный стиль крупно, соседи веером, смена каждые 2 с. */
export function M_Styles() {
  const n = STYLES.length;
  const [a, setA] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setA((v) => (v + 1) % n), 2000);
    return () => clearInterval(id);
  }, [n]);
  const W = 8.2; // ширина карточки, cqw
  return (
    <Statement kicker="Шаг 2 · Формат и стиль" title="6 форматов и 9 стилей" size="2.9cqw" lead="Выбираете по живым примерам, а не по описанию.">
      <div className="relative" style={{ height: "19cqw", width: "50cqw", perspective: "1400px" }}>
        {STYLES.map((s, i) => {
          let d = i - a;
          if (d > n / 2) d -= n;
          if (d < -n / 2) d += n;
          const ad = Math.abs(d);
          return (
            <motion.div key={s} className="absolute top-0" initial={false}
              animate={{ x: `${d * 6.4}cqw`, scale: 1 - ad * 0.13, rotateY: d * -24, opacity: ad > 3 ? 0 : 1 - ad * 0.2 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ left: `calc(50% - ${W / 2}cqw)`, width: `${W}cqw`, height: `${(W * 16) / 9}cqw`, zIndex: 10 - ad }}>
              <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: "1cqw", boxShadow: T.shadow, background: "#000", outline: ad === 0 ? `2px solid ${T.gold2}` : "none", outlineOffset: 3 }}>
                <video src={`/montage/styles/${s}.mp4`} poster={`/montage/styles/${s}.jpg`} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-center" style={{ width: "50cqw", marginTop: "0.8cqw" }}>
        <AnimatePresence mode="wait">
          <motion.div key={a} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}
            style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.1cqw", letterSpacing: ".12em", color: T.accent }}>
            {STYLES[a].toUpperCase()} · {a + 1} из {n}
          </motion.div>
        </AnimatePresence>
      </div>
    </Statement>
  );
}

/** 21 · Шаг 3: агент собирает, правка словами. */
export function M_StepAssemble() {
  return (
    <Statement obj="lg-s21-robot" kicker="Шаг 3" title="Агент собирает. Правку просим словами" size="2.7cqw">
      <div className="grid grid-cols-3 gap-[0.8cqw]" style={{ maxWidth: "52cqw" }}>
        {[["Сцены", "По карте монтажа: что на экране в каждую секунду"], ["Субтитры", "По словам, точно под голос"], ["Звук", "Музыка, эффекты и ровная громкость"]].map(([t, d], i) => (
          <Stagger key={t} i={i}><Card title={t} text={d} style={{ height: "100%" }} /></Stagger>
        ))}
      </div>
      <div className="grid gap-[0.6cqw]" style={{ marginTop: "1.4cqw", maxWidth: "44cqw" }}>
        <Stagger i={3} style={{ justifySelf: "end", maxWidth: "80%", borderRadius: "18px 18px 4px 18px", padding: "0.9cqw 1.2cqw", background: T.ink, ...txt, fontWeight: 500, color: T.paper }}>
          Сделай первую фразу крупнее и убери мелкие подписи
        </Stagger>
        <Stagger i={5} style={{ justifySelf: "start", maxWidth: "80%", borderRadius: "18px 18px 18px 4px", padding: "0.9cqw 1.2cqw", ...glass, ...txt, fontWeight: 500 }}>
          Готово. Собрал новый черновик, проверь кадры
        </Stagger>
      </div>
    </Statement>
  );
}

/** 22 · Готовый ролик. */
export function M_ReadyReel() {
  return (
    <Statement kicker="Результат" title="Готовый ролик" size="3.2cqw" lead="Графика, субтитры и звук собраны агентом по голосу. Сначала черновик на одобрение, потом финал в 4K."
      leftSize="20cqw" left={<Phone video="/montage/reels/podarok.mp4" src="/montage/reels/podarok.jpg" width="14cqw" showTop={false} />}>
      <div className="flex flex-wrap gap-[0.6cqw]">
        {["Premiere не открывал", "CapCut не открывал", "Правки словами"].map((c) => (
          <span key={c} style={{ ...glass, borderRadius: 999, padding: "0.7cqw 1.2cqw", ...txt, fontSize: "0.95cqw" }}>{c}</span>
        ))}
      </div>
    </Statement>
  );
}

const FORMATS = [
  { f: "01-polovina-ekrana", t: "Половина экрана" },
  { f: "02-polovina-okno", t: "Половина и окно в углу" },
  { f: "03-kartochka-spikera", t: "Карточка спикера" },
  { f: "04-spiker-vnizu", t: "Спикер внизу, графика сверху" },
  { f: "05-bez-lica", t: "Без лица, на весь кадр", noFace: true },
  { f: "06-podcast", t: "Подкаст", video: "/montage/styles/podcast.mp4" },
];

/** 23 ✦ · Без лица: телефон перестраивается из формата в формат. */
export function M_NoFace() {
  const [k, setK] = useState(4);
  useEffect(() => {
    const id = setInterval(() => setK((v) => (v + 1) % FORMATS.length), 2600);
    return () => clearInterval(id);
  }, []);
  const cur = FORMATS[k];
  return (
    <Statement obj="lg-s23-noface" kicker="Второй вариант" title="А если не хочу в кадр? Можно так" size="2.7cqw" leftSize="19cqw"
      left={
        <div className="relative" style={{ width: "13.5cqw", aspectRatio: "9/19" }}>
          <AnimatePresence mode="popLayout">
            <motion.div key={cur.f} className="absolute inset-0" initial={{ opacity: 0, scale: 0.92, rotateY: -25 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} exit={{ opacity: 0, scale: 1.04, rotateY: 20 }} transition={{ duration: 0.55, ease: EASE }}>
              <Phone video={cur.video ?? `/montage/formats/${cur.f}.mp4`} src={`/montage/formats/${cur.f}.jpg`} width="13.5cqw" chrome={false} />
            </motion.div>
          </AnimatePresence>
        </div>
      }>
      <div className="grid gap-[0.5cqw]" style={{ maxWidth: "34cqw" }}>
        {FORMATS.map((f, i) => (
          <div key={f.f} className="flex items-center gap-[0.9cqw]" style={{ borderRadius: 16, padding: "0.65cqw 1cqw", transition: "background .3s, border-color .3s",
            background: i === k ? "rgba(255,255,255,.8)" : "transparent", border: `1px solid ${i === k ? T.gold2 : "transparent"}` }}>
            <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.85cqw", color: i === k ? T.gold2 : T.muted }}>{i + 1}</span>
            <span style={{ ...txt, color: i === k ? T.ink : T.muted }}>{f.t}</span>
            {f.noFace && <span style={{ marginLeft: "auto", borderRadius: 999, padding: "0.25cqw 0.7cqw", background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`, ...txt, fontSize: "0.75cqw", fontWeight: 700 }}>без лица</span>}
          </div>
        ))}
      </div>
      <Note>Голос, графика и персонаж-рассказчик. Кадры моих настоящих роликов, шестой формат показан на демо стиля</Note>
    </Statement>
  );
}
