"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { Phone } from "../Phone";
import { moneyUsd } from "../prices";
import { Statement } from "../Statement";
import { LT, T, card, goldButton } from "../theme";
import { EASE, Em, Px, STEP, glueNode, nb, txt } from "../ui";

/**
 * Финал эфира после продажи обучения, перед «Спасибо» (Александр 06.10): по слайду на каждое направление с QR-кодом.
 * o1 корпоративное обучение · o2 внедрение AI и консультация · o3 игра и комьюнити · o4 блог · o5 Instagram.
 * Порядок не менялся. 07.10 Александр: «подготовить эти офферы вкуснее, с картинками, и объяснить их более доступно».
 * Теперь на каждом слайде одна схема: заголовок-выгода, строка «Что вы получите», 2–3 коротких пункта простыми словами,
 * справа картинка (LEGO-объект из public/montage/lego или настоящий скриншот) и QR. Факты, цены и ссылки прежние, с сайта
 * onai.academy/saint (раздел услуг, 06.10.2026), доллары рядом с тенге по правилу Александра «все цены в тенге и в долларах».
 * QR-коды — public/montage/qr-*.svg: сайт и блог с метками utm_source=webinar&utm_medium=qr&utm_campaign=vibe_production,
 * игра — t.me/tokenrunner_bot, Instagram — @saint4ai. Всё в левых 60% кадра.
 */

const In = ({ i, children, style, className }: { i: number; children: ReactNode; style?: CSSProperties; className?: string }) => (
  <motion.div className={className} style={style} initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.3 + i * STEP, duration: 0.45, ease: EASE }}>{children}</motion.div>
);

/** QR в белой карточке, под ним адрес и что будет по ссылке. Плита светлая: тёмные модули на тёмном стекле камера не прочитает. */
function Qr({ src, alt, caption, sub, i = 5 }: { src: string; alt: string; caption: string; sub: string; i?: number }) {
  return (
    <In i={i} style={{ width: "12.5cqw" }}>
      <motion.div initial={{ rotate: -4, scale: 0.92 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.5 + i * STEP, type: "spring", stiffness: 180, damping: 15 }}
        style={{ ...card, background: LT.paper, borderRadius: 22, padding: "0.9cqw", boxShadow: T.shadow }}>
        <img src={src} alt={alt} draggable={false} style={{ display: "block", width: "100%", height: "auto" }} />
      </motion.div>
      <div style={{ ...txt, fontWeight: 700, fontSize: "1cqw", color: T.brown, marginTop: "0.8cqw", whiteSpace: "nowrap" }}>{caption}</div>
      <div style={{ ...txt, fontWeight: 500, fontSize: "0.9cqw", color: T.muted, marginTop: "0.25cqw", lineHeight: 1.35 }}>{glueNode(sub)}</div>
    </In>
  );
}

/** Строка «Что вы получите»: одно предложение на стекле с золотой кромкой слева. */
const Get = ({ children }: { children: ReactNode }) => (
  <div style={{ ...card, borderRadius: 18, padding: "0.9cqw 1.2cqw", borderLeft: `0.28cqw solid ${T.gold2}` }}>
    <div style={{ ...txt, fontWeight: 700, fontSize: "0.8cqw", letterSpacing: ".14em", textTransform: "uppercase", color: T.accent }}>Что вы получите</div>
    <div style={{ ...txt, fontWeight: 600, fontSize: "1.25cqw", lineHeight: 1.4, color: T.ink, marginTop: "0.35cqw" }}>{glueNode(children)}</div>
  </div>
);

/** Короткий пункт с золотой галочкой. */
const Point = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start" style={{ gap: "0.9cqw" }}>
    <span className="flex items-center justify-center" style={{ width: "1.6cqw", height: "1.6cqw", borderRadius: 99, flexShrink: 0, marginTop: "0.12cqw", ...goldButton }}>
      <svg viewBox="0 0 24 24" style={{ width: "62%", height: "62%" }} fill="none" stroke={LT.ink} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </span>
    <span style={{ ...txt, fontWeight: 600, fontSize: "1.15cqw", lineHeight: 1.4 }}>{glueNode(children)}</span>
  </div>
);

/** Слово с дефисом или названием из двух слов не рвётся по строкам: «AI-агентами», «Claude Code». */
const nw = (s: string) => <span style={{ whiteSpace: "nowrap" }}>{s}</span>;

/** Золотая плашка-условие (цена, бесплатный аудит). */
const Chip = ({ children }: { children: ReactNode }) => (
  <span style={{ display: "inline-block", ...txt, fontWeight: 700, fontSize: "1cqw", padding: "0.5cqw 1.1cqw", borderRadius: 999, whiteSpace: "nowrap", ...goldButton }}>{children}</span>
);

