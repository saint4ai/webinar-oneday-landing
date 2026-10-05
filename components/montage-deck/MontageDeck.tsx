"use client";

/**
 * MontageDeck — эфир Vibe Production. Показ 6 октября 2026, 20:00 (до этого — 1 октября).
 * Бренд-код сайтов onai.academy (theme.ts ← fx/brand.ts). Правые 40% кадра — зона камеры: только фон слайда.
 * Режиссура v3 (04.10): интро-ролик → старт → хронология и результаты → практика 1 монтаж → продажа 1 →
 * практика 2 презентация по брифу → практика 3 приложения и сайты → продажа 2 → финал.
 * План: projects/ai_montage_webinar/РЕЖИССУРА_воркшоп_06-10.md. Режиссура v2: docs/deck-v2/РЕЖИССУРА.md.
 * Слайд 56: клавиши 0–5 — сколько мест из пяти уже занято. Слайд 00: Enter — старт интро-ролика со звуком.
 * [Скобки] на слайдах — пропуски, их дописывает Александр до эфира.
 * 10v, 10g, 10i, 22r — результаты: цифры в results.ts, скрины в public/montage/results/ (shots — какие файлы уже лежат).
 */
import { SlideDeck } from "@/components/sales-deck/SlideDeck";
import { unbounded, manrope } from "./fonts";
import { M_Cover } from "./slides/M_Cover";
import { M_Chapter } from "./slides/M_Chapter";
import { M_Check, M_Poll, M_Program, M_Promise, M_Guides, M_About, M_CostStory, M_Proof15 } from "./slides/start";
import { M_Bottleneck, M_Vacancy, M_ThreeSeconds, M_OnePhrase, M_OneOf14, M_AgentOnPC, M_FiveSteps, M_StepVoice, M_Styles, M_StepAssemble, M_ReadyReel, M_NoFace } from "./slides/lesson1";
import { M_Case107, M_Want, M_WhoFirst, M_NotCourse, M_Anchor, M_Installments, M_Discount, M_SixMonths, M_HowToBook, M_Inaction, M_OneScreen, M_Doubts, M_Subscriptions, M_Slots, M_FinalCTA, M_GameBonus } from "./slides/sale";
import { M_ShopReel, M_ShopAd, M_ShopLead, M_ForYou, M_SoloVsCourse } from "./slides/directions";
import { M_MyPath } from "./slides/warmup";
import { M_ResultMontage, M_ViralReels, M_Growth30, M_Inquiries } from "./slides/results";
import { M_CodeWordFlow, M_Plan30, M_Thanks } from "./slides/lesson3";
import { M_IntroVideo } from "./slides/intro";
import { M_DocsHow, M_DocsExample, M_DocsLive, M_AppsBuilds, M_AIStudio, M_AppBrief, M_AppStart, M_AppNext, M_MarketPrice, M_WebApps, M_MainConclusion, M_DeckByAgent } from "./slides/practice";

/** Файлы из public/montage/, которые page.tsx нашёл на диске. Нет файла — на слайде пунктирное место. */
export type Shots = { intro?: string; doc?: string; reach?: string; followers?: string; viral?: (string | undefined)[] };

