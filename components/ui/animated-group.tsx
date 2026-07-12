"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

type AnimatedGroupProps = {
  children: React.ReactNode;
  variants?: { container?: Variants; item?: Variants };
  className?: string;
  /** Рендерить сразу видимым (без SSR opacity:0) — для above-the-fold контента,
   *  который должен быть виден до загрузки JS на медленных соединениях. */
  instant?: boolean;
};

const defaultContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const defaultItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Анимация появления группы элементов. По эталону Александра — spring bounce 0.3, blur 12px → 0.
 */
export const AnimatedGroup = ({
  children,
  variants,
  className,
  instant = false,
}: AnimatedGroupProps) => {
  const containerVariants = variants?.container ?? defaultContainer;
  const itemVariants = variants?.item ?? defaultItem;

  const childArray = React.Children.toArray(children);

  return (
    <motion.div
      initial={instant ? false : "hidden"}
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {childArray.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};
