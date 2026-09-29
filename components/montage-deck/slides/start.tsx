"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { useCountUp } from "@/components/sales-deck/useCountUp";
import { MontageBg } from "../MontageBg";
import { Phone } from "../Phone";
import { Statement } from "../Statement";
import { T, card, glass, goldButton } from "../theme";
import { Arrow, EASE, Em, H, Kicker, Lead, Note, Num, Px, RISE_DUR, Rise, STEP, at, nb, thousands } from "../ui";

const label: React.CSSProperties = { fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "1.05cqw", lineHeight: 1.35, color: T.ink };
const inUp = (i: number, base = 0.28) => ({ initial: { opacity: 0, y: "1cqw" }, animate: { opacity: 1, y: "0cqw" }, transition: { delay: at(i, base), duration: RISE_DUR, ease: EASE } });

/** 2 · Проверка связи: десять клавиш оценки, «10» — золотая кнопка. */
export function M_Check() {
  return (
    <Statement obj="lg-s02-creator" kicker="Перед стартом" title="Как меня видно и слышно?" lead="Оцените от 1 до 10 в чат." size="3.2cqw">
      <div className="flex gap-[0.6cqw]">
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.25 + i * 0.035, duration: 0.35, ease: EASE }}
            className="flex items-center justify-center"
            style={{ ...card, borderRadius: 16, width: "4.2cqw", height: "4.2cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.5cqw",
              color: i === 9 ? T.ink : T.brown, ...(i === 9 ? { ...goldButton, border: "none" } : null) }}>
            {i + 1}
          </motion.div>
        ))}
      </div>
    </Statement>
  );
}

/** 3–4 · Опрос: варианты — большие карточки, крупная цифра Unbounded = ответ в чат. */
export function M_Poll({ kicker, title, lead, options, icons }: { kicker: string; title: string; lead: string; options: string[]; icons?: string[] }) {
  return (
    <Statement kicker={kicker} title={title} lead={lead} size="2.7cqw">
      <div className="grid grid-cols-2 gap-[1cqw]" style={{ maxWidth: "54cqw" }}>
        {options.map((o, i) => (
          <motion.div key={o} {...inUp(i)} className="flex items-center gap-[1.2cqw]" style={{ ...card, minHeight: "8.6cqw", padding: "1.2cqw 1.6cqw" }}>
            <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "4.6cqw", lineHeight: 1, color: T.brown, fontVariantNumeric: "tabular-nums", minWidth: "3.4cqw" }}>{i + 1}</span>
            {icons && <Px name={icons[i]} size="4.4cqw" bob={false} delay={0.3 + i * STEP} />}
            <span style={{ ...label, fontWeight: 700, fontSize: "1.3cqw" }}>{o}</span>
          </motion.div>
        ))}
      </div>
    </Statement>
  );
}

/** 5 · Программа эфира: три высокие карточки уроков в ряд, пункт «в конце» держит до конца. */
export function M_Program() {
  const lessons = [
    ["Урок 1", "Монтирую рилс вживую, без знаний монтажа", "lg-i-clapper"],
    ["Урок 2", "Реклама товара из фотографий, без съёмки", "lg-i-box"],
    ["Урок 3", "Как просмотр сам становится заявкой", "lg-i-chatkey"],
  ];
  return (
    <Statement kicker="Программа эфира" title="Три урока за вечер" size="3.2cqw">
      <div className="grid grid-cols-3 gap-[1cqw]" style={{ maxWidth: "54cqw" }}>
        {lessons.map(([no, t, ic], i) => (
          <motion.div key={no} {...inUp(i)} className="flex flex-col" style={{ ...card, minHeight: "20cqw", padding: "1.4cqw 1.5cqw" }}>
            <Px name={ic} size="6.4cqw" bob={false} delay={0.3 + i * STEP} style={{ marginLeft: "-0.4cqw" }} />
            <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.9cqw", color: T.brown, marginTop: "1.6cqw" }}>{no}</span>
            <span style={{ ...label, fontWeight: 700, fontSize: "1.25cqw", marginTop: "0.6cqw" }}>{t}</span>
          </motion.div>
        ))}
      </div>
      <motion.div {...inUp(3)} className="flex items-center gap-[1.2cqw]"
        style={{ maxWidth: "54cqw", marginTop: "1cqw", borderRadius: 20, padding: "0.8cqw 1.4cqw", border: `1.5px dashed ${T.gold2}`, background: `${T.gold}1F` }}>
        <Px name="lg-i-calendar" size="3.2cqw" bob={false} delay={0.5} />
        <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.95cqw", color: T.gold2, whiteSpace: "nowrap" }}>В конце</span>
        <span style={{ ...label, fontWeight: 700, fontSize: "1.2cqw" }}>Схема на 30 роликов в месяц</span>
      </motion.div>
    </Statement>
  );
}

