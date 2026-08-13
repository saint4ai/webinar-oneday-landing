"use client";

/**
 * Deck60 — часовая версия воркшопа (~100 слайдов).
 *
 * Отдельный реестр. Оригинальный SalesDeck (155 слайдов, 3 часа) НЕ ТРОГАЕМ —
 * слайды переиспользуются те же самые, а не копируются. Правка общего слайда
 * автоматически попадает в обе версии.
 *
 * Структура эфира:
 *   1. Приветствие и активация чата
 *   2. Правила воркшопа
 *   3. Кто я и почему меня слушать
 *   4. Что такое вайбкодинг — ядро смысла (новые слайды W60_*)
 *   5. Два примера: продажник и HR
 *   6. Практика
 *   7. Продажа: программа, 6 модулей + бонусный, цена 150 000
 *   8. Финал
 *
 * Убрано намеренно (решение Александра): скидки, таймеры, предоплатные бонусы,
 * OTO-блок, тарифы и сравнение цен. Одна цена — 150 000 ₸.
 */

import { SlideDeck } from "./SlideDeck";

/* — 1. Открытие — */
import { Slide_01_ColdOpen } from "./slides/Slide_01_ColdOpen";
import { Slide_02_ChatActivation } from "./slides/Slide_02_ChatActivation";
import { Slide_ChatLevelPoll } from "./slides/Slide_ChatLevelPoll";
import { W60_OrgInfo } from "./slides/W60_OrgInfo";

/* — 2. О себе — */
import { Slide_12_TransitionIntro } from "./slides/Slide_12_TransitionIntro";
import { Slide_13_AlexanderIntro } from "./slides/Slide_13_AlexanderIntro";
import { Slide_14_AuthorityStats } from "./slides/Slide_14_AuthorityStats";

/* — 3. Ядро смысла — */
import { Slide_15_Chapter1 } from "./slides/Slide_15_Chapter1";
import { W60_Definition } from "./slides/W60_Definition";
import { W60_NotProfession } from "./slides/W60_NotProfession";
import { W60_WhatToUnderstand } from "./slides/W60_WhatToUnderstand";
import { W60_Amplify } from "./slides/W60_Amplify";
import { W60_AgentOnPC } from "./slides/W60_AgentOnPC";
import { W60_WhatAgentDoes } from "./slides/W60_WhatAgentDoes";
import { W60_ExpertAdvantage } from "./slides/W60_ExpertAdvantage";
import { Slide_18_HowItWorks } from "./slides/Slide_18_HowItWorks";
import { W60_WhatToBuild } from "./slides/W60_WhatToBuild";
import { Slide_20_TimeScale } from "./slides/Slide_20_TimeScale";
import { W60_Career } from "./slides/W60_Career";
import { Slide_23_ForWhom } from "./slides/Slide_23_ForWhom";
import { W60_WhoIsVibecoder } from "./slides/W60_WhoIsVibecoder";
import { W60_Downsides, W60_DownsidesFix } from "./slides/W60_Downsides";
import { W60_Cost } from "./slides/W60_Cost";

/* — 4. Два примера: продажник и HR — */
import { Slide_45_SalesPain } from "./slides/Slide_45_SalesPain";
import { Slide_46_SalesSolution } from "./slides/Slide_46_SalesSolution";
import { Slide_47_HRPain } from "./slides/Slide_47_HRPain";
import { Slide_48_HRSolution } from "./slides/Slide_48_HRSolution";
import { Slide_49_NichePunchline } from "./slides/Slide_49_NichePunchline";

/* — 5. Практика — */
import { Slide_71_PracticeChapter } from "./slides/Slide_71_PracticeChapter";
import { Slide_PracticeBuilds } from "./slides/Slide_PracticeBuilds";
import { Slide_72_GoogleAIStudio } from "./slides/Slide_72_GoogleAIStudio";
import { Slide_FamilyTrackerBrief } from "./slides/Slide_FamilyTrackerBrief";
import { Slide_PracticeStart } from "./slides/Slide_PracticeStart";
import { Slide_76_WhatNext } from "./slides/Slide_76_WhatNext";
import { Slide_77_MarketPrice } from "./slides/Slide_77_MarketPrice";
import { Slide_78_WebApps } from "./slides/Slide_78_WebApps";
import { Slide_79_MainConclusion } from "./slides/Slide_79_MainConclusion";
/* — спрос на рынке — */
import { Slide_58_WhereClients } from "./slides/Slide_58_WhereClients";
import { Slide_59_MarketKZ } from "./slides/Slide_59_MarketKZ";
import { Slide_62_ThreadsDemand } from "./slides/Slide_62_ThreadsDemand";
import { Slide_63_EnoughMarket } from "./slides/Slide_63_EnoughMarket";
/* — что осваиваем на курсе — */
import { Slide_66_Skills } from "./slides/Slide_66_Skills";
import { Slide_67_MCP } from "./slides/Slide_67_MCP";
import { Slide_68_HiggsfieldInside } from "./slides/Slide_68_HiggsfieldInside";

