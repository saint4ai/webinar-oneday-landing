"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { MontageBg } from "../MontageBg";
import { NOFACE_REELS } from "../noface-reels";
import { Views } from "../ReelRail";
import { Statement } from "../Statement";
import { LT, T, card, goldButton } from "../theme";
import { Arrow, EASE, Em, Kicker, MaskIcon, Note, Num, Px, Stagger, glueNode, nb, txt } from "../ui";

/**
 * Слайды воркшопа под AI-монтаж (08.10.2026, ТЗ docs/tasks/deck_ai_montage.md; сценарий урока docs/workshop-v2/videourok-pipeline.md):
 *   nf1 M_NoFaceStory   «Я начинал без лица» (блок «Блог без лица» после 16, дополнение к ТЗ 08.10 вечером);
 *   nf2 M_NoFaceFormats «Если не можете снимать лицо»: два формата, которые придумал Александр;
 *   nf3 M_NoFaceReels   рилсы без лица из noface-reels.ts (пока массив пустой, слайд в колоду не вставляется);
 *   23v M_VoiceNoFace  два способа получить голос для блога без лица;
 *   lv  M_LessonVideo  видеоурок «весь путь рилса» на весь кадр 16:9;
 *   34a M_AgentsSetup  «Научу работать с агентами» (в продаже, после слайда 34);
 *   bon M_Bonus        «Бонус, если купите до конца дня»: модуль 3 AI-креатор и 6 месяцев доступа (после рассрочки 39, перед модулем 3 на слайде 36).
 * Тексты из ТЗ, цены не пишем (ElevenLabs $6 в месяц и 10 000+ голосов: elevenlabs.io/pricing и документация ElevenLabs, 08.10.2026).
 * Всё, кроме lv, в левых 60% кадра: правые 40% под камеру.
 */

/** 23v · Голос без вас: записать самому на телефон или отдать нейросети ElevenLabs. Текст под озвучку готовит Claude. */
export function M_VoiceNoFace() {
  return (
    <Statement kicker="Блог без лица · Голос" title={<>Голос <Em>без вас</Em></>} lead="Лицо не обязательно. Голос можно получить двумя способами." size="3.2cqw">
      <div className="grid grid-cols-2 gap-[1.2cqw]" style={{ maxWidth: "54cqw" }}>
        <Stagger i={0} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%" }}>
            <Px name="lg-i-phones" size="5cqw" bob={false} delay={0.35} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.accent, marginBottom: "0.6cqw" }}>Способ 1</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.25 }}>Запишите сами</div>
            <div style={{ ...txt, fontWeight: 500, fontSize: "1.05cqw", color: T.muted, marginTop: "0.5cqw" }}>{glueNode("На телефон. Дальше ролик собирает агент.")}</div>
          </div>
        </Stagger>
        <Stagger i={1} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%", border: `1.5px solid ${T.gold2}` }}>
            <div className="flex items-center" style={{ gap: "0.8cqw", margin: "0.3cqw 0 1.2cqw" }}>
              <MaskIcon name="elevenlabs" color={T.gold} size="3.2cqw" />
              <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.7cqw", color: T.nightText }}>ElevenLabs</span>
            </div>
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.gold2, marginBottom: "0.6cqw" }}>Способ 2</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.25 }}>Отдайте нейросети</div>
            <div className="flex items-end" style={{ gap: "1.6cqw", marginTop: "0.9cqw" }}>
              <div>
                <Num size="2.4cqw" color={T.gold}>{nb("$6")}</Num>
                <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.35cqw" }}>подписка от, в месяц</div>
              </div>
              <div>
                <Num size="2.4cqw" color={T.gold}>{nb("10 000+")}</Num>
                <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.35cqw" }}>голосов в библиотеке</div>
              </div>
            </div>
          </div>
        </Stagger>
      </div>
      <Stagger i={3} base={0.4} style={{ ...card, borderRadius: 18, padding: "0.9cqw 1.3cqw", marginTop: "1.2cqw", maxWidth: "54cqw", borderLeft: `0.28cqw solid ${T.gold2}` }}>
        <div className="flex items-center" style={{ gap: "0.9cqw" }}>
          <MaskIcon name="claude" color={T.gold} size="1.8cqw" />
          <span style={{ ...txt, fontWeight: 600, fontSize: "1.15cqw", lineHeight: 1.4 }}>{glueNode("Текст под озвучку готовит Claude: расставляет паузы и ударения, чтобы голос звучал живо.")}</span>
        </div>
      </Stagger>
    </Statement>
  );
}