/** Картинка справа над QR: LEGO-объект из public/montage/lego. size — высота. */
const Hero = ({ name, size = "10cqw" }: { name: string; size?: string }) => (
  <div className="flex justify-center" style={{ marginBottom: "1.3cqw" }}>
    <Px name={name} size={size} delay={0.35} />
  </div>
);

/**
 * Общая схема слайда-оффера: слева «Что вы получите» и пункты, справа картинка и QR.
 * media — широкая картинка (скриншот): ложится в левую колонку под пункты, а справа остаётся один QR.
 */
function Offer({ kicker, title, size = "2.6cqw", get, points, extra, hero, media, mediaIndex = 4, qr }: {
  kicker: ReactNode; title: ReactNode; size?: string; get: ReactNode; points: ReactNode[]; extra?: ReactNode; hero?: ReactNode; media?: ReactNode; mediaIndex?: number; qr: ReactNode;
}) {
  return (
    <Statement kicker={kicker} title={title} size={size}>
      <div className="grid items-start" style={{ gridTemplateColumns: "minmax(0, 1fr) 13cqw", gap: "2.6cqw", maxWidth: "54cqw" }}>
        <div className="min-w-0">
          <In i={0}><Get>{get}</Get></In>
          <div className="grid" style={{ gap: "0.8cqw", marginTop: "1.2cqw" }}>
            {points.map((p, k) => <In key={k} i={1 + k}><Point>{p}</Point></In>)}
          </div>
          {extra && <In i={1 + points.length} style={{ marginTop: "1.3cqw" }}>{extra}</In>}
          {media && <In i={mediaIndex} style={{ marginTop: "1.4cqw" }}>{media}</In>}
        </div>
        <div style={{ alignSelf: media ? "center" : "start" }}>
          {hero}
          {qr}
        </div>
      </div>
    </Statement>
  );
}

/** o1 · Корпоративное обучение: форматы, темы, цена с сайта и QR на бриф. */
export function M_TeamTraining() {
  return (
    <Offer kicker="Для компаний" title={<>Научим вашу команду <Em>работать с AI</Em></>}
      get="Программу под вашу команду: учим на её задачах и встраиваем решения в процессы и системы компании."
      points={[
        "Офлайн в вашем офисе в любом городе Казахстана, онлайн или смешанный формат",
        <>Онлайн: живые занятия и платформа onAI с {nw("AI-наставником")}</>,
        "Темы: AI для руководителей, в ежедневной работе, контент и реклама, продажи и клиенты, вайбкодинг",
      ]}
      extra={
        <div className="flex flex-wrap items-center" style={{ gap: "0.8cqw" }}>
          <Chip>{nb(`от 700 000 ₸ (${moneyUsd(700_000)})`)} за программу</Chip>
          <span style={{ ...txt, fontWeight: 600, fontSize: "0.95cqw", color: T.muted }}>Выступаю на конференциях и стратсессиях</span>
        </div>
      }
      hero={<Hero name="lg-s50-plan" size="10cqw" />}
      qr={<Qr src="/montage/qr-training.svg" alt="QR-код: сайт onai.academy/saint, обучение команды" caption="onai.academy/saint" sub="Бриф из 5 вопросов, программу соберём под вашу команду" />} />
  );
}

/** o2 · Внедрение AI под ваш процесс: четыре направления, бесплатный AI-аудит, консультация. */
export function M_ServicesOffer() {
  return (
    <Offer kicker="Услуги onAI" title={<>Внедрим AI <Em>под ваш процесс</Em></>}
      get={<>То, что уже работает у наших клиентов: платформы обучения, {nw("AI-ассистенты")}, звонобот и сквозная аналитика.</>}
      points={[
        "Четыре направления: клиенты и продажи, контент и реклама, аналитика и отчёты, сайты и платформы с AI",
        <>Бесплатный {nw("AI-аудит")}: разберём ваш процесс, выберем первую задачу и посчитаем стоимость</>,
        <>Консультация {nb("$100 за час")}: разбор вашего проекта в {nw("Claude Code")} или Codex</>,
      ]}
      hero={<Hero name="lg-i-robot" size="10cqw" />}
      qr={<Qr src="/montage/qr-services.svg" alt="QR-код: сайт onai.academy/saint, заявка на внедрение AI" caption="Оставить заявку" sub="onai.academy/saint, отвечу лично в течение дня" />} />
  );
}