/** 6 · Большое обещание: ролик → реклама → заявка, связки прорисовываются по очереди. */
export function M_Promise() {
  const chain = ["Ролик", "Реклама", "Заявка"];
  const icons = ["lg-i-cards", "lg-i-box", "lg-i-chatkey"];
  return (
    <Statement kicker="Что увидите сегодня" title={<>Покажу контент-завод целиком: ролик, реклама и <Em>заявка</Em></>} lead="Без монтажёра, без съёмки, без знаний кода." size="2.8cqw">
      <div className="flex items-end gap-[1.2cqw]">
        {chain.map((c, i) => (
          <div key={c} className="flex items-center gap-[1.2cqw]">
            <div className="flex flex-col items-center gap-[0.6cqw]">
              <Px name={icons[i]} size="7.4cqw" delay={0.3 + i * 0.12} />
              <motion.div {...inUp(i * 2)}
                style={{ ...(i === 2 ? goldButton : card), borderRadius: 999, padding: "0.9cqw 1.8cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.25cqw", color: i === 2 ? T.ink : T.brown }}>
                {c}
              </motion.div>
            </div>
            {i < chain.length - 1 && (
              <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: at(i * 2 + 1, 0.28), duration: 0.35, ease: EASE }}
                style={{ transformOrigin: "left", paddingBottom: "1.4cqw" }}><Arrow size="1.8cqw" /></motion.div>
            )}
          </div>
        ))}
      </div>
    </Statement>
  );
}

/** Обложка гайда: книжка с кикером, лего-значком и названием. */
function GuideCover({ no, title, text, icon, gold }: { no: number; title: string; text: string; icon: string; gold?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col" style={{
      borderRadius: "1.2cqw", padding: "1.4cqw 1.3cqw", overflow: "hidden",
      background: gold ? `linear-gradient(160deg, ${T.card}, ${T.gold}66)` : `linear-gradient(160deg, ${T.paper}, ${T.card})`,
      border: `1.5px solid ${gold ? T.gold2 : T.line}`, boxShadow: `0 2.4cqw 4cqw -2cqw rgba(42,33,28,.42)`,
    }}>
      <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.72cqw", letterSpacing: ".16em", textTransform: "uppercase", color: gold ? T.brown : T.accent }}>Гайд {no}</div>
      <Px name={icon} size="5.6cqw" bob={false} delay={0.5} style={{ margin: "1cqw 0 0 -0.3cqw" }} />
      <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.2cqw", lineHeight: 1.2, color: T.brown, marginTop: "auto" }}>{title}</div>
      <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 500, fontSize: "0.82cqw", lineHeight: 1.4, color: T.muted, marginTop: "0.6cqw" }}>{text}</div>
      <div style={{ height: "0.3cqw", borderRadius: 2, marginTop: "1cqw", width: "40%", background: gold ? T.gold2 : T.line }} />
    </div>
  );
}

/** 7 и 58 · Три гайда за досмотр: обложки раскрываются веером в 3D из одной стопки. */
export function M_Guides({ kicker, title, lead }: { kicker: string; title: string; lead: string }) {
  const guides = [
    ["Как делать вирусный рилс", "Правило первых 3 секунд и пробные рилсы", "lg-i-rocket"],
    ["Контент-план на месяц", "И схема выкладки: что и когда публиковать", "lg-i-calfilm"],
    ["30 хуков под вашу нишу", "Первые фразы, с которых ролик не пролистывают", "lg-i-hook"],
  ];
  const fan = [{ x: -12, r: -11, ry: 16, y: 1.2 }, { x: 0, r: 0, ry: 0, y: -0.6 }, { x: 12, r: 11, ry: -16, y: 1.2 }];
  return (
    <Statement kicker={kicker} title={title} lead={lead} size="2.8cqw">
      <div className="relative" style={{ width: "44cqw", height: "22cqw", perspective: "1600px", marginTop: "0.6cqw" }}>
        {guides.map(([t, d, ic], i) => (
          <motion.div key={t} className="absolute top-0" style={{ left: "50%", marginLeft: "-7.5cqw", width: "15cqw", height: "20cqw", zIndex: i === 1 ? 3 : 1, transformOrigin: "50% 100%" }}
            initial={{ opacity: 0, x: "0cqw", y: "3cqw", rotate: 0, rotateY: 0 }}
            animate={{ opacity: 1, x: `${fan[i].x}cqw`, y: `${fan[i].y}cqw`, rotate: fan[i].r, rotateY: fan[i].ry }}
            transition={{ delay: 0.3 + (i === 1 ? 0 : 0.08), duration: 0.6, ease: EASE }}>
            <GuideCover no={i + 1} title={t} text={d} icon={ic} gold={i === 1} />
          </motion.div>
        ))}
      </div>
    </Statement>
  );
}