/** Файл видеоурока кладёт монтажёр («Монтаж Reels»): public/montage/lesson/videourok-pipeline.mp4, 16:9, со звуком. */
const LESSON_SRC = "/montage/lesson/videourok-pipeline.mp4";

/**
 * lv · Видеоурок «Весь путь рилса» на весь кадр 16:9 (единственный слайд колоды, где заняты и правые 40%: видео закрывает камеру).
 * Запуск и пауза по клику, звук включён, автозапуска нет, слайды клик не листает. Пробел и стрелки остаются клавишами листания колоды
 * (SlideDeck ловит их раньше кнопки), поэтому пауза только кликом. Слой слайда пропускает клики насквозь, кнопке возвращаем pointer-events.
 * Пока файла нет (404), метаданные не придут, и слайд остаётся спокойным постером: ночной фон, LEGO-объект и название, кнопки нет.
 * Появился файл (после перезапуска сервера, public читается при старте) — на постере появляется кнопка «Включить видеоурок».
 */
export function M_LessonVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false); // метаданные файла загрузились, значит файл есть
  const [started, setStarted] = useState(false); // урок хотя бы раз включали: постер уходит, видно кадр
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { setStarted(true); v.play().catch(() => {}); }
    else v.pause();
  };
  const face: CSSProperties = { fontFamily: "var(--font-unbounded)", fontWeight: 800, letterSpacing: "-.025em", lineHeight: 1.1 };
  return (
    <SlideLayout className="bg-transparent" contentMinWidth={0}
      background={
        <>
          <MontageBg tone="night" />
          {/* видео на весь кадр лежит под сеткой колонок, постер над ним гаснет, когда урок включили */}
          <div className="absolute inset-0" style={{ opacity: started ? 1 : 0, transition: "opacity .35s", background: "#000" }}>
            <video ref={ref} src={LESSON_SRC} preload="metadata" playsInline
              onLoadedMetadata={() => setReady(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
              onEnded={() => { setPlaying(false); setStarted(false); }}
              className="absolute inset-0 h-full w-full" style={{ objectFit: "contain", background: "#000" }} />
          </div>
          {/* клик по кадру: запуск и пауза; на паузе поверх видео золотая кнопка. Сетка колонок pointer-events не берёт, клик доходит сюда */}
          {ready && (
            <button type="button" aria-label={playing ? "Пауза" : "Воспроизвести видеоурок"} aria-pressed={playing}
              onClick={(e) => { e.stopPropagation(); toggle(); }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ pointerEvents: "auto", cursor: "pointer", border: 0, padding: 0, background: started && !playing ? "rgba(10,8,7,.3)" : "transparent", transition: "background .25s" }}>
              {started && !playing && (
                <span className="flex items-center justify-center" style={{ width: "6cqw", height: "6cqw", borderRadius: 999, ...goldButton, boxShadow: `0 1cqw 2.4cqw -0.8cqw ${T.gold2}` }}>
                  <svg viewBox="0 0 24 24" style={{ width: "2.4cqw", height: "2.4cqw", marginLeft: "0.3cqw" }} fill={LT.ink}><path d="M8 5v14l11-7z" /></svg>
                </span>
              )}
            </button>
          )}
        </>
      }>
      {/* постер: левые 60%, пока урок не включали */}
      <motion.div aria-hidden={started} initial={false} animate={{ opacity: started ? 0 : 1 }} transition={{ duration: 0.35, ease: EASE }}>
        <Px name="lg-i-cards" size="15cqw" delay={0.15} style={{ marginLeft: "-0.6cqw" }} />
        <div style={{ marginTop: "1.6cqw" }}><Kicker color={T.gold}>Практика</Kicker></div>
        <h2 style={{ ...face, fontSize: "3.4cqw", color: T.nightText, maxWidth: "40cqw" }}>{glueNode(<>Видеоурок: весь путь <span style={{ color: T.gold }}>рилса</span></>)}</h2>
        {ready && (
          <div style={{ marginTop: "2.2cqw" }}>
            <span className="inline-flex items-center" style={{ ...goldButton, gap: "0.8cqw", borderRadius: 999, padding: "0.9cqw 1.8cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.1cqw" }}>
              <svg viewBox="0 0 24 24" style={{ width: "1.4cqw", height: "1.4cqw" }} fill={LT.ink}><path d="M8 5v14l11-7z" /></svg>
              Включить видеоурок
            </span>
          </div>
        )}
      </motion.div>
    </SlideLayout>
  );
}