/* — 6. Кейсы учеников (доверие перед продажей) — */
import { Slide_99_CasesChapter } from "./slides/Slide_99_CasesChapter";
import { Slide_100_CaseAidos } from "./slides/Slide_100_CaseAidos";
import { Slide_101_CaseRenat } from "./slides/Slide_101_CaseRenat";
import { Slide_102_CaseMerey } from "./slides/Slide_102_CaseMerey";
import { Slide_103_CaseVladislav } from "./slides/Slide_103_CaseVladislav";
import { Slide_104_CaseAuthor } from "./slides/Slide_104_CaseAuthor";
import { Slide_AmanaCase } from "./slides/Slide_AmanaCase";
import { Slide_105_CasesSummary } from "./slides/Slide_105_CasesSummary";

/* — 7. Продажа — */
import { Slide_107_ThreeQuestions } from "./slides/Slide_107_ThreeQuestions";
import { Slide_108_CanIDoIt } from "./slides/Slide_108_CanIDoIt";
import { Slide_110_WhatYouNeed } from "./slides/Slide_110_WhatYouNeed";
import { Slide_111_WhatIBuilt } from "./slides/Slide_111_WhatIBuilt";
import { Slide_112_NotCourse } from "./slides/Slide_112_NotCourse";
import { W60_ProgramOverview, W60_ObjWontWork } from "./slides/W60_ProgramOverview";
import {
  W60_Module1, W60_Module2, W60_Module3, W60_Module4,
  W60_Module5, W60_Module6,
} from "./slides/W60_Modules";
import { W60_BonusModule } from "./slides/W60_BonusModule";
import { Slide_124_VibeEngine } from "./slides/Slide_124_VibeEngine";
import { Slide_125_WhoTeaches } from "./slides/Slide_125_WhoTeaches";
import { Slide_126_Platform } from "./slides/Slide_126_Platform";
import { W60_Tariffs, W60_Mentoring } from "./slides/W60_Tariffs";
import { W60_HowToPay, W60_ObjNoMoney, W60_FinalReminder, W60_FinalQR } from "./slides/W60_Payment";

/* — 8. Возражения и финал — */
import { W60_ObjInstallment } from "./slides/W60_ObjInstallment";
import { Slide_ObjApply1_Trend } from "./slides/Slide_ObjApply1_Trend";
import { Slide_ObjApply2_Diplomas } from "./slides/Slide_ObjApply2_Diplomas";
import { W60_Guarantee } from "./slides/W60_Guarantee";
import { Slide_169_ThankYou } from "./slides/Slide_169_ThankYou";
import { Slide_170_FinalFrame } from "./slides/Slide_170_FinalFrame";

