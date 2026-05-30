"use client";

import { SlideDeck } from "./SlideDeck";
import { Slide_01_ColdOpen } from "./slides/Slide_01_ColdOpen";
import { Slide_02_ChatActivation } from "./slides/Slide_02_ChatActivation";
import { Slide_03_OrgInfo } from "./slides/Slide_03_OrgInfo";
import { Slide_04_BonusAnnounce } from "./slides/Slide_04_BonusAnnounce";
import { Slide_05_BonusList } from "./slides/Slide_05_BonusList";
import { Slide_06_PollBonus } from "./slides/Slide_06_PollBonus";
import { Slide_07_Program } from "./slides/Slide_07_Program";
import { Slide_08_Benefits } from "./slides/Slide_08_Benefits";
import { Slide_09_Targeting } from "./slides/Slide_09_Targeting";
import { Slide_10_CaseAzim } from "./slides/Slide_10_CaseAzim";
import { Slide_10b_AzimApp } from "./slides/Slide_10b_AzimApp";
import { Slide_11_PollFire } from "./slides/Slide_11_PollFire";
import { Slide_12_TransitionIntro } from "./slides/Slide_12_TransitionIntro";
import { Slide_13_AlexanderIntro } from "./slides/Slide_13_AlexanderIntro";
import { Slide_14_AuthorityStats } from "./slides/Slide_14_AuthorityStats";
import { Slide_15_Chapter1 } from "./slides/Slide_15_Chapter1";
import { Slide_16_Definition } from "./slides/Slide_16_Definition";
import { Slide_17_Misconception } from "./slides/Slide_17_Misconception";
import { Slide_18_HowItWorks } from "./slides/Slide_18_HowItWorks";
import { Slide_19_WhatToBuild } from "./slides/Slide_19_WhatToBuild";
import { Slide_20_TimeScale } from "./slides/Slide_20_TimeScale";
import { Slide_21_Downsides } from "./slides/Slide_21_Downsides";
import { Slide_21b_DownsidesFix } from "./slides/Slide_21b_DownsidesFix";
import { Slide_22_Cost } from "./slides/Slide_22_Cost";
import { Slide_23_ForWhom } from "./slides/Slide_23_ForWhom";
import { Slide_24_WhoIsVibecoder } from "./slides/Slide_24_WhoIsVibecoder";
import { Slide_25_PollIdea } from "./slides/Slide_25_PollIdea";
import { Slide_26_Chapter3Ways } from "./slides/Slide_26_Chapter3Ways";
import { Slide_27_Direction1 } from "./slides/Slide_27_Direction1";
import { Slide_28_Direction2 } from "./slides/Slide_28_Direction2";
import { Slide_29_Direction3 } from "./slides/Slide_29_Direction3";
import { Slide_30_ThreeWaysSummary } from "./slides/Slide_30_ThreeWaysSummary";
import { Slide_31_TodayShow } from "./slides/Slide_31_TodayShow";
import { Slide_32_PollWhich } from "./slides/Slide_32_PollWhich";
import { Slide_33_Transition } from "./slides/Slide_33_Transition";
import { Slide_34_Chapter2 } from "./slides/Slide_34_Chapter2";
import { Slide_35_WhatIsIt } from "./slides/Slide_35_WhatIsIt";
import { Slide_35b_WhyMonetizes } from "./slides/Slide_35b_WhyMonetizes";
import { Slide_36_WhyPay1 } from "./slides/Slide_36_WhyPay1";
import { Slide_37_WhyPay2 } from "./slides/Slide_37_WhyPay2";
import { Slide_38_WhyPay3 } from "./slides/Slide_38_WhyPay3";
import { Slide_39_WhyPay4 } from "./slides/Slide_39_WhyPay4";
import { Slide_40_WhyPay5 } from "./slides/Slide_40_WhyPay5";
import { Slide_41_RealtorPain } from "./slides/Slide_41_RealtorPain";
import { Slide_42_RealtorSolution } from "./slides/Slide_42_RealtorSolution";
import { Slide_43_ManagerPain } from "./slides/Slide_43_ManagerPain";
import { Slide_44_ManagerSolution } from "./slides/Slide_44_ManagerSolution";
import { Slide_45_SalesPain } from "./slides/Slide_45_SalesPain";
import { Slide_46_SalesSolution } from "./slides/Slide_46_SalesSolution";
import { Slide_47_HRPain } from "./slides/Slide_47_HRPain";
import { Slide_48_HRSolution } from "./slides/Slide_48_HRSolution";
import { Slide_49_NichePunchline } from "./slides/Slide_49_NichePunchline";
import { Slide_50_Engagement2 } from "./slides/Slide_50_Engagement2";
import { Slide_51_MarketPrice } from "./slides/Slide_51_MarketPrice";
import { Slide_52_MarketTime } from "./slides/Slide_52_MarketTime";
import { Slide_53_Research1 } from "./slides/Slide_53_Research1";
import { Slide_54_Research2 } from "./slides/Slide_54_Research2";
import { Slide_55_Research3 } from "./slides/Slide_55_Research3";
import { Slide_56_Research4 } from "./slides/Slide_56_Research4";
import { Slide_57_Research5Perplexity } from "./slides/Slide_57_Research5Perplexity";
import { Slide_58_WhereClients } from "./slides/Slide_58_WhereClients";
import { Slide_59_MarketKZ } from "./slides/Slide_59_MarketKZ";
import { Slide_60_MarketCIS } from "./slides/Slide_60_MarketCIS";
import { Slide_61_YandexDemand } from "./slides/Slide_61_YandexDemand";
import { Slide_62_ThreadsDemand } from "./slides/Slide_62_ThreadsDemand";
import { Slide_63_EnoughMarket } from "./slides/Slide_63_EnoughMarket";
import { Slide_64_MarketEngagement } from "./slides/Slide_64_MarketEngagement";
import { Slide_65_QualityChapter } from "./slides/Slide_65_QualityChapter";
import { Slide_66_Skills } from "./slides/Slide_66_Skills";
import { Slide_67_MCP } from "./slides/Slide_67_MCP";
import { Slide_68_HiggsfieldInside } from "./slides/Slide_68_HiggsfieldInside";
import { Slide_69_UIDesign } from "./slides/Slide_69_UIDesign";
import { Slide_70_QualityPunchline } from "./slides/Slide_70_QualityPunchline";
import { Slide_71_PracticeChapter } from "./slides/Slide_71_PracticeChapter";
import { Slide_72_GoogleAIStudio } from "./slides/Slide_72_GoogleAIStudio";
import { Slide_73_WhatBuild } from "./slides/Slide_73_WhatBuild";
import { Slide_74_FiveSteps } from "./slides/Slide_74_FiveSteps";
import { Slide_75_AppDone } from "./slides/Slide_75_AppDone";
import { Slide_76_WhatNext } from "./slides/Slide_76_WhatNext";
import { Slide_77_MarketPrice } from "./slides/Slide_77_MarketPrice";
import { Slide_78_WebApps } from "./slides/Slide_78_WebApps";
import { Slide_79_MainConclusion } from "./slides/Slide_79_MainConclusion";
import { Slide_80_FeelEngagement } from "./slides/Slide_80_FeelEngagement";
import { Slide_81_RoutineTransition } from "./slides/Slide_81_RoutineTransition";
import { Slide_82_SeventyPercent } from "./slides/Slide_82_SeventyPercent";
import { Slide_83_ForWhom } from "./slides/Slide_83_ForWhom";
import { Slide_84_ClaudeCodeJarvis } from "./slides/Slide_84_ClaudeCodeJarvis";
import { Slide_85_OpenWhisper } from "./slides/Slide_85_OpenWhisper";
import { Slide_86_ChatEraOver } from "./slides/Slide_86_ChatEraOver";
import { Slide_87_Pricing } from "./slides/Slide_87_Pricing";
import { Slide_88_Workspace } from "./slides/Slide_88_Workspace";
import { Slide_89_CloudMD } from "./slides/Slide_89_CloudMD";
import { Slide_90_ExcelFourDocs } from "./slides/Slide_90_ExcelFourDocs";
import { Slide_91_BrandFromScreenshot } from "./slides/Slide_91_BrandFromScreenshot";
import { Slide_92_HormoziProposal } from "./slides/Slide_92_HormoziProposal";
import { Slide_93_CallToTasks } from "./slides/Slide_93_CallToTasks";
import { Slide_94_Lightshot } from "./slides/Slide_94_Lightshot";
import { Slide_95_PerplexityClaude } from "./slides/Slide_95_PerplexityClaude";
import { Slide_96_Connectors } from "./slides/Slide_96_Connectors";
import { Slide_97_AgentRules } from "./slides/Slide_97_AgentRules";
import { Slide_98_LadderTransition } from "./slides/Slide_98_LadderTransition";
import { Slide_99_CasesChapter } from "./slides/Slide_99_CasesChapter";
import { Slide_100_CaseAidos } from "./slides/Slide_100_CaseAidos";
import { Slide_101_CaseRenat } from "./slides/Slide_101_CaseRenat";
import { Slide_102_CaseMerey } from "./slides/Slide_102_CaseMerey";
import { Slide_103_CaseVladislav } from "./slides/Slide_103_CaseVladislav";
import { Slide_104_CaseAuthor } from "./slides/Slide_104_CaseAuthor";
import { Slide_105_CasesSummary } from "./slides/Slide_105_CasesSummary";
import { Slide_106_CasesEngagement } from "./slides/Slide_106_CasesEngagement";