/** Карточка с иконкой, номером и текстом для 34a. accent — золотая рамка. */
function Pillar({ i, no, icon, title, children, accent }: { i: number; no: string; icon: string; title: ReactNode; children: ReactNode; accent?: boolean }) {
  return (
    <Stagger i={i} style={{ height: "100%" }}>
      <div style={{ ...card, borderRadius: 22, padding: "1.3cqw 1.5cqw", height: "100%", ...(accent ? { border: `1.5px solid ${T.gold2}` } : null) }}>
        <Px name={icon} size="4.8cqw" bob={false} delay={0.3 + i * 0.07} style={{ margin: "-0.3cqw 0 0.5cqw -0.3cqw" }} />
        <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: accent ? T.gold2 : T.accent, marginBottom: "0.6cqw" }}>{no}</div>
        <div style={{ ...txt, fontWeight: 700, fontSize: "1.25cqw", lineHeight: 1.3 }}>{glueNode(title)}</div>
        <div style={{ ...txt, fontWeight: 500, fontSize: "0.98cqw", lineHeight: 1.45, color: T.muted, marginTop: "0.5cqw" }}>{glueNode(children)}</div>
      </div>
    </Stagger>
  );
}

/**
 * 34a · Научу работать с агентами (08.10, продажа Vibe Production): поставить задачу, настроить агентов и готовая архитектура папки проекта.
 * Папка годится и для монтажа, и для вайбкодинга: на ней Александр собирает платформы и IT-решения для компаний (кейсы на слайде 08c).
 */
export function M_AgentsSetup() {
  return (
    <Statement kicker="Vibe Production" title={<>Научу работать <Em>с агентами</Em></>} size="3cqw">
      <div className="grid grid-cols-3 gap-[1cqw]" style={{ maxWidth: "54cqw" }}>
        <Pillar i={0} no="01" icon="lg-i-botchat" title="Говорить с агентами">Правильно ставить задачу, чтобы получать нужный результат.</Pillar>
        <Pillar i={1} no="02" icon="lg-i-robot" title="Настраивать агентов">Чтобы они работали под ваши задачи.</Pillar>
        <Pillar i={2} no="03" icon="lg-i-box" title="Готовая архитектура папки проекта" accent>Работает и для монтажа, и для вайбкодинга. На ней я собираю платформы и <span style={{ whiteSpace: "nowrap" }}>IT-решения</span> для компаний.</Pillar>
      </div>
    </Statement>
  );
}

/** Строка с золотой галочкой для карточки подарка. */
const Tick = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start" style={{ gap: "0.7cqw" }}>
    <svg viewBox="0 0 24 24" style={{ width: "1.2cqw", height: "1.2cqw", flexShrink: 0, marginTop: "0.18cqw" }} fill="none" stroke={T.gold2} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    <span style={{ ...txt, fontWeight: 600, fontSize: "1.05cqw", lineHeight: 1.4 }}>{glueNode(children)}</span>
  </div>
);

/**
 * bon · Бонус, если купите до конца дня (Александр, 08.10, дополнение и уточнение к ТЗ): модуль 3 «AI-креатор» и 6 месяцев доступа вместо 3.
 * В модуле 3: вирусная реклама для брендов и их продуктов, рекламные ролики на основе продуктов клиента, готовые референсы и показ, как такие
 * ролики создаются. Дальше слайд 36 раскрывает модуль с видеоуроком. Модулей по-прежнему три (число на слайдах 33 и 53 прежнее).
 */