/** 8 · Кто я. */
export function M_About() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="soft" />} objectColumnSize="22cqw" objectOverflow="visible"
      leftObject={
        <motion.div className="relative w-full h-full" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
          <div className="absolute inset-x-[8%] bottom-[8%] top-[22%]" style={{ borderRadius: 999, background: `radial-gradient(closest-side, rgba(227,192,123,.55), transparent)` }} />
          <img src="/montage/alex.webp" alt="Александр" className="absolute bottom-0 left-[44%] h-[84%] w-auto max-w-none" style={{ translate: "-50% 0" }} />
        </motion.div>
      }>
      <Rise><Kicker>Кто ведёт</Kicker></Rise>
      <Rise delay={0.08}><H size="3.2cqw">Александр</H></Rise>
      <Rise delay={0.14}><Lead style={{ marginTop: "0.8cqw" }}>Основатель onAI Academy. Собираю платформы обучения и сервисы для бизнеса с ИИ-агентами, без штатных программистов.</Lead></Rise>
      <Rise delay={0.25} style={{ ...glass, borderRadius: 22, padding: "0.9cqw", marginTop: "1.8cqw", maxWidth: "34cqw" }}>
        <img src="/montage/profile.jpg" alt="Профиль saint4ai в Instagram: 15,6 тыс. подписчиков" style={{ width: "100%", height: "auto", borderRadius: 14, display: "block" }} />
      </Rise>
      <Rise delay={0.35} className="flex items-center gap-[1cqw]" style={{ marginTop: "1.2cqw" }}>
        <Num size="2.2cqw" color={T.accent}>1000+</Num>
        <span style={{ ...label, fontSize: "0.95cqw", color: T.muted, fontWeight: 500, maxWidth: "20cqw" }}>выпускников за два года по внедрению ИИ в бизнес</span>
      </Rise>
      <Note style={{ marginTop: "0.8cqw" }}>Профиль Instagram на 26 сентября 2026</Note>
    </SlideLayout>
  );
}

/** 9 ✦ · Было 300 000 ₸, стало около 50 000 ₸: старая цена зачёркивается. */
export function M_CostStory() {
  const after = useCountUp(50000, 1.1, 1.5);
  const sub: React.CSSProperties = { fontFamily: "var(--font-manrope)", fontSize: "1cqw", lineHeight: 1.4, color: "rgba(251,243,228,.7)", marginTop: "0.9cqw" };
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="ink" />}>
      <Px name="lg-s09-coins" size="10cqw" style={{ marginBottom: "0.6cqw", marginLeft: "-0.6cqw" }} />
      <Rise><Kicker color={T.gold}>Моя история</Kicker></Rise>
      <Rise delay={0.08}><H size="2.6cqw" color={T.paper}>Сколько мне стоит монтаж 30 роликов в месяц</H></Rise>
      <div className="flex items-end gap-[2.4cqw]" style={{ marginTop: "3cqw" }}>
        <Rise delay={0.2}>
          <div style={{ ...sub, marginTop: 0, fontWeight: 700, color: "rgba(251,243,228,.85)" }}>Было: монтажёр</div>
          <div className="relative inline-block" style={{ marginTop: "0.8cqw" }}>
            <Num size="3.6cqw" color="rgba(251,243,228,.55)">{nb("300 000 ₸")}</Num>
            <motion.div className="absolute left-[-3%] right-[-3%] top-1/2" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.45, ease: EASE }}
              style={{ height: "0.32cqw", marginTop: "-0.16cqw", background: T.gold2, borderRadius: 4, transformOrigin: "left", rotate: "-4deg" }} />
          </div>
          <div style={sub}>30 роликов по {nb("10 000 ₸")}</div>
        </Rise>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.35, duration: 0.4 }} style={{ paddingBottom: "3.2cqw" }}><Arrow color={T.gold} /></motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.5, ease: EASE }}>
          <div style={{ ...sub, marginTop: 0, fontWeight: 700, color: T.gold }}>Стало: агент на Claude</div>
          <div style={{ marginTop: "0.8cqw" }}><Num size="3.6cqw" color={T.gold}>{`≈\u00A0${thousands(after)}\u00A0₸`}</Num></div>
          <div style={sub}>около {nb("50 000 ₸")} за те же 30 роликов</div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

/** 10 · 15 рилсов, 140 689 просмотров: превью смонтированных агентом роликов без отдельных цифр. */
export function M_Proof15() {
  const reels = ["mcp", "zashita", "google10", "papka"];
  return (
    <Statement kicker="Статистика Instagram" title={<>15 рилсов: {nb("140 689")} просмотров</>} lead="Все смонтированы с ИИ-агентом. Всё, что покажу сегодня, работает у меня прямо сейчас." size="2.8cqw">
      <div className="flex gap-[1cqw]">
        {reels.map((r, i) => (
          <motion.div key={r} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.1, duration: 0.55, ease: EASE }}>
            <Phone video={`/montage/reels/${r}.mp4`} src={`/montage/reels/${r}.jpg`} width="8.6cqw" chrome={false} />
          </motion.div>
        ))}
      </div>
      <Note>Данные на 19 сентября 2026</Note>
    </Statement>
  );
}