export function Deck60() {
  // Слайды на cream-фоне — счётчик в углу красится тёмным
  const lightSlideKeys = new Set([
    "12", "w60-def", "w60-understand", "w60-who", "w60-amplify", "w60-career", "w60-whatdoes", "w60-m2", "w60-m4", "w60-m6", "w60-program",
  ]);

  const slides = [
    /* === 1 · ПРИВЕТСТВИЕ И ПРАВИЛА (≈3 мин) === */
    <Slide_01_ColdOpen key="1" />,
    <Slide_02_ChatActivation key="2" />,
    <Slide_ChatLevelPoll key="level-poll" />,
    <W60_OrgInfo key="w60-org" />,

    /* === 2 · КТО Я (≈5 мин) === */
    <Slide_12_TransitionIntro key="12" />,
    <Slide_13_AlexanderIntro key="13" />,
    <Slide_14_AuthorityStats key="14" />,

    /* === 3 · ЧТО ТАКОЕ ВАЙБКОДИНГ — ЯДРО (≈13 мин) === */
    <Slide_15_Chapter1 key="15" />,
    <W60_Definition key="w60-def" />,
    <W60_NotProfession key="w60-notprof" />,
    <W60_WhatToUnderstand key="w60-understand" />,
    <W60_Amplify key="w60-amplify" />,
    <W60_AgentOnPC key="w60-agentpc" />,
    <W60_WhatAgentDoes key="w60-whatdoes" />,
    <Slide_18_HowItWorks key="18" />,
    <W60_WhatToBuild key="w60-build" />,
    <Slide_20_TimeScale key="20" />,
    <W60_ExpertAdvantage key="w60-expert" />,
    <W60_Career key="w60-career" />,
    <Slide_23_ForWhom key="23" />,
    <W60_Downsides key="w60-minus" />,
    <W60_DownsidesFix key="w60-minusfix" />,
    <W60_Cost key="w60-cost" />,
    <W60_WhoIsVibecoder key="w60-who" />,

    /* === 4 · ДВА ПРИМЕРА: ПРОДАЖНИК И HR (≈6 мин) === */
    <Slide_45_SalesPain key="45" />,
    <Slide_46_SalesSolution key="46" />,
    <Slide_47_HRPain key="47" />,
    <Slide_48_HRSolution key="48" />,
    <Slide_49_NichePunchline key="49" />,

    /* === 5 · ПРАКТИКА (≈13 мин) === */
    <Slide_71_PracticeChapter key="71" />,
    <Slide_PracticeBuilds key="practice-builds" />,
    <Slide_72_GoogleAIStudio key="72" />,
    <Slide_FamilyTrackerBrief key="family-brief" />,
    <Slide_PracticeStart key="practice-start" />,
    <Slide_76_WhatNext key="76" />,
    <Slide_77_MarketPrice key="77" />,
    <Slide_78_WebApps key="78" />,
    <Slide_79_MainConclusion key="79" />,

    /* === СПРОС: почему за это платят (≈4 мин) === */
    <Slide_58_WhereClients key="58" />,
    <Slide_59_MarketKZ key="59" />,
    <Slide_62_ThreadsDemand key="62" />,
    <Slide_63_EnoughMarket key="63" />,

    /* === 6 · КЕЙСЫ УЧЕНИКОВ (≈3 мин) === */
    <Slide_99_CasesChapter key="99" />,
    <Slide_100_CaseAidos key="100" />,
    <Slide_101_CaseRenat key="101" />,
    <Slide_102_CaseMerey key="102" />,
    <Slide_103_CaseVladislav key="103" />,
    <Slide_AmanaCase key="amana" />,
    <Slide_104_CaseAuthor key="104" />,
    <Slide_105_CasesSummary key="105" />,

    /* === 7 · ПРОДАЖА (≈16 мин) === */
    <Slide_107_ThreeQuestions key="107" />,
    <Slide_108_CanIDoIt key="108" />,
    <Slide_110_WhatYouNeed key="110" />,
    <Slide_111_WhatIBuilt key="111" />,
    <Slide_112_NotCourse key="112" />,
    <Slide_66_Skills key="66" />,
    <Slide_67_MCP key="67" />,
    <Slide_68_HiggsfieldInside key="68" />,
    <W60_ProgramOverview key="w60-program" />,

    /* Программа: 6 модулей + бонусный. Каждый — боль, что делаем, результат на руках */
    <W60_Module1 key="w60-m1" />,
    <W60_Module2 key="w60-m2" />,
    <W60_Module3 key="w60-m3" />,
    <W60_Module4 key="w60-m4" />,
    <W60_Module5 key="w60-m5" />,
    <W60_Module6 key="w60-m6" />,
    <W60_BonusModule key="w60-mb" />,

    <Slide_124_VibeEngine key="124" />,
    <Slide_125_WhoTeaches
      key="125"
      lead="Я веду основные занятия и курирую поток лично. Отвечаю на ваши вопросы в закрытой Telegram-группе."
    />,
    <Slide_126_Platform key="126" />,
    <W60_Mentoring key="w60-mentor" />,
    <W60_Tariffs key="w60-tariffs" />,
    <W60_HowToPay key="w60-pay" />,

    /* === 8 · ВОЗРАЖЕНИЯ И ФИНАЛ (≈4 мин) === */
    <W60_ObjNoMoney key="w60-objmoney" />,
    <W60_ObjWontWork key="w60-objwork" />,
    <W60_ObjInstallment key="w60-instal" />,
    <Slide_ObjApply1_Trend key="obj-trend" />,
    <Slide_ObjApply2_Diplomas key="obj-dipl" />,
    <W60_Guarantee key="w60-guarantee" />,
    <W60_FinalReminder key="w60-final" />,
    <W60_FinalQR key="w60-finalqr" />,
    <Slide_169_ThankYou key="169" />,
    <Slide_170_FinalFrame key="170" />,
  ];

  return <SlideDeck slides={slides} lightSlideKeys={lightSlideKeys} />;
}
