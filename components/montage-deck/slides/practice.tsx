"use client";

import { motion } from "framer-motion";
import { ScreenStage3D } from "../fx";
import { Statement } from "../Statement";
import { T, card, goldButton } from "../theme";
import { Arrow, Card, EASE, Em, Fill, MaskIcon, Note, Px, Stagger, txt } from "../ui";

/**
 * Практики 2 и 3 эфира 6 октября (режиссура 04.10: монтаж → презентации → сайты и приложения).
 * Практика 3 перенесена из прошлого воркшопа по вайбкодингу (Deck60, слайды 71–79) в бренд сайтов.
 * Всё в левых 60% кадра. Чего нет в фактах — [в скобках] через <Fill>, дописывает Александр.
 */

const inUp = (i: number, base = 0.3) => ({
  initial: { opacity: 0, y: "1.6cqw" }, animate: { opacity: 1, y: "0cqw" },
  transition: { delay: base + i * 0.09, duration: 0.45, ease: EASE },
});

/** Цепочка карточек слева направо со стрелками между ними; последняя — золотая рамка. */
function Flow({ items }: { items: { icon: string; title: string; text: string }[] }) {
  return (
    <div className="flex items-stretch gap-[0.7cqw]" style={{ maxWidth: "55cqw" }}>
      {items.map((s, i) => (
        <div key={s.title} className="flex items-center gap-[0.7cqw]" style={{ flex: 1 }}>
          <motion.div {...inUp(i * 2)} style={{ flex: 1, height: "100%" }}>
            <Card icon={s.icon} no={`0${i + 1}`} title={s.title} text={s.text} accent={i === items.length - 1} style={{ height: "100%" }} />
          </motion.div>
          {i < items.length - 1 && (
            <motion.div initial={{ opacity: 0, x: "-0.6cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: 0.3 + (i * 2 + 1) * 0.09, duration: 0.35, ease: EASE }}>
              <Arrow size="1.6cqw" />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Практика 2 · презентация по брифу ───────────────────────── */

/** P2 · Как устроено: бриф → шаблон и правила → готовый файл. */
export function M_DocsHow() {
  return (
    <Statement kicker="Практика 2 · как устроено" title={<>Бриф словами — на выходе <Em>готовый файл</Em></>} size="2.8cqw"
      lead="Агент работает в папке проекта: там ваши образцы, логотип и стиль.">
      <Flow items={[
        { icon: "lg-i-chatkey", title: "Бриф", text: "Голосом или текстом: кто клиент, что продаём, сроки и цена" },
        { icon: "lg-i-cards", title: "Шаблон и правила", text: "Образцы презентаций, бренд, тон — один раз в папке проекта" },
        { icon: "lg-i-laptopfilm", title: "Готовый файл", text: "Презентация в PDF" },
      ]} />
      <Note style={{ marginTop: "1.2cqw", maxWidth: "50cqw" }}>Агент готовит черновик — финальную правку делаете вы.</Note>
    </Statement>
  );
}

/** P2 · Пример документа, который собрал агент: скрин на плите, рядом — что было на входе и на выходе. */
export function M_DocsExample({ shot }: { shot?: string }) {
  const rows: [string, React.ReactNode][] = [
    ["На входе", <Fill key="in">бриф: что было сказано агенту</Fill>],
    ["На выходе", <Fill key="out">презентация, сколько слайдов</Fill>],
    ["Время", <Fill key="t">сколько минут вместо часов</Fill>],
  ];
  return (
    <Statement kicker="Практика 2 · пример" title={<>Документ, который <Em>собрал агент</Em></>} size="2.8cqw">
      <div className="grid items-center gap-[2.2cqw]" style={{ gridTemplateColumns: "20cqw minmax(0, 1fr)", maxWidth: "54cqw" }}>
        <div style={{ height: "25cqw" }}>
          <ScreenStage3D src={shot} alt="Документ, который собрал агент" empty="Сюда скрин презентации: results/doc-example.png" />
        </div>
        <div className="grid gap-[0.8cqw]">
          {rows.map(([k, v], i) => (
            <motion.div key={k} {...inUp(i + 2)} style={{ ...card, borderRadius: 18, padding: "0.9cqw 1.2cqw" }}>
              <div style={{ ...txt, fontSize: "0.8cqw", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.accent }}>{k}</div>
              <div style={{ ...txt, fontSize: "1.1cqw", fontWeight: 700, marginTop: "0.25cqw" }}>{v}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </Statement>
  );
}

/** P2 · Вживую: перед переключением на чат — что именно соберём. */
export function M_DocsLive() {
  const items = ["Коммерческое предложение", "Презентация продукта"];
  return (
    <Statement obj="lg-i-cards" objSize="7cqw" kicker="Практика 2 · вживую" title={<>Сейчас соберу <Em>по брифу из чата</Em></>} size="3cqw"
      lead="В своём настроенном чате. Повторяйте за мной.">
      <div className="flex flex-wrap gap-[0.7cqw]" style={{ maxWidth: "50cqw" }}>
        {items.map((t, i) => (
          <motion.div key={t} {...inUp(i)} style={{ ...(i === items.length - 1 ? goldButton : card), borderRadius: 999, padding: "0.9cqw 1.6cqw",
            fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.15cqw", color: i === items.length - 1 ? T.ink : T.brown }}>{t}</motion.div>
        ))}
      </div>
    </Statement>
  );
}

/* ───────────────────────── Практика 3 · сайты и приложения (из прошлого воркшопа) ───────────────────────── */

/** P3 · Один продукт вживую: приложение и сайт к нему (было «Три продукта прямо в эфире», Deck60). */
export function M_AppsBuilds() {
  const b = [
    { icon: "lg-i-phones", title: "Приложение Bloom", sub: "Семейный трекер привычек", text: "Вся семья и дети, награды и серии — по детальному ТЗ", tool: "google", toolName: "Google AI Studio" },
    { icon: "lg-i-laptopfilm", title: "Сайт под Bloom", sub: "Лендинг с анимациями", text: "Промо-страница приложения в том же бренде", tool: "claude", toolName: "Claude Code" },
  ];
  return (
    <Statement kicker="Практика 3 · что соберём" title={<>Один продукт вживую: <Em>приложение и сайт</Em></>} size="2.8cqw"
      lead="Целый запуск: приложение и промо-страница к нему.">
      <div className="grid grid-cols-2 gap-[1cqw]" style={{ maxWidth: "46cqw" }}>
        {b.map((x, i) => (
          <motion.div key={x.title} initial={{ opacity: 0, y: "2cqw", rotate: i ? 3 : -3 }} animate={{ opacity: 1, y: "0cqw", rotate: 0 }}
            transition={{ delay: 0.4 + i * 0.12, type: "spring", stiffness: 170, damping: 15 }}
            style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", ...(i === 0 ? { border: `1.5px solid ${T.gold2}` } : null) }}>
            <Px name={x.icon} size="5cqw" bob={false} style={{ margin: "-0.4cqw 0 0.4cqw -0.4cqw" }} />
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.35cqw" }}>{x.title}</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "0.95cqw", color: T.accent, marginTop: "0.2cqw" }}>{x.sub}</div>
            <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.5cqw" }}>{x.text}</div>
            <div className="flex items-center gap-[0.5cqw]" style={{ marginTop: "1cqw", ...txt, fontWeight: 700, fontSize: "0.9cqw", color: T.brown }}>
              <MaskIcon name={x.tool} color={T.brown} size="1.2cqw" />{x.toolName}
            </div>
          </motion.div>
        ))}
      </div>
    </Statement>
  );
}

/** P3 · Google AI Studio: бесплатно, в браузере, без установки. Справа от карточек — окно браузера. */
export function M_AIStudio() {
  const pros = [["Бесплатно", "инструмент от Google"], ["В браузере", "ничего не качать"], ["Без установки", "открыл и работаешь"]];
  return (
    <Statement kicker="Практика 3 · инструмент" title={<>Google AI Studio: <Em>приложение из описания</Em></>} size="2.7cqw">
      <div className="grid items-center gap-[1.6cqw]" style={{ gridTemplateColumns: "15cqw minmax(0, 1fr)", maxWidth: "54cqw" }}>
        <div className="grid gap-[0.7cqw]">
          {pros.map(([t, d], i) => (
            <Stagger key={t} i={i} style={{ ...card, borderRadius: 18, padding: "0.9cqw 1.2cqw" }}>
              <div style={{ ...txt, fontWeight: 700, fontSize: "1.15cqw" }}>{t}</div>
              <div style={{ ...txt, fontWeight: 500, fontSize: "0.9cqw", color: T.muted }}>{d}</div>
            </Stagger>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: "2cqw", rotateX: 12 }} animate={{ opacity: 1, y: "0cqw", rotateX: 0 }} transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
          style={{ ...card, borderRadius: 18, overflow: "hidden", boxShadow: T.shadowSm, transformPerspective: 900 }}>
          <div className="flex items-center gap-[0.4cqw]" style={{ padding: "0.6cqw 0.9cqw", background: T.night2 }}>
            {[T.gold, T.brownLt, T.nightMuted].map((c) => <span key={c} style={{ width: "0.6cqw", height: "0.6cqw", borderRadius: 99, background: c }} />)}
            <span style={{ marginLeft: "0.8cqw", padding: "0.2cqw 0.8cqw", borderRadius: 99, background: T.night, ...txt, fontSize: "0.75cqw", color: T.nightMuted }}>aistudio.google.com</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-[0.8cqw]" style={{ height: "17cqw", background: T.soft }}>
            <MaskIcon name="google" color={T.brown} size="3cqw" />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.4cqw", color: T.brown }}>AI Studio</div>
            <div style={{ ...txt, fontSize: "0.9cqw", color: T.muted }}>Опишите приложение — оно соберётся</div>
          </div>
        </motion.div>
      </div>
    </Statement>
  );
}

/** P3 · Одно детальное ТЗ: шесть требований к семейному трекеру. */
export function M_AppBrief() {
  const f = [
    ["Вся семья", "родители и дети, роли и доступы, вход по коду"],
    ["Привычки и цели", "свои привычки у каждого и общие цели семьи"],
    ["Игра", "серии, очки, награды от родителей — без давления"],
    ["Дизайн", "светлая и тёмная тема, тёплая палитра"],
    ["Напоминания", "по времени, ненавязчиво"],
    ["Безопасно детям", "детский режим проще, контроль у родителя"],
  ];
  return (
    <Statement kicker="Практика 3 · ТЗ" title={<>Отдаём ИИ <Em>одно детальное ТЗ</Em></>} size="2.8cqw"
      lead="Не «сделай трекер», а точное задание. Чем подробнее ТЗ, тем лучше приложение.">
      <div className="grid grid-cols-3 gap-[0.7cqw]" style={{ maxWidth: "54cqw" }}>
        {f.map(([t, d], i) => (
          <Stagger key={t} i={i} style={{ ...card, borderRadius: 18, padding: "0.9cqw 1.1cqw" }}>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.1cqw" }}>{t}</div>
            <div style={{ ...txt, fontWeight: 500, fontSize: "0.88cqw", color: T.muted, marginTop: "0.2cqw" }}>{d}</div>
          </Stagger>
        ))}
      </div>
      <Note style={{ marginTop: "1cqw" }}>ТЗ собрал агент со скиллом ui-ux-pro-max, дальше копируем его в Google AI Studio</Note>
    </Statement>
  );
}

/** P3 · Приступаем: перед переключением на AI Studio. */
export function M_AppStart() {
  return (
    <Statement obj="lg-i-rocket" objSize="8cqw" kicker="Практика 3 · вживую" title={<>Приступаем: <Em>рабочее приложение</Em> с нуля</>} size="3.2cqw"
      lead="Собираю на ваших глазах. Повторяйте за мной." />
  );
}

/** P3 · Что делать с приложением дальше: три пути. */
export function M_AppNext() {
  return (
    <Statement kicker="Практика 3 · дальше" title={<>Что делать <Em>с приложением</Em></>} size="3cqw">
      <div className="grid grid-cols-3 gap-[0.9cqw]" style={{ maxWidth: "54cqw" }}>
        {[["Пользоваться самому", "экономить время или решать свою задачу"], ["Выложить в Google Play", "пользователи и подписки — доход сверху"], ["Продавать как сервис", "компаниям под их задачи"]].map(([t, d], i) => (
          <motion.div key={t} {...inUp(i)} style={{ height: "100%" }}><Card no={`0${i + 1}`} title={t} text={d} accent={i === 2} style={{ height: "100%" }} /></motion.div>
        ))}
      </div>
    </Statement>
  );
}

/** P3 · Сколько это стоит на рынке: две полосы растут, студийная — длиннее. Цифры — из прошлого воркшопа, в [скобках] до актуальных от Александра; frac полос подогнать под новые цифры. */
export function M_MarketPrice() {
  const bars = [
    { label: "Вы собрали сами", value: "300–800 тыс ₸", sub: "за заказ", frac: 0.45, color: T.gold },
    { label: "Студия", value: "от 1,5 млн ₸", sub: "за то же самое", frac: 1, color: T.brown },
  ];
  return (
    <Statement kicker="Практика 3 · деньги" title={<>Сколько такое <Em>стоит на рынке</Em></>} size="3cqw"
      lead={<>Вы делаете то же самое <Fill>в 2–3 раза</Fill> дешевле студии и <Fill>за дни, а не месяцы</Fill>.</>}>
      <div className="grid gap-[1.2cqw]" style={{ maxWidth: "50cqw" }}>
        {bars.map((b, i) => (
          <div key={b.label}>
            <div className="flex items-baseline justify-between" style={{ ...txt, fontWeight: 700, fontSize: "1.05cqw" }}>
              <span>{b.label}</span>
              <span style={{ fontFamily: "var(--font-unbounded)", fontSize: "1.5cqw", color: i ? T.brown : T.gold2 }}><Fill>{b.value}</Fill> <span style={{ ...txt, fontSize: "0.85cqw", color: T.muted }}>{b.sub}</span></span>
            </div>
            <div style={{ marginTop: "0.5cqw", height: "1.6cqw", borderRadius: 99, background: `${T.brown}14`, overflow: "hidden" }}>
              <motion.div initial={{ width: "0%" }} animate={{ width: `${b.frac * 100}%` }} transition={{ delay: 0.5 + i * 0.25, duration: 0.9, ease: EASE }}
                style={{ height: "100%", borderRadius: 99, background: i ? `linear-gradient(90deg, ${T.brownLt}, ${T.brown})` : `linear-gradient(90deg, ${T.gold}, ${T.gold2})` }} />
            </div>
          </div>
        ))}
      </div>
    </Statement>
  );
}

/** P3 · Если нужен сайт или сервис: Claude Code, Cursor, Lovable. */
export function M_WebApps() {
  const tools = [["claude", "Claude Code", "агент в вашей папке"], ["cursor", "Cursor", "ИИ-редактор кода"], ["lovable", "Lovable", "сайт из описания"]];
  return (
    <Statement kicker="Практика 3 · сайты" title={<>А если нужен <Em>сайт или сервис</Em></>} size="3cqw" lead="Та же логика, другие инструменты.">
      <div className="grid grid-cols-3 gap-[0.9cqw]" style={{ maxWidth: "50cqw" }}>
        {tools.map(([logo, t, d], i) => (
          <motion.div key={t} {...inUp(i)} style={{ ...card, borderRadius: 22, padding: "1.3cqw 1.5cqw" }}>
            <MaskIcon name={logo} color={T.brown} size="2.4cqw" />
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.25cqw", marginTop: "0.9cqw" }}>{t}</div>
            <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.2cqw" }}>{d}</div>
          </motion.div>
        ))}
      </div>
    </Statement>
  );
}

/** P3 · Главный вывод: было — команда на полгода, стало — один человек с ИИ за неделю. Цифры — из прошлого воркшопа, в [скобках] до актуальных от Александра. */
export function M_MainConclusion() {
  return (
    <Statement kicker="Главный вывод" title={<>Что делала команда, <Em>делает один человек с ИИ</Em></>} size="2.8cqw">
      <div className="flex items-center gap-[1.4cqw]">
        <motion.div {...inUp(0)} style={{ ...card, borderRadius: 22, padding: "1.2cqw 1.4cqw" }}>
          <div style={{ ...txt, fontSize: "0.85cqw", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.muted }}>Раньше</div>
          <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.45cqw", whiteSpace: "nowrap", color: T.muted, marginTop: "0.4cqw", textDecoration: "line-through", textDecorationColor: `${T.brown}88` }}><Fill>5 человек × 6 месяцев</Fill></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: "-0.8cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: 0.6, duration: 0.35, ease: EASE }}><Arrow size="2cqw" /></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring", stiffness: 180, damping: 14 }}
          style={{ ...goldButton, borderRadius: 22, padding: "1.2cqw 1.4cqw" }}>
          <div style={{ ...txt, fontSize: "0.85cqw", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.ink }}>Сейчас</div>
          <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.45cqw", whiteSpace: "nowrap", color: T.ink, marginTop: "0.4cqw" }}><Fill>1 человек × 1 неделя</Fill></div>
        </motion.div>
      </div>
    </Statement>
  );
}

/** P3 · Мета-момент: эту презентацию, как и интро-ролик, собрали агенты. Правда: деку v2 собрала облачная сессия Claude по брифам. */
export function M_DeckByAgent() {
  return (
    <Statement tone="night" kicker="И последнее" title={<>Эту презентацию тоже <Em night>собрали агенты</Em></>} size="3cqw"
      lead="Тексты, вёрстку, анимации и графику — по моим словам. Как и ролик, которым мы открыли эфир. Я правил и утверждал.">
      {/* Мост к продаже 2 (волна 3): приложение из практики 3 — это модуль 3 Vibe Production */}
      <Note color={T.nightMuted} style={{ marginTop: 0, fontSize: "1.1cqw", maxWidth: "44cqw" }}>Приложения и документы под свои задачи: модуль 3 Vibe Production, автоматизации на вайбкодинге.</Note>
    </Statement>
  );
}
