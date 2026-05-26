"use client";

import { SlideDeck } from "./SlideDeck";
import { Slide_01_ColdOpen } from "./slides/Slide_01_ColdOpen";
import { Slide_02_Authority } from "./slides/Slide_02_Authority";
import { Slide_03_ThreadsProof } from "./slides/Slide_03_ThreadsProof";

/* Конец draft'а — заглушка пока следующие слайды на утверждении */
function StubSlide() {
  return (
    <section
      className="relative w-full h-screen overflow-hidden bg-black flex flex-col items-center justify-center text-center"
      style={{
        paddingLeft: "calc(var(--sd-speaker-zone, 30vw) + 48px)",
        paddingRight: "48px",
      }}
    >
      <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#B6FF00] mb-6">
        // КОНЕЦ DRAFT'А · v0.3
      </div>
      <h2
        className="font-bold uppercase text-white leading-[1.1] tracking-[-0.03em] max-w-3xl"
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(40px, 4.5vw, 80px)",
        }}
      >
        Готовы <span className="bg-[#B6FF00] text-black px-[0.1em] rounded-[0.1em]">3 слайда из 65</span>
      </h2>
      <div className="mt-8 text-white/55 text-lg max-w-xl">
        Следующие пишутся в новом тоне для холодной ЦА.
        Утверждение текста → дизайн → следующий слайд.
      </div>
    </section>
  );
}

const BLOCK_LABELS: Record<number, string> = {
  1: "БЛОК 1 · COLD OPEN",
  2: "БЛОК 2 · БОЛЬ",
  3: "БЛОК 3 · ВОЗМОЖНОСТЬ",
  4: "БЛОК 4 · МЕТОД",
  5: "БЛОК 5 · КЕЙСЫ",
  6: "БЛОК 6 · ПРОГРАММА",
  7: "БЛОК 7 · БОНУСЫ",
  8: "БЛОК 8 · ОФФЕР",
  9: "БЛОК 9 · CTA",
};

/**
 * SalesDeck — список всех слайдов в правильном порядке.
 * Добавляй новые слайды сюда по мере готовности.
 *
 * Тексты ещё на утверждении (новый процесс: тексты → utвержд → дизайн).
 * Эта итерация показывает ТЕХНИЧЕСКИЕ возможности (карусель, шейдер-цифра).
 */
export function SalesDeck() {
  const slides = [
    <Slide_01_ColdOpen key="1.1" />,
    <Slide_02_Authority key="2.x" />,
    <Slide_03_ThreadsProof key="3.x" />,
    <StubSlide key="stub" />,
    // следующие слайды добавляю после утверждения текста
  ];

  return <SlideDeck slides={slides} blockLabels={BLOCK_LABELS} />;
}