/**
 * SalesDeck — список всех слайдов в правильном порядке.
 * Глава 1 (Слайды 1-17) реализована. Следующие — добавляются по мере утверждения.
 */
export function SalesDeck() {
  const slides = [
    /* === ЧАСТЬ I · ОТКРЫТИЕ + АКТИВАЦИЯ (1-14) === */
    <Slide_01_ColdOpen key="1" />,
    <Slide_02_ChatActivation key="2" />,
    <Slide_03_OrgInfo key="3" />,
    <Slide_04_BonusAnnounce key="4" />,
    <Slide_05_BonusList key="5" />,
    <Slide_06_PollBonus key="6" />,
    <Slide_07_Program key="7" />,
    <Slide_08_Benefits key="8" />,
    <Slide_09_Targeting key="9" />,
    <Slide_10_CaseAzim key="10" />,
    <Slide_10b_AzimApp key="10b" />,
    <Slide_11_PollFire key="11" />,
    <Slide_12_TransitionIntro key="12" />,
    <Slide_13_AlexanderIntro key="13" />,
    <Slide_14_AuthorityStats key="14" />,

    /* === ЧАСТЬ II · ЧТО ТАКОЕ ВАЙБКОДИНГ — ГЛАВА 1 (15-25) === */
    <Slide_15_Chapter1 key="15" />,
    <Slide_16_Definition key="16" />,
    <Slide_17_Misconception key="17" />,
    <Slide_18_HowItWorks key="18" />,
    <Slide_19_WhatToBuild key="19" />,
    <Slide_20_TimeScale key="20" />,
    <Slide_21_Downsides key="21" />,
    <Slide_21b_DownsidesFix key="21b" />,
    <Slide_22_Cost key="22" />,
    <Slide_23_ForWhom key="23" />,
    <Slide_24_WhoIsVibecoder key="24" />,
    <Slide_25_PollIdea key="25" />,

    /* === ЧАСТЬ III · 3 НАПРАВЛЕНИЯ ПРИМЕНЕНИЯ (26-33) === */
    <Slide_26_Chapter3Ways key="26" />,
    <Slide_27_Direction1 key="27" />,
    <Slide_28_Direction2 key="28" />,
    <Slide_29_Direction3 key="29" />,
    <Slide_30_ThreeWaysSummary key="30" />,
    <Slide_31_TodayShow key="31" />,
    <Slide_32_PollWhich key="32" />,
    <Slide_33_Transition key="33" />,

    /* === ЧАСТЬ IV · СВОЙ СЕРВИС ДЛЯ БИЗНЕСА === */
    <Slide_34_Chapter2 key="34" />,
    <Slide_35_WhatIsIt key="35" />,
    <Slide_35b_WhyMonetizes key="35b" />,
    <Slide_36_WhyPay1 key="36" />,
    <Slide_37_WhyPay2 key="37" />,
    <Slide_38_WhyPay3 key="38" />,
    <Slide_39_WhyPay4 key="39" />,
    <Slide_40_WhyPay5 key="40" />,

    /* === Ниши «боль→решение» (41-44) === */
    <Slide_41_RealtorPain key="41" />,
    <Slide_42_RealtorSolution key="42" />,
    <Slide_43_ManagerPain key="43" />,
    <Slide_44_ManagerSolution key="44" />,

    /* === Блок отдела продаж (CallVision) === */
    <Slide_45_SalesPain key="45" />,
    <Slide_46_SalesSolution key="46" />,

    /* === Ниши HR + панчлайн (47-49) === */
    <Slide_47_HRPain key="47" />,
    <Slide_48_HRSolution key="48" />,
    <Slide_49_NichePunchline key="49" />,

    /* === ЧАСТЬ V · РЫНОК + RESEARCH (50-57) === */
    <Slide_50_Engagement2 key="50" />,
    <Slide_51_MarketPrice key="51" />,
    <Slide_52_MarketTime key="52" />,
    <Slide_53_Research1 key="53" />,
    <Slide_54_Research2 key="54" />,
    <Slide_55_Research3 key="55" />,
    <Slide_56_Research4 key="56" />,
    <Slide_57_Research5Perplexity key="57" />,

    /* === ЧАСТЬ V.5 · ОТКУДА КЛИЕНТЫ И ЕСТЬ ЛИ РЫНОК (58-64) === */
    <Slide_58_WhereClients key="58" />,
    <Slide_59_MarketKZ key="59" />,
    <Slide_60_MarketCIS key="60" />,
    <Slide_61_YandexDemand key="61" />,
    <Slide_62_ThreadsDemand key="62" />,
    <Slide_63_EnoughMarket key="63" />,
    <Slide_64_MarketEngagement key="64" />,

    /* === ЧАСТЬ VI · ИНСТРУМЕНТЫ КАЧЕСТВА (65-70) === */
    <Slide_65_QualityChapter key="65" />,
    <Slide_66_Skills key="66" />,
    <Slide_67_MCP key="67" />,
    <Slide_68_HiggsfieldInside key="68" />,
    <Slide_69_UIDesign key="69" />,
    <Slide_70_QualityPunchline key="70" />,

    /* === ЧАСТЬ VII · ПРАКТИКА ANDROID (71-80) === */
    <Slide_71_PracticeChapter key="71" />,
    <Slide_72_GoogleAIStudio key="72" />,
    <Slide_73_WhatBuild key="73" />,
    <Slide_74_FiveSteps key="74" />,
    <Slide_75_AppDone key="75" />,
    <Slide_76_WhatNext key="76" />,
    <Slide_77_MarketPrice key="77" />,
    <Slide_78_WebApps key="78" />,
    <Slide_79_MainConclusion key="79" />,
    <Slide_80_FeelEngagement key="80" />,

    /* === ЧАСТЬ VIII · АВТОМАТИЗАЦИЯ РУТИНЫ (81-98) === */
    <Slide_81_RoutineTransition key="81" />,
    <Slide_82_SeventyPercent key="82" />,
    <Slide_83_ForWhom key="83" />,
    <Slide_84_ClaudeCodeJarvis key="84" />,
    <Slide_85_OpenWhisper key="85" />,
    <Slide_86_ChatEraOver key="86" />,
    <Slide_87_Pricing key="87" />,
    <Slide_88_Workspace key="88" />,
    <Slide_89_CloudMD key="89" />,
    <Slide_90_ExcelFourDocs key="90" />,
    <Slide_91_BrandFromScreenshot key="91" />,
    <Slide_92_HormoziProposal key="92" />,
    <Slide_93_CallToTasks key="93" />,
    <Slide_94_Lightshot key="94" />,
    <Slide_95_PerplexityClaude key="95" />,
    <Slide_96_Connectors key="96" />,
    <Slide_97_AgentRules key="97" />,
    <Slide_98_LadderTransition key="98" />,

    /* === ЧАСТЬ IX · КЕЙСЫ УЧЕНИКОВ (99-106) === */
    <Slide_99_CasesChapter key="99" />,
    <Slide_100_CaseAidos key="100" />,
    <Slide_101_CaseRenat key="101" />,
    <Slide_102_CaseMerey key="102" />,
    <Slide_103_CaseVladislav key="103" />,
    <Slide_104_CaseAuthor key="104" />,
    <Slide_105_CasesSummary key="105" />,
    <Slide_106_CasesEngagement key="106" />,
  ];

  return <SlideDeck slides={slides} />;
}
