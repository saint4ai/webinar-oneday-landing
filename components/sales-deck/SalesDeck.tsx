"use client";

import { SlideDeck } from "./SlideDeck";
import { Slide_01_ColdOpen } from "./slides/Slide_01_ColdOpen";
import { Slide_02_ChatActivation } from "./slides/Slide_02_ChatActivation";
import { Slide_03_OrgInfo } from "./slides/Slide_03_OrgInfo";
import { Slide_ChatLevelPoll } from "./slides/Slide_ChatLevelPoll";
import { Slide_04_BonusAnnounce } from "./slides/Slide_04_BonusAnnounce";
import { Slide_05_BonusList } from "./slides/Slide_05_BonusList";
import { Slide_06_PollBonus } from "./slides/Slide_06_PollBonus";
import { Slide_07_Program } from "./slides/Slide_07_Program";
import { Slide_07b_BigPromise } from "./slides/Slide_07b_BigPromise";
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
import { Slide_52_MarketTime } from "./slides/Slide_52_MarketTime";
import { Slide_53_Research1 } from "./slides/Slide_53_Research1";
import { Slide_54_Research2 } from "./slides/Slide_54_Research2";
import { Slide_55_Research3 } from "./slides/Slide_55_Research3";
import { Slide_56_Research4 } from "./slides/Slide_56_Research4";
import { Slide_57_Research5Perplexity } from "./slides/Slide_57_Research5Perplexity";
import { Slide_58_WhereClients } from "./slides/Slide_58_WhereClients";
import { Slide_59_MarketKZ } from "./slides/Slide_59_MarketKZ";
import { Slide_60_MarketCIS } from "./slides/Slide_60_MarketCIS";
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
import { Slide_PracticeStart } from "./slides/Slide_PracticeStart";
import { Slide_75_AppDone } from "./slides/Slide_75_AppDone";
import { Slide_76_WhatNext } from "./slides/Slide_76_WhatNext";
import { Slide_77_MarketPrice } from "./slides/Slide_77_MarketPrice";
import { Slide_78_WebApps } from "./slides/Slide_78_WebApps";
import { Slide_79_MainConclusion } from "./slides/Slide_79_MainConclusion";
import { Slide_80_FeelEngagement } from "./slides/Slide_80_FeelEngagement";
import { Slide_81_RoutineTransition } from "./slides/Slide_81_RoutineTransition";
import { Slide_RoutineChapter } from "./slides/Slide_RoutineChapter";
import { Slide_BonusReminder } from "./slides/Slide_BonusReminder";
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
import { Slide_AmanaCase } from "./slides/Slide_AmanaCase";
import { Slide_105_CasesSummary } from "./slides/Slide_105_CasesSummary";
import { Slide_106_CasesEngagement } from "./slides/Slide_106_CasesEngagement";
import { Slide_107_ThreeQuestions } from "./slides/Slide_107_ThreeQuestions";
import { Slide_108_CanIDoIt } from "./slides/Slide_108_CanIDoIt";
import { Slide_109_Question2 } from "./slides/Slide_109_Question2";
import { Slide_110_WhatYouNeed } from "./slides/Slide_110_WhatYouNeed";
import { Slide_111_WhatIBuilt } from "./slides/Slide_111_WhatIBuilt";
import { Slide_112_NotCourse } from "./slides/Slide_112_NotCourse";
import { Slide_113_ProgramOverview } from "./slides/Slide_113_ProgramOverview";
import { Slide_114_Module1 } from "./slides/Slide_114_Module1";
import { Slide_114b_Module1Result } from "./slides/Slide_114b_Module1Result";
import { Slide_115_Module2 } from "./slides/Slide_115_Module2";
import { Slide_115b_Module2Result } from "./slides/Slide_115b_Module2Result";
import { Slide_116_Module3 } from "./slides/Slide_116_Module3";
import { Slide_116b_Module3Result } from "./slides/Slide_116b_Module3Result";
import { Slide_117_Module4 } from "./slides/Slide_117_Module4";
import { Slide_117b_Module4Result } from "./slides/Slide_117b_Module4Result";
import { Slide_118_Module5 } from "./slides/Slide_118_Module5";
import { Slide_118b_Module5Result } from "./slides/Slide_118b_Module5Result";
import { Slide_119_Module6 } from "./slides/Slide_119_Module6";
import { Slide_119b_Module6Result } from "./slides/Slide_119b_Module6Result";
import { Slide_120_Module7 } from "./slides/Slide_120_Module7";
import { Slide_120b_Module7Result } from "./slides/Slide_120b_Module7Result";
import { Slide_121_Module8 } from "./slides/Slide_121_Module8";
import { Slide_121b_Module8Result } from "./slides/Slide_121b_Module8Result";
import { Slide_122_Module9 } from "./slides/Slide_122_Module9";
import { Slide_122b_Module9Result } from "./slides/Slide_122b_Module9Result";
import { Slide_123_Module10 } from "./slides/Slide_123_Module10";
import { Slide_123b_Module10Result } from "./slides/Slide_123b_Module10Result";
import { Slide_124_VibeEngine } from "./slides/Slide_124_VibeEngine";
import { Slide_125_WhoTeaches } from "./slides/Slide_125_WhoTeaches";
import { Slide_126_Platform } from "./slides/Slide_126_Platform";
import { Slide_127_ValueDecomposition } from "./slides/Slide_127_ValueDecomposition";
import { Slide_128_FullPrice } from "./slides/Slide_128_FullPrice";
import { Slide_128b_PaysOff } from "./slides/Slide_128b_PaysOff";
import { Slide_128c_OrbYear } from "./slides/Slide_128c_OrbYear";
import { Slide_128d_FirstClient } from "./slides/Slide_128d_FirstClient";
import { Slide_128e_ProductVsService } from "./slides/Slide_128e_ProductVsService";
import { Slide_129_SecondTier } from "./slides/Slide_129_SecondTier";
import { Slide_Smysl1_Relevance } from "./slides/Slide_Smysl1_Relevance";
import { Slide_Smysl1b_Proof } from "./slides/Slide_Smysl1b_Proof";
import { Slide_Smysl2_Choice } from "./slides/Slide_Smysl2_Choice";
import { Slide_Smysl3_Career } from "./slides/Slide_Smysl3_Career";
import { Slide_Smysl4_Efficiency } from "./slides/Slide_Smysl4_Efficiency";
import { Slide_130_WithVsWithout } from "./slides/Slide_130_WithVsWithout";
import { Slide_131_SpecialPrice } from "./slides/Slide_131_SpecialPrice";
import { Slide_132_PrepayBonuses } from "./slides/Slide_132_PrepayBonuses";
import { Slide_133_QR1 } from "./slides/Slide_133_QR1";
import { Slide_134_BonusB1 } from "./slides/Slide_134_BonusB1";
import { Slide_135_BonusB2 } from "./slides/Slide_135_BonusB2";
import { Slide_136_BonusB3 } from "./slides/Slide_136_BonusB3";
import { Slide_137b_PrepaySummary } from "./slides/Slide_137b_PrepaySummary";
import { Slide_137_WhatYouGet } from "./slides/Slide_137_WhatYouGet";
import { Slide_138_PerDay } from "./slides/Slide_138_PerDay";
import { Slide_139_QR2 } from "./slides/Slide_139_QR2";
import { Slide_140_Timer } from "./slides/Slide_140_Timer";
import { Slide_141_HowToPay } from "./slides/Slide_141_HowToPay";
import { Slide_142_OTOHeader } from "./slides/Slide_142_OTOHeader";
import { Slide_143_OTO1 } from "./slides/Slide_143_OTO1";
import { Slide_143a_Cases } from "./slides/Slide_143a_Cases";
import { Slide_143b_BonusProgram } from "./slides/Slide_143b_BonusProgram";
import { Slide_144_OTO2 } from "./slides/Slide_144_OTO2";
import { Slide_145_OTO3 } from "./slides/Slide_145_OTO3";
import { Slide_146_OTO4 } from "./slides/Slide_146_OTO4";
import { Slide_147_OTOSummary } from "./slides/Slide_147_OTOSummary";
import { Slide_148_QR3 } from "./slides/Slide_148_QR3";
import { Slide_149_QAHeader } from "./slides/Slide_149_QAHeader";
import { Slide_ObjApply1_Trend } from "./slides/Slide_ObjApply1_Trend";
import { Slide_ObjApply2_Diplomas } from "./slides/Slide_ObjApply2_Diplomas";
import { Slide_150_ObjNoMoney } from "./slides/Slide_150_ObjNoMoney";
import { Slide_151_ObjWontWork } from "./slides/Slide_151_ObjWontWork";
import { Slide_152_ObjNoCredit } from "./slides/Slide_152_ObjNoCredit";
import { Slide_153_ObjNoClient } from "./slides/Slide_153_ObjNoClient";
import { Slide_154_Guarantee } from "./slides/Slide_154_Guarantee";
import { Slide_155_QAEngagement } from "./slides/Slide_155_QAEngagement";
import { Slide_156_BaitChapter } from "./slides/Slide_156_BaitChapter";
import { Slide_157_ThreeWays } from "./slides/Slide_157_ThreeWays";
import { Slide_158_MoneyPunchline } from "./slides/Slide_158_MoneyPunchline";
import { Slide_159_WhatYouTake } from "./slides/Slide_159_WhatYouTake";
import { Slide_160_FinalEngagement } from "./slides/Slide_160_FinalEngagement";
import { Slide_RemindMainTraining } from "./slides/Slide_RemindMainTraining";
import { Slide_ProgramRecap } from "./slides/Slide_ProgramRecap";
import { Slide_SalesWindow2 } from "./slides/Slide_SalesWindow2";
import { Slide_161_FourBonuses } from "./slides/Slide_161_FourBonuses";
import { Slide_162_Bonus4Stories } from "./slides/Slide_162_Bonus4Stories";
import { Slide_163_HowToGetBonuses } from "./slides/Slide_163_HowToGetBonuses";
import { Slide_164_WhereNotToWrite } from "./slides/Slide_164_WhereNotToWrite";
import { Slide_165_CodeWord } from "./slides/Slide_165_CodeWord";
import { Slide_166_Instagram } from "./slides/Slide_166_Instagram";
import { Slide_167_FinalReminder } from "./slides/Slide_167_FinalReminder";
import { Slide_168_FinalQR } from "./slides/Slide_168_FinalQR";
import { Slide_169_ThankYou } from "./slides/Slide_169_ThankYou";
import { Slide_170_FinalFrame } from "./slides/Slide_170_FinalFrame";

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
    <Slide_ChatLevelPoll key="level-poll" />,
    <Slide_04_BonusAnnounce key="4" />,
    <Slide_05_BonusList key="5" />,
    <Slide_06_PollBonus key="6" />,
    <Slide_07_Program key="7" />,
    <Slide_07b_BigPromise key="7b" />,
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
    <Slide_PracticeStart key="practice-start" />,
    <Slide_75_AppDone key="75" />,
    <Slide_76_WhatNext key="76" />,
    <Slide_77_MarketPrice key="77" />,
    <Slide_78_WebApps key="78" />,
    <Slide_79_MainConclusion key="79" />,
    <Slide_BonusReminder key="bonus-reminder" />,
    <Slide_80_FeelEngagement key="80" />,

    /* === ЧАСТЬ IX · КЕЙСЫ УЧЕНИКОВ (99-106) === */
    <Slide_99_CasesChapter key="99" />,
    <Slide_100_CaseAidos key="100" />,
    <Slide_101_CaseRenat key="101" />,
    <Slide_102_CaseMerey key="102" />,
    <Slide_103_CaseVladislav key="103" />,
    <Slide_104_CaseAuthor key="104" />,
    <Slide_AmanaCase key="amana" />,
    <Slide_105_CasesSummary key="105" />,
    <Slide_106_CasesEngagement key="106" />,

    /* === ЧАСТЬ X · ПРИВИВКА ОТ ВОЗРАЖЕНИЙ (107-109) === */
    <Slide_107_ThreeQuestions key="107" />,
    <Slide_108_CanIDoIt key="108" />,
    <Slide_109_Question2 key="109" />,

    /* === ЧАСТЬ XI · ПЕРЕХОД К ПРОДАЖЕ (110-111) === */
    <Slide_110_WhatYouNeed key="110" />,
    <Slide_111_WhatIBuilt key="111" />,

    /* === ЧАСТЬ XII · ПРОГРАММА (112+) — модуль → результат модуля === */
    <Slide_112_NotCourse key="112" />,
    <Slide_113_ProgramOverview key="113" />,
    <Slide_114_Module1 key="114" />,
    <Slide_114b_Module1Result key="114b" />,
    <Slide_115_Module2 key="115" />,
    <Slide_115b_Module2Result key="115b" />,
    <Slide_116_Module3 key="116" />,
    <Slide_116b_Module3Result key="116b" />,
    <Slide_117_Module4 key="117" />,
    <Slide_117b_Module4Result key="117b" />,
    <Slide_118_Module5 key="118" />,
    <Slide_118b_Module5Result key="118b" />,
    <Slide_119_Module6 key="119" />,
    <Slide_119b_Module6Result key="119b" />,
    <Slide_120_Module7 key="120" />,
    <Slide_120b_Module7Result key="120b" />,
    <Slide_121_Module8 key="121" />,
    <Slide_121b_Module8Result key="121b" />,
    <Slide_122_Module9 key="122" />,
    <Slide_122b_Module9Result key="122b" />,
    <Slide_123_Module10 key="123" />,
    <Slide_123b_Module10Result key="123b" />,
    <Slide_124_VibeEngine key="124" />,
    <Slide_125_WhoTeaches key="125" />,
    <Slide_126_Platform key="126" />,

    /* === ЧАСТЬ XIII · ЦЕННОСТЬ + XIV ПОЧЕМУ БЫСТРЕЕ (127-130) === */
    <Slide_127_ValueDecomposition key="127" />,
    <Slide_128_FullPrice key="128" />,
    <Slide_128b_PaysOff key="128b" />,
    <Slide_128c_OrbYear key="128c" />,
    <Slide_128d_FirstClient key="128d" />,
    <Slide_128e_ProductVsService key="128e" />,
    <Slide_129_SecondTier key="129" />,

    /* === БЛОК C · СМЫСЛЫ после 390 (цена 290 900 ещё НЕ названа) === */
    <Slide_Smysl1_Relevance key="smysl1" />,
    <Slide_Smysl1b_Proof key="smysl1b" />,
    <Slide_Smysl2_Choice key="smysl2" />,
    <Slide_Smysl3_Career key="smysl3" />,
    <Slide_Smysl4_Efficiency key="smysl4" />,
    <Slide_130_WithVsWithout key="130" />,

    /* === БЛОК D · ПРЕДОПЛАТА + БОНУСЫ (цена 290 900 ещё НЕ названа) === */
    <Slide_132_PrepayBonuses key="132" />,
    <Slide_133_QR1 key="133" />,
    <Slide_134_BonusB1 key="134" />,
    <Slide_135_BonusB2 key="135" />,
    <Slide_136_BonusB3 key="136" />,
    <Slide_137b_PrepaySummary key="137b" />,

    /* === БЛОК E · ФИНАЛ-ЦЕНА 290 900 НА ПИКЕ === */
    <Slide_131_SpecialPrice key="131" />,
    <Slide_137_WhatYouGet key="137" />,
    <Slide_138_PerDay key="138" />,
    <Slide_139_QR2 key="139" />,

    /* === ЧАСТЬ XVI · ДЕДЛАЙН (140-141) + XVII · OTO-БОНУСЫ (142-148) === */
    <Slide_140_Timer key="140" />,
    <Slide_141_HowToPay key="141" />,
    <Slide_142_OTOHeader key="142" />,
    <Slide_143_OTO1 key="143" />,
    <Slide_143a_Cases key="143a" />,
    <Slide_143b_BonusProgram key="143b" />,
    <Slide_144_OTO2 key="144" />,
    <Slide_145_OTO3 key="145" />,
    <Slide_146_OTO4 key="146" />,
    <Slide_147_OTOSummary key="147" />,
    <Slide_148_QR3 key="148" />,

    /* === ЧАСТЬ XVIII · Q&A + ВОЗРАЖЕНИЯ (149-155) + XIX · BAIT (156-158) === */
    <Slide_149_QAHeader key="149" />,
    <Slide_ObjApply1_Trend key="objapply1" />,
    <Slide_ObjApply2_Diplomas key="objapply2" />,
    <Slide_150_ObjNoMoney key="150" />,
    <Slide_151_ObjWontWork key="151" />,
    <Slide_152_ObjNoCredit key="152" />,
    <Slide_153_ObjNoClient key="153" />,
    <Slide_154_Guarantee key="154" />,
    <Slide_155_QAEngagement key="155" />,

    /* === ЭКСПЕРТНЫЙ КОНТЕНТ #2 · РУТИНА (перенесено: после финальной цены = «ещё большее обещание») === */
    <Slide_RoutineChapter key="routine-chapter" />,
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

    /* === ВТОРАЯ ПРОДАЖА · ДОЖИМ (для не успевших — снова предоплата) === */
    <Slide_156_BaitChapter key="156" />,
    <Slide_157_ThreeWays key="157" />,
    <Slide_158_MoneyPunchline key="158" />,

    /* === ЧАСТЬ XX · ВТОРОЕ ОКНО ПРОДАЖ + ФИНАЛЬНЫЙ CTA (159-170) === */
    <Slide_159_WhatYouTake key="159" />,
    <Slide_160_FinalEngagement key="160" />,

    /* === БЛОК H · 2-Е ОКНО ПРОДАЖ (напоминание → программа → окно#2) === */
    <Slide_RemindMainTraining key="remind" />,
    <Slide_ProgramRecap key="programrecap" />,
    <Slide_SalesWindow2 key="window2" />,

    <Slide_161_FourBonuses key="161" />,
    <Slide_162_Bonus4Stories key="162" />,
    <Slide_163_HowToGetBonuses key="163" />,
    <Slide_164_WhereNotToWrite key="164" />,
    <Slide_165_CodeWord key="165" />,
    <Slide_166_Instagram key="166" />,
    <Slide_167_FinalReminder key="167" />,
    <Slide_168_FinalQR key="168" />,
    <Slide_169_ThankYou key="169" />,
    <Slide_170_FinalFrame key="170" />,
  ];

  return <SlideDeck slides={slides} />;
}