export function M_Bonus() {
  return (
    <Statement kicker="Vibe Production" title={<>Бонус, если купите <Em>до конца дня</Em></>} size="3cqw">
      <div className="grid gap-[1cqw]" style={{ gridTemplateColumns: "1.2fr 0.8fr", maxWidth: "54cqw" }}>
        <Stagger i={0} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.3cqw 1.5cqw", height: "100%", border: `1.5px solid ${T.gold2}` }}>
            <Px name="lg-i-box" size="6.2cqw" bob={false} delay={0.3} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.gold2, marginBottom: "0.6cqw" }}>Подарок 1</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.5cqw", lineHeight: 1.25 }}>Модуль 3 «AI-креатор»</div>
            <div className="grid" style={{ gap: "0.6cqw", marginTop: "0.9cqw" }}>
              <Tick>Как создавать вирусную рекламу для брендов и их продуктов</Tick>
              <Tick>Рекламные ролики на основе продуктов клиента</Tick>
              <Tick>Готовые референсы от меня и показ, как создаются такие ролики</Tick>
            </div>
          </div>
        </Stagger>
        <Stagger i={1} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.3cqw 1.5cqw", height: "100%" }}>
            <Px name="lg-s41-deadline" size="6.2cqw" bob={false} delay={0.37} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.accent, marginBottom: "0.6cqw" }}>Подарок 2</div>
            <Num size="3.2cqw" color={T.gold}>{nb("6 месяцев")}</Num>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.25cqw", lineHeight: 1.3, marginTop: "0.6cqw" }}>доступа к обучению вместо 3</div>
          </div>
        </Stagger>
      </div>
    </Statement>
  );
}

/** nf1 · Я начинал без лица: история Александра его словами и вывод для зрителя. */
export function M_NoFaceStory() {
  return (
    <Statement kicker="Блог без лица" title={<>Я начинал <Em>без лица</Em></>} size="3.2cqw">
      <div className="flex items-stretch" style={{ maxWidth: "54cqw", gap: "1.1cqw" }}>
        <Stagger i={0} style={{ flex: 1 }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%" }}>
            <Px name="lg-i-camera" size="5.2cqw" bob={false} delay={0.3} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.accent, marginBottom: "0.6cqw" }}>Сначала</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.35cqw", lineHeight: 1.3 }}>{glueNode("Когда начинал, в основном снимал без лица")}</div>
          </div>
        </Stagger>
        <Stagger i={1} className="flex items-center"><Arrow color={T.gold2} size="1.8cqw" /></Stagger>
        <Stagger i={2} style={{ flex: 1 }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%", border: `1.5px solid ${T.gold2}` }}>
            <Px name="lg-s32-hand" size="5.2cqw" bob={false} delay={0.45} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.gold2, marginBottom: "0.6cqw" }}>Потом</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.35cqw", lineHeight: 1.3 }}>{glueNode("Постепенно пришла уверенность, и я начал показывать себя")}</div>
          </div>
        </Stagger>
      </div>
      <Stagger i={4} base={0.5} style={{ marginTop: "1.8cqw" }}>
        <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.7cqw", lineHeight: 1.3, color: T.brown, maxWidth: "50cqw" }}>
          {glueNode("Не готовы к камере?")} <Em>{glueNode("Начните без лица")}</Em>
        </div>
      </Stagger>
    </Statement>
  );
}

/** nf2 · Если не можете снимать лицо: два формата, которые придумал Александр. Подробности про голос на слайде 23v. */
export function M_NoFaceFormats() {
  return (
    <Statement kicker="Блог без лица · Форматы" title={<>Если не можете <Em>снимать лицо</Em></>} lead="Два формата, которые я придумал." size="3.2cqw">
      <div className="grid grid-cols-2 gap-[1.2cqw]" style={{ maxWidth: "54cqw" }}>
        <Stagger i={0} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%" }}>
            <Px name="lg-i-robot" size="5cqw" bob={false} delay={0.35} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.accent, marginBottom: "0.6cqw" }}>Формат 1</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.25 }}>{glueNode(<>Анимированная <span style={{ whiteSpace: "nowrap" }}>голова-рассказчик</span></>)}</div>
          </div>
        </Stagger>
        <Stagger i={1} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%", border: `1.5px solid ${T.gold2}` }}>
            <Px name="lg-i-clapper" size="5cqw" bob={false} delay={0.42} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.gold2, marginBottom: "0.6cqw" }}>Формат 2</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.25 }}>{glueNode("Простой монтаж с закадровым голосом")}</div>
            <div style={{ ...txt, fontWeight: 500, fontSize: "1.05cqw", lineHeight: 1.45, color: T.muted, marginTop: "0.7cqw" }}>
              {glueNode("Голос свой: запишите голосовое на iPhone и отправьте агенту. Или дорожка ElevenLabs.")}
            </div>
          </div>
        </Stagger>
      </div>
    </Statement>
  );
}