/** o3 · Игра Token Runner: скидка на обучение и еженедельный приз топ-3. Здесь Александр прощается. Кикер с 08.10 «Игра Token Runner» (раньше «Комьюнити вайбкодеров»). */
export function M_GameCommunity() {
  return (
    <Offer kicker="Игра Token Runner" title={<>Играйте в игру и <Em>учитесь со скидкой</Em></>}
      get={<>Пройдите игру Token Runner в Telegram и получите скидку {nb(`10 000 ₸ (${moneyUsd(10_000)})`)} на Vibe Production.</>}
      points={[
        "Нужно пройти 3 испытания, игра выдаст код на скидку",
        // ревью Б7, 07.10: «играй и забирай бесплатно» противоречило продаже; бесплатно только топ-3, остальным скидка
        "Каждую неделю трое, кто набрал больше всех баллов, получают модули бесплатно",
        "Играть можно в Telegram, старт за минуту",
      ]}
      extra={
        <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: "1.1cqw" }}>
          <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.3cqw", lineHeight: 1.35, letterSpacing: "-.01em", color: T.brown }}>
            {glueNode("Спасибо, что были до конца.")} <Em>Увидимся в игре</Em>
          </span>
        </div>
      }
      // ролик игры (персонаж бежит) в телефоне, без звука, на повторе; без интерфейса Instagram: это игра, а не рилс
      hero={
        <In i={0} className="flex justify-center" style={{ marginBottom: "1.3cqw" }}>
          <Phone video="/montage/reels/token-runner.mp4" src="/montage/reels/token-runner.jpg" width="10.5cqw" chrome={false} />
        </In>
      }
      qr={<Qr src="/montage/qr-game.svg" alt="QR-код: игра Token Runner в Telegram" caption="t.me/tokenrunner_bot" sub="Игра в Telegram, старт за минуту" />} />
  );
}

/** o4 · Блог про AI-агентов (с 08.10, раньше «про вайбкодинг»): кадр блога в окне браузера и QR на подписку. */
export function M_Blog() {
  return (
    <Offer kicker="Блог про AI-агентов" title={<>Читайте, как собирать продукты <Em>{nw("с AI-агентами")}</Em></>}
      get="Новые выпуски про AI-агентов: подкасты, решения и кейсы."
      points={[
        <>Подкасты о том, как собирать продукты с {nw("AI-агентами")}</>,
        "Решения и кейсы без программистов в штате",
        "Подпишитесь по QR и не пропускайте новые выпуски",
      ]}
      mediaIndex={4}
      media={
        <div style={{ ...card, borderRadius: "1.2cqw", overflow: "hidden", background: T.paper, boxShadow: T.shadow, width: "28cqw" }}>
          <div className="flex items-center" style={{ gap: "0.4cqw", padding: "0.5cqw 0.8cqw", borderBottom: `1px solid ${T.line}`, background: T.card }}>
            {[T.gold, T.brownLt, T.line].map((col, k) => <span key={k} style={{ width: "0.55cqw", height: "0.55cqw", borderRadius: 99, background: col }} />)}
            <span style={{ ...txt, fontSize: "0.75cqw", color: T.muted, marginLeft: "0.6cqw" }}>onai.academy/blog</span>
          </div>
          <img src="/montage/blog-shot.webp" alt="Блог saint4ai" draggable={false} style={{ display: "block", width: "100%", aspectRatio: "16 / 8.6", objectFit: "cover", objectPosition: "top" }} />
        </div>
      }
      qr={<Qr src="/montage/qr-blog.svg" alt="QR-код: блог onai.academy/blog" caption="onai.academy/blog" sub="Подпишитесь на новые выпуски" />} />
  );
}

/** o5 · Instagram @saint4ai: скриншот профиля и QR на профиль. */
export function M_Instagram() {
  return (
    <Offer kicker="Instagram" title={<>Рилсы про AI каждый день <Em>на @saint4ai</Em></>}
      get={<>Каждый день новые рилсы про {nw("AI-агентов")}, монтаж и автоматизации.</>}
      points={[
        "Материалы по кодовым словам из рилсов приходят вам в директ",
        "Подпишитесь по QR и не пропускайте новые рилсы",
      ]}
      mediaIndex={3}
      media={
        <div style={{ ...card, borderRadius: "1.2cqw", overflow: "hidden", background: LT.paper, boxShadow: T.shadow, width: "34cqw" }}>
          <img src="/montage/profile.jpg" alt="Профиль saint4ai в Instagram" draggable={false} style={{ display: "block", width: "100%", height: "auto" }} />
        </div>
      }
      qr={<Qr src="/montage/qr-instagram.svg" alt="QR-код: Instagram @saint4ai" caption="@saint4ai" sub="instagram.com/saint4ai" />} />
  );
}
