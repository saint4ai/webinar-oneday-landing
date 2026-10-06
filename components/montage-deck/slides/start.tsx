"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { useCountUp } from "@/components/sales-deck/useCountUp";
import { CostDrop3D } from "../fx";
import { MontageBg } from "../MontageBg";
import { ReelRail } from "../ReelRail";
import { RESULTS } from "../results";
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
    ["Практика 1", "Монтирую рилс вживую, без знаний монтажа", "lg-i-clapper"],
    ["Практика 2", "Презентация по брифу из чата", "lg-i-cards"],
    ["Практика 3", "Приложение и сайт из одного описания", "lg-i-phones"],
  ];
  return (
    <Statement kicker="Программа эфира" title="Три практики за вечер" size="3.2cqw">
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
        <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.95cqw", color: T.gold2, whiteSpace: "nowrap" }}>После практики 1</span>
        <span style={{ ...label, fontWeight: 700, fontSize: "1.2cqw" }}>Схема на 30 роликов в месяц</span>
      </motion.div>
    </Statement>
  );
}

/** 6 · Большое обещание: ролик → реклама → заявка, связки прорисовываются по очереди. */
export function M_Promise() {
  const chain = ["Ролик", "Презентация", "Приложение"];
  const icons = ["lg-i-clapper", "lg-i-cards", "lg-i-phones"];
  return (
    <Statement kicker="Что увидите сегодня" title={<>Покажу, как ИИ забирает монтаж, документы и <Em>разработку</Em></>} lead="Без монтажёра, без дизайнера презентаций, без программиста." size="2.8cqw">
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

/** 8 · Кто я: фото на свету, рядом скрин профиля Instagram со скруглёнными углами. alex-cacao.webp — alex.webp, где салатовый логотип на футболке перекрашен в золото бренда. */
export function M_About() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="soft" />} objectColumnSize="25cqw" objectOverflow="visible" contentMinWidth={0}
      leftObject={
        <motion.div className="relative w-full h-full" initial={{ opacity: 0, y: "2cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ duration: 0.6, ease: EASE }}>
          {/* Свет: белый блик сверху и золотое пятно за спиной, без жёстких краёв */}
          <div className="absolute" style={{ left: "-30%", right: "-30%", top: "-6%", height: "70%", background: `radial-gradient(closest-side, ${T.paper}, ${T.paper}00)` }} />
          <div className="absolute" style={{ left: "-10%", right: "-10%", top: "16%", bottom: "-4%", background: `radial-gradient(closest-side, ${T.gold}B3, ${T.gold}33 60%, ${T.gold}00)` }} />
          <img src="/montage/alex-cacao.webp" alt="Александр" className="absolute bottom-0 left-[52%] h-[72%] w-auto max-w-none" style={{ translate: "-50% 0", filter: "drop-shadow(0 2cqw 3cqw rgba(42,33,28,.25))" }} />
        </motion.div>
      }>
      <Rise><Kicker>Кто ведёт</Kicker></Rise>
      <Rise delay={STEP}><H size="3.4cqw">Александр</H></Rise>
      {/* Позиционирование — слова Александра 05.10: «разработчик без знаний программирования, разрабатываю IT-решения для бизнеса» */}
      <Rise delay={STEP * 2}><Lead style={{ marginTop: "0.8cqw", maxWidth: "29cqw" }}>Разработчик без знаний программирования: собираю IT-решения для бизнеса с <span style={{ whiteSpace: "nowrap" }}>ИИ-агентами</span>. Основатель onAI Academy.</Lead></Rise>
      {/* Скрин профиля Instagram без рамки телефона, со скруглёнными углами (правка Александра 05.10).
          06.10: крупнее, до линии-разделителя зоны камеры — съедаем правый отступ колонки SlideLayout (56px) */}
      <motion.div initial={{ opacity: 0, y: "1.6cqw", scale: 0.97 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }} transition={{ delay: at(3, 0.2), duration: 0.55, ease: EASE }}
        style={{ marginTop: "1.6cqw", width: "calc(100% + 56px - 0.8cqw)", maxWidth: "none" }}>
        <img src="/montage/profile.jpg" alt="Профиль saint4ai в Instagram" draggable={false}
          style={{ display: "block", width: "100%", height: "auto", borderRadius: "1.2cqw", border: `1px solid ${T.line}`, boxShadow: T.shadow, background: T.paper }} />
      </motion.div>
      <Rise delay={at(4, 0.2)} className="flex items-center" style={{ gap: "1.1cqw", marginTop: "1.4cqw", maxWidth: "29cqw" }}>
        <Num size="3cqw" color={T.brown}>1000+</Num>
        <div style={{ ...label, fontSize: "1cqw", color: T.muted, fontWeight: 500 }}>выпускников за два года по внедрению ИИ в бизнес</div>
      </Rise>
      <Note style={{ marginTop: "0.9cqw" }}>Профиль Instagram на 26 сентября 2026</Note>
    </SlideLayout>
  );
}

/** 9 ✦ · Моя история: стопка плит «1 500 000 ₸ у монтажёра» рушится до «$200 за Claude Max». */
export function M_CostStory() {
  return (
    <Statement kicker="Моя история" title={<>Сколько мне стоит <Em>монтаж в месяц</Em></>} size="2.7cqw">
      <div style={{ marginTop: "0.4cqw" }}>
        <CostDrop3D from={{ value: nb("1 500 000 ₸"), label: "Было бы: монтажёр · 150 роликов по 10 000 ₸, мой темп 5 роликов в день" }}
          to={{ value: "$200", label: "Стало: подписка Claude Max · 150 роликов в месяц" }} />
      </div>
    </Statement>
  );
}

/**
 * 10 · 30 дней: 927 тыс. просмотров на трёх площадках, по 5 рилсов в день. Под цифрами бесконечная лента обложек рилсов
 * со счётчиком просмотров из приложения Instagram (RESULTS.appCovers, раздатки 05.10, папка 04).
 * 927 тыс. — сумма трёх площадок со скринов 6 октября (RESULTS.totalViews, разбивка на слайде 10g), не число людей.
 */
export function M_Proof15() {
  const perDay = useCountUp(5, 0.9, 0.3);
  const views = useCountUp(RESULTS.totalViewsNum, 1.3, 0.35);
  return (
    <Statement kicker="Моя статистика" title={<>30 дней: {nb(RESULTS.totalViews)} просмотров</>} lead="Рилсы собирает ИИ-агент — каждый сразу выходит в Instagram, TikTok и YouTube." size="2.8cqw">
      <div className="flex items-stretch gap-[1cqw]">
        {[[String(perDay), "рилсов в день — сейчас"], [nb(`${views} тыс.`), "просмотров в Instagram, TikTok и YouTube"]].map(([v, l], i) => (
          <motion.div key={l} {...inUp(i, 0.22)} style={{ ...card, padding: "1cqw 1.6cqw" }}>
            <Num size="3.4cqw" color={T.brown}>{v}</Num>
            <div style={{ ...label, color: T.muted, marginTop: "0.4cqw" }}>{l}</div>
          </motion.div>
        ))}
      </div>
      <motion.div {...inUp(2, 0.22)} style={{ marginTop: "1.2cqw", maxWidth: "54cqw" }}>
        <ReelRail items={[...RESULTS.appCovers]} itemWidth="8.4cqw" speed={0.3} render={(r) => (
          <div>
            <img src={`/montage/reels/${r.file}.jpg`} alt={`${r.title}: ${r.views} просмотров`} draggable={false}
              style={{ display: "block", width: "100%", aspectRatio: "9 / 16", objectFit: "cover", borderRadius: "1cqw", border: `1px solid ${T.line}`, boxShadow: T.shadowSm }} />
            {/* цифра с обложки крупно: на самой обложке счётчик слишком мелкий для эфира */}
            <div style={{ marginTop: "0.5cqw" }}>
              <Num size="1.35cqw" color={T.brown}>{r.views.replace(/\s*тыс\.$/, "")}</Num>
              <div style={{ ...label, fontSize: "0.72cqw", color: T.muted, whiteSpace: "nowrap" }}>тыс. просмотров</div>
            </div>
          </div>
        )} />
      </motion.div>
      <Note style={{ marginTop: "0.9cqw" }}>{RESULTS.appCoversSource}. {RESULTS.totalViews}: просмотры Instagram, TikTok и YouTube сложены по скринам 6 октября, это не число людей.</Note>
    </Statement>
  );
}