/** Телефон с рилсом: запуск и пауза по клику, звук включён, поверх счётчик просмотров. Включённый телефон гасит остальные (active). */
function ReelPhone({ file, views, width, i, active, setActive }: { file: string; views: string; width: string; i: number; active: number | null; setActive: (n: number | null) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  // включили другой рилс: этот ставим на паузу
  useEffect(() => { const v = ref.current; if (v && active !== i && !v.paused) v.pause(); }, [active, i]);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { setActive(i); v.play().catch(() => {}); }
    else { v.pause(); setActive(null); }
  };
  return (
    <div style={{ width, aspectRatio: "9/16", background: T.night, borderRadius: "1.8cqw", padding: "0.25cqw", boxShadow: `0 0 0 1px ${T.nightLine} inset, ${T.shadow}`, flexShrink: 0 }}>
      <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: "1.55cqw", background: T.night2 }}>
        <video ref={ref} src={`/montage/noface/${file}.mp4`} poster={`/montage/noface/${file}.jpg`} preload="metadata" playsInline
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setActive(null); }}
          className="absolute inset-0 h-full w-full object-cover" />
        <Views value={views} size="0.8cqw" style={{ position: "absolute", left: "0.7cqw", bottom: "0.8cqw" }} />
        {/* pointer-events: auto — слой слайда в колоде пропускает клики насквозь, кнопке их нужно вернуть */}
        <button type="button" aria-label={playing ? "Пауза" : "Включить рилс со звуком"} aria-pressed={playing}
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: "auto", cursor: "pointer", border: 0, padding: 0, background: playing ? "transparent" : "rgba(10,8,7,.22)", transition: "background .25s" }}>
          {!playing && (
            <span className="flex items-center justify-center" style={{ width: "3.6cqw", height: "3.6cqw", borderRadius: 999, ...goldButton, boxShadow: `0 0.8cqw 1.8cqw -0.6cqw ${T.gold2}` }}>
              <svg viewBox="0 0 24 24" style={{ width: "1.5cqw", height: "1.5cqw", marginLeft: "0.2cqw" }} fill={LT.ink}><path d="M8 5v14l11-7z" /></svg>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * nf3 · Рилсы без лица от начала до конца: по телефону на формат, настоящие видео из public/montage/noface/, данные в noface-reels.ts.
 * Без массива слайд не показываем (условие в MontageDeck.tsx). Телефоны в ряд в левых 60%: до трёх крупные, до пяти мельче.
 * Клик по телефону включает рилс со звуком, второй клик ставит на паузу; включённый рилс гасит остальные.
 */
export function M_NoFaceReels() {
  const reels = NOFACE_REELS;
  const [active, setActive] = useState<number | null>(null);
  const n = reels.length;
  const width = n <= 2 ? "14.5cqw" : n === 3 ? "13cqw" : "9.6cqw";
  const sources = [...new Set(reels.map((r) => r.source))];
  return (
    <Statement kicker="Блог без лица · Примеры" title={<>Рилсы без лица, <Em>целиком</Em></>} size="2.9cqw">
      <div className="flex items-start" style={{ gap: "1.4cqw", maxWidth: "54cqw" }}>
        {reels.map((r, i) => (
          <Stagger key={r.file} i={i} style={{ width }}>
            <ReelPhone file={r.file} views={r.views} width={width} i={i} active={active} setActive={setActive} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.8cqw", color: T.gold2, marginTop: "0.9cqw", lineHeight: 1.3 }}>{glueNode(r.format)}</div>
            <div style={{ ...txt, fontWeight: 600, fontSize: "1cqw", lineHeight: 1.3, marginTop: "0.3cqw" }}>{glueNode(r.title)}</div>
          </Stagger>
        ))}
      </div>
      <Note style={{ marginTop: "1.2cqw" }}>{sources.join(". ")}</Note>
    </Statement>
  );
}
