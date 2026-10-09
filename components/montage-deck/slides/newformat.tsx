"use client";
/**
 * nfa, nfb, nfc · «Смотрите, что получилось»: как за вечер собрали новый формат рилсов «35 художников» (Александр 09.10 через «Монтаж Reels»).
 * Сразу после бонуса bon4. Кадры из ролика public/montage/newformat/f*.jpg (2, 6, 10, 20, 28, 34, 40, 46 с), только картинки, без видео.
 * Факты от «Монтаж Reels»: huashu-art-motion 2 726 звёзд за 3 дня, 21 переезд камеры за 49 с, лесенка 30–80 мс. Ролик в ленте 09.10 в 21:00.
 */
import { motion } from "framer-motion";
import { Statement } from "../Statement";
import { T } from "../theme";
import { EASE, Em, Note, Num, Stagger, glueNode, txt } from "../ui";

const Frame = ({ n, i, w = "8.4cqw" }: { n: number; i: number; w?: string }) => (
  <motion.img src={`/montage/newformat/f${n}.jpg`} alt="" draggable={false}
    initial={{ opacity: 0, y: "1.2cqw", scale: 0.96 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }} transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: EASE }}
    style={{ display: "block", width: w, aspectRatio: "9 / 16", objectFit: "cover", borderRadius: "0.8cqw", border: `1px solid ${T.gold2}55`, boxShadow: T.shadow }} />
);

const Frames = ({ list }: { list: number[] }) => (
  <div className="grid grid-cols-2" style={{ gap: "0.7cqw", width: "17.5cqw" }}>
    {list.map((n, i) => <Frame key={n} n={n} i={i} />)}
  </div>
);

const Points = ({ items, base = 0.5 }: { items: string[]; base?: number }) => (
  <div className="grid" style={{ gap: "0.9cqw", marginTop: "1.3cqw", maxWidth: "36cqw" }}>
    {items.map((t, i) => (
      <Stagger key={t} i={i + 2} base={base}>
        <div className="flex items-start" style={{ gap: "0.8cqw", ...txt, fontWeight: 600, fontSize: "1.18cqw", lineHeight: 1.4 }}>
          <span style={{ flexShrink: 0, width: "0.55cqw", height: "0.55cqw", borderRadius: 99, background: T.gold, marginTop: "0.6cqw" }} />
          <span>{glueNode(t)}</span>
        </div>
      </Stagger>
    ))}
  </div>
);

export function M_NewFormatWorlds() {
  return (
    <Statement kicker="Смотрите, что получилось" title={<>Новый формат: каждая мысль <Em>в своём мире</Em></>} size="2.6cqw"
      leftSize="19cqw" left={<Frames list={[2, 20, 28, 34]} />}>
      <Points items={[
        "Взяли китайский навык huashu-art-motion: больше 2 700 звёзд на GitHub за 3 дня",
        "Перевели на русский и добавили свой режим монтажа рилсов",
        "Миры: Египет, Моне, 8-бит, тушь, Ван Гог, Баухаус, Климт",
      ]} />
    </Statement>
  );
}

export function M_NewFormatCode() {
  return (
    <Statement kicker="Смотрите, что получилось" title={<>Картины рисует <Em>код</Em>, а не нейросеть</>} size="2.6cqw"
      leftSize="19cqw" left={<Frames list={[6, 10, 46, 40]} />}>
      <Points items={[
        "Каждый стиль это программа: рисует картину кадр за кадром, и картина живёт. Звёзды Ван Гога крутятся, у Моне идёт рябь",
        "Камера спикера стала героем монтажа: карточка, кружок, овал, боковая рамка. 21 переезд за 49 секунд",
        "3D-ракурсы как в After Effects: камера облетает монитор, где печатается код и тут же рисуется картина",
      ]} />
    </Statement>
  );
}

export function M_NewFormatAI() {
  const steps = [
    ["ChatGPT с поиском", "изучил свежие приёмы моушн-дизайна 2026 и расписал план по кадрам"],
    ["Claude", "смонтировал ролик по этому плану и сам его проверил"],
    ["Правило плотности", "на каждое слово три слоя, лесенкой 30–80 мс. Ничего не стоит дольше полсекунды"],
  ];
  return (
    <Statement kicker="Смотрите, что получилось" title={<>Режиссуру придумал ИИ, <Em>смонтировал Claude</Em></>} size="2.6cqw">
      <div className="grid grid-cols-3" style={{ gap: "1cqw", maxWidth: "56cqw", marginTop: "0.6cqw" }}>
        {steps.map(([h, t], i) => (
          <Stagger key={h} i={i + 2} base={0.4}>
            <div style={{ border: `1px solid ${T.line}`, borderRadius: "1cqw", padding: "1cqw 1.1cqw", height: "100%" }}>
              <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.05cqw", color: T.gold }}>{i + 1}. {h}</div>
              <div style={{ ...txt, fontWeight: 500, fontSize: "1cqw", lineHeight: 1.4, marginTop: "0.5cqw" }}>{glueNode(t)}</div>
            </div>
          </Stagger>
        ))}
      </div>
      <Stagger i={6} base={0.4}>
        <div className="flex items-baseline" style={{ gap: "1cqw", marginTop: "1.6cqw" }}>
          <Num size="3.4cqw" color={T.gold}>1 вечер</Num>
          <div style={{ ...txt, fontWeight: 700, fontSize: "1.2cqw", maxWidth: "30cqw", lineHeight: 1.35 }}>{glueNode("от чужого навыка до готового формата рилсов")}</div>
        </div>
      </Stagger>
      <Note style={{ marginTop: "1cqw" }}>Ролик в этом формате выходит в мою ленту сегодня в 21:00</Note>
    </Statement>
  );
}
