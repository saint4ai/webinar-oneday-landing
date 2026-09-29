"use client";

/**
 * MontageDeck — эфир Vibe Production («Контент-завод на ИИ» до 27.09), 1 октября 2026, 20:00.
 * Бренд-код сайтов onai.academy (theme.ts ← fx/brand.ts). Правые 40% кадра — зона камеры: только фон слайда.
 * Режиссура v2: docs/deck-v2/РЕЖИССУРА.md.
 * Раскадровка v3, 60 слайдов (39а — скидка по слову с сайта): ~/Downloads/Раскадровка_эфира_01-10_слайд_за_слайдом.md
 * Слайд 56: клавиши 0–5 — сколько мест из пяти уже занято.
 * 22r, 46r, 47r — результаты за месяц: цифры в results.ts, скрины в public/montage/results/ (shots — какие файлы уже лежат).
 */
import { SlideDeck } from "@/components/sales-deck/SlideDeck";
import { unbounded, manrope } from "./fonts";
import { M_Cover } from "./slides/M_Cover";
import { M_Chapter } from "./slides/M_Chapter";
import { M_Check, M_Poll, M_Program, M_Promise, M_Guides, M_About, M_CostStory, M_Proof15 } from "./slides/start";
import { M_Bottleneck, M_Vacancy, M_ThreeSeconds, M_OnePhrase, M_OneOf14, M_AgentOnPC, M_FiveSteps, M_StepVoice, M_Styles, M_StepAssemble, M_ReadyReel, M_NoFace } from "./slides/lesson1";
import { M_NoShoot, M_TwoFrames, M_TwoVariants, M_VoiceClone, M_AdResult } from "./slides/lesson2";
import { M_Case107, M_Want, M_WhoFirst, M_NotCourse, M_Module, M_Anchor, M_Installments, M_Discount, M_SixMonths, M_HowToBook, M_Inaction, M_OneScreen, M_Doubts, M_Subscriptions, M_Slots, M_FinalCTA } from "./slides/sale";
import { M_ResultMontage, M_ResultBot, M_ResultBlog } from "./slides/results";
import { M_ViewsNoLeads, M_CodeWordFlow, M_BotGuide, M_AIManager, M_TelegramReport, M_Builds, M_FactoryChain, M_Plan30, M_Thanks } from "./slides/lesson3";

export function MontageDeck({ shots = {} }: { shots?: { bot?: string; blog?: string } }) {
  const slides = [
    // Старт · 7 мин
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
    // Кто я · 3 мин
    <M_About key="08" />,
    <M_CostStory key="09" />,
    <M_Proof15 key="10" />,
    // Урок 1 · AI-монтаж · 20 мин
    <M_Chapter key="11" big="1" obj="lg-ch1-clapper" kicker="Урок 1 из 3" title="Рилс без знаний монтажа" sub="Проблема, первые 3 секунды и монтаж вживую" />,
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
    // Урок 2 · AI-креатор · 6 мин
    <M_Chapter key="24" big="2" obj="lg-ch2-studio" kicker="Урок 2 из 3" title="Реклама товара из фотографий" sub="Без съёмки, оператора и студии" />,
    <M_NoShoot key="25" />,
    <M_TwoFrames key="26" />,
    <M_TwoVariants key="27" />,
    <M_VoiceClone key="28" />,
    <M_AdResult key="29" />,
    // Переход к продаже · 3 мин
    <M_Case107 key="30" />,
    <M_Want key="31" />,
    <M_WhoFirst key="32" />,
    // Окно продаж 1 · 12 мин
    <M_Chapter key="33" big="Обучение" bigSize="9cqw" kicker="Vibe Production" title={"3 модуля, 15 уроков, 1\u00A0месяц"} sub="Доступ к урокам 3 месяца" />,
    <M_NotCourse key="34" />,
    <M_Module key="35" no={1} title="AI-монтаж" result="Первые смонтированные рилсы и план выпуска"
      lessons={["Рабочее место и первый запуск", "Сценарий и первые 3 секунды", "Выбор стиля", "Сборка ролика", "Без лица и с лицом. Серия роликов"]} />,
    <M_Module key="36" no={2} title="AI-креатор" result="Реклама товара 9:16 из фотографий"
      lessons={["Инструменты: сценарий и два кадра", "Движение между кадрами", "Повседневная реклама по шаблону", "Предметная Motion-реклама", "Сборка и копия своего голоса"]} />,
    <M_Module key="37" no={3} title="Ассистенты и автоматизация" result="Воронка от ролика до заявки"
      lessons={["Вайбкодинг в личных делах", "ИИ-менеджер в WhatsApp и Instagram", "Автоматизация процессов бизнеса", "Документы и презентации", "Контент-завод целиком"]} />,
    <M_Anchor key="38" />,
    <M_Installments key="39" />,
    <M_Discount key="39a" />,
    <M_SixMonths key="40" />,
    <M_HowToBook key="41" />,
    // Урок 3 · AI-автоматизация и приложения · 11 мин
    <M_Chapter key="42" big="3" obj="lg-ch3-leads" kicker="Урок 3 из 3" title="Как просмотр становится заявкой" sub="Кодовое слово, бот, ИИ-менеджер и отчёт в Telegram" />,
    <M_ViewsNoLeads key="43" />,
    <M_CodeWordFlow key="44" />,
    <M_BotGuide key="45" />,
    <M_AIManager key="46" />,
    <M_ResultBot key="46r" shot={shots.bot} />,
    <M_TelegramReport key="47" />,
    <M_ResultBlog key="47r" shot={shots.blog} />,
    <M_Builds key="48" />,
    <M_FactoryChain key="49" />,
    <M_Plan30 key="50" />,
    // Окно продаж 2 · 8 мин
    <M_Chapter key="51" big="Решение" bigSize="9cqw" kicker="Vibe Production" title="Остался один шаг" sub="Коротко повторю главное и отвечу на сомнения" />,
    <M_Inaction key="52" />,
    <M_OneScreen key="53" />,
    <M_Doubts key="54" />,
    <M_Subscriptions key="55" />,
    <M_Slots key="56" />,
    <M_FinalCTA key="57" />,
    // Финал · 2 мин
    <M_Guides key="58" kicker="Обещанное" title="Забирайте три гайда" lead="Напишите МОНТАЖ в чат." />,
    <M_Thanks key="59" />,
  ];
  return (
    <div className={`montage-deck ${unbounded.variable} ${manrope.variable}`}>
      {/* Номер слайда общего SlideDeck стоит в правом нижнем углу — это зона камеры, там только фон.
          Прячем его только в этой деке; номер остаётся в адресной строке (#N). */}
      <style>{`.montage-deck .bottom-4.right-5.z-30 { display: none; }`}</style>
      <SlideDeck slides={slides} theme="cacao" />
    </div>
  );
}
