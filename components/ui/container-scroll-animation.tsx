"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ── Desktop: классическая 3D-анимация (rotateX + scale + translate)
  // ── Mobile: НЕТ translate header'а (раньше дёргался +60→-10 и накладывался
  //    на блок метрик), только лёгкий scale + fade-in на Card.
  const rotateRange: [number, number] = isMobile ? [0, 0] : [18, 0];
  const cardScale = useTransform(
    scrollYProgress,
    isMobile ? [0.15, 0.4] : [0, 1],
    isMobile ? [0.96, 1] : [1.02, 1]
  );
  const cardOpacity = useTransform(
    scrollYProgress,
    isMobile ? [0.05, 0.3] : [0, 0.1],
    [0.4, 1]
  );
  const rotate = useTransform(scrollYProgress, [0, 1], rotateRange);
  // Header translate — ТОЛЬКО на desktop, на mobile = 0 (статичен)
  const headerTranslate = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0, 0] : [0, -80]
  );

  return (
    <div
      className="relative p-2 md:p-8 flex items-center justify-center"
      ref={containerRef}
    >
      <div
        className="py-4 md:py-10 w-full relative"
        style={{ perspective: "1000px" }}
      >
        <Header translate={headerTranslate} titleComponent={titleComponent} />
        <Card
          rotate={rotate}
          scale={cardScale}
          opacity={cardOpacity}
          isMobile={isMobile}
        >
          {children}
        </Card>
      </div>
    </div>
  );
};

const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}) => (
  <motion.div
    style={{ translateY: translate }}
    className="max-w-5xl mx-auto text-center"
  >
    {titleComponent}
  </motion.div>
);

const Card = ({
  rotate,
  scale,
  opacity,
  isMobile,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  isMobile: boolean;
  children: React.ReactNode;
}) => (
  <motion.div
    style={{
      rotateX: rotate,
      scale,
      opacity,
      boxShadow:
        "0 0 #0000004d, 0 9px 20px rgba(252,92,2,0.15), 0 37px 37px rgba(0,0,0,0.4), 0 84px 50px rgba(0,0,0,0.25), 0 149px 60px rgba(252,92,2,0.05)",
      aspectRatio: "1400 / 840",
    }}
    // На mobile НЕТ negative margin — раньше -mt-8 затаскивал Card на блок
    // метрик «250+ учеников» (видно на скриншоте Александра).
    className={`max-w-6xl mx-auto w-full border-2 md:border-4 border-[#1a1a1a] p-2 md:p-4 bg-[#0a0a0a] rounded-[24px] md:rounded-[30px] ${
      isMobile ? "mt-6" : "-mt-12"
    }`}
  >
    <div className="h-full w-full overflow-hidden rounded-xl md:rounded-2xl bg-black border border-white/[0.06]">
      {children}
    </div>
  </motion.div>
);