export function MontageDeck({ shots = {} }: { shots?: Shots }) {
  const slides = [
    // Интро · 2 мин — ролик на весь кадр, камера в OBS скрыта
    <M_IntroVideo key="00" src={shots.intro} />,
    // Старт · 5 мин
    <M_Cover key="01" />,
    <M_Check key="02" />,
    <M_Poll key="03" kicker="Знакомимся" title="Кто вы?" lead="Напишите цифру в чат."
      options={["Эксперт, у меня свой продукт", "Не хочу сниматься сам", "SMM, делаю рилсы для клиентов", "Хочу брать заказы на монтаж"]}
      icons={["lg-i-stall", "lg-i-camera", "lg-i-phones", "lg-i-laptopcoins"]} />,
    <M_Poll key="04" kicker="Ещё вопрос" title="Сколько роликов вы выпустили за последний месяц?" lead="Ответ цифрой в чат."
      options={["Ни одного", "От 1 до 3", "От 4 до 10", "Больше 10"]} />,
    <M_Program key="05" />,
    <M_Promise key="06" />,
    <M_Guides key="07" kicker="Бонус за досмотр" title={"Досмотрите до конца: три\u00A0гайда"} lead="Выдам в конце эфира по слову МОНТАЖ." />,
    // Кто я, хронология и результаты · 7 мин
    <M_About key="08" />,
    <M_MyPath key="08w" />,
    <M_CostStory key="09" />,
    <M_Proof15 key="10" />,
    <M_ViralReels key="10v" shots={shots.viral} />,
    <M_Growth30 key="10g" reach={shots.reach} followers={shots.followers} />,
    <M_Inquiries key="10i" />,
    // Практика 1 · AI-монтаж · 20 мин
    <M_Chapter key="11" big="1" obj="lg-ch1-clapper" kicker="Практика 1 из 3" title="Рилс без знаний монтажа" sub="Проблема, первые 3 секунды и монтаж вживую в настроенном чате" />,
    <M_Bottleneck key="12" />,
    <M_Vacancy key="13" />,
    <M_ThreeSeconds key="14" />,
    <M_OnePhrase key="15" />,
    <M_OneOf14 key="16" />,
    <M_AgentOnPC key="17" />,
    <M_FiveSteps key="18" />,
    <M_StepVoice key="19" />,
    <M_Styles key="20" />,
    <M_StepAssemble key="21" />,
    <M_ReadyReel key="22" />,
    <M_ResultMontage key="22r" />,
    <M_NoFace key="23" />,
    <M_CodeWordFlow key="44" />,
    <M_Plan30 key="50" />,
    // Переход к продаже · 3 мин
    <M_Case107 key="30" />,
    <M_Want key="31" />,
    <M_WhoFirst key="32" />,
    // Окно продаж 1 · 10 мин
    <M_Chapter key="33" big="Обучение" bigSize="9cqw" kicker="Vibe Production" title={"3 модуля, 15 уроков, 1\u00A0месяц"} sub="Доступ к урокам 3 месяца" />,
    <M_NotCourse key="34" />,
    // 35–37v · Обучение как экскурсия по контент-заводу со слайда 34: цеха «Ролик», «Реклама», «Заявка», потом опрос 03 переворачивается
    // и «сами или с обучением». Режиссура: docs/tasks/deck_wave4_directions.md
    <M_ShopReel key="35" />,
    <M_ShopAd key="36" />,
    <M_ShopLead key="37" />,
    <M_ForYou key="37w" />,
    <M_SoloVsCourse key="37v" />,
    <M_Anchor key="38" />,
    <M_Discount key="39a" />,
    <M_Installments key="39" />,
    <M_SixMonths key="40" />,
    <M_HowToBook key="41" />,
    // Практика 2 · презентация по брифу · 10 мин
    <M_Chapter key="p2" big="2" obj="lg-i-cards" kicker="Практика 2 из 3" title="Презентация по брифу" sub="Бриф словами — на выходе презентация в вашем стиле" />,
    <M_DocsHow key="p2a" />,
    <M_DocsExample key="p2b" shot={shots.doc} />,
    <M_DocsLive key="p2c" />,
    // Практика 3 · сайты и приложения (из прошлого воркшопа) · 12 мин
    <M_Chapter key="p3" big="3" obj="lg-i-phones" kicker="Практика 3 из 3" title="Приложение и сайт из описания" sub="Google AI Studio и Claude Code — собираю вживую" />,
    <M_AppsBuilds key="p3a" />,
    <M_AIStudio key="p3b" />,
    <M_AppBrief key="p3c" />,
    <M_AppStart key="p3d" />,
    <M_AppNext key="p3e" />,
    <M_MarketPrice key="p3f" />,
    <M_WebApps key="p3g" />,
    <M_MainConclusion key="p3h" />,
    <M_DeckByAgent key="p3i" />,
    // Окно продаж 2 · 8 мин
    <M_Chapter key="51" big="Решение" bigSize="9cqw" kicker="Vibe Production" title="Остался один шаг" sub="Коротко повторю главное и отвечу на сомнения" />,
    <M_Inaction key="52" />,
    <M_OneScreen key="53" />,
    <M_Doubts key="54" />,
    <M_Subscriptions key="55" />,
    <M_Slots key="56" />,
    <M_FinalCTA key="57" />,
    <M_GameBonus key="57g" />,
    // Финал · 2 мин
    <M_Guides key="58" kicker="Обещанное" title="Забирайте три гайда" lead="Напишите МОНТАЖ в чат." />,
    <M_Thanks key="59" />,
  ];
  // Вне показа 6 октября (компоненты в slides/, вернуть — импортировать и вставить в массив):
  // 23w M_MyMontage, 24–29 урок «AI-креатор» (lesson2.tsx), 41w M_MyAutomation, 42 глава урока 3, 43, 45–49 (lesson3.tsx), 46r M_ResultBot, 47r M_ResultBlog.
  return (
    <div className={`montage-deck ${unbounded.variable} ${manrope.variable}`}>
      {/* Номер слайда общего SlideDeck перенесён из правого нижнего угла в левый:
          справа зона камеры, там только фон. Номер совпадает с #N в адресной строке. */}
      <style>{`.montage-deck .bottom-4.right-5.z-30 { right: auto; left: 1.25rem; }`}</style>
      <SlideDeck slides={slides} theme="cacao" />
    </div>
  );
}
