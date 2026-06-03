"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ClaudeCodeTerminalProps {
  prompt: string;
  response?: string;
  className?: string;
  /** Скорость печати в мс на символ */
  speed?: number;
}

/**
 * ClaudeCodeTerminal — мок claude-code TUI с ЦИКЛИЧНЫМ typewriter-эффектом.
 * Печатает промпт человека → печатает ответ Claude → держит → стирает → повторяет.
 * Живой, не замирает (Александр: «терминал должен быть более живой, текст печатался»).
 */
export function ClaudeCodeTerminal({
  prompt,
  response,
  className,
  speed = 35,
}: ClaudeCodeTerminalProps) {
  const [typedPrompt, setTypedPrompt] = useState("");
  const [typedResponse, setTypedResponse] = useState("");
  const [phase, setPhase] = useState<"prompt" | "response" | "hold">("prompt");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const respSpeed = Math.max(12, Math.round(speed * 0.55));

    const run = () => {
      if (cancelled) return;
      setTypedPrompt("");
      setTypedResponse("");
      setPhase("prompt");
      let i = 0;
      let j = 0;

      const typeResponse = () => {
        if (cancelled) return;
        if (!response) {
          setPhase("hold");
          timer = setTimeout(run, 2400);
          return;
        }
        if (j <= response.length) {
          setTypedResponse(response.slice(0, j));
          j++;
          timer = setTimeout(typeResponse, respSpeed);
        } else {
          setPhase("hold");
          timer = setTimeout(run, 3600); // держим готовый ответ, потом цикл заново
        }
      };

      const typePrompt = () => {
        if (cancelled) return;
        if (i <= prompt.length) {
          setTypedPrompt(prompt.slice(0, i));
          i++;
          timer = setTimeout(typePrompt, speed);
        } else {
          setPhase("response");
          timer = setTimeout(typeResponse, 500);
        }
      };

      timer = setTimeout(typePrompt, 700);
    };

    run();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [prompt, response, speed]);

  const cursor = (
    <span
      className="inline-block w-2.5 h-4 ml-1 align-middle"
      style={{ background: "#B6FF00", animation: "sd-cursor-blink 1s steps(1) infinite" }}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className={cn("relative rounded-xl border border-white/15 overflow-hidden", className)}
      style={{
        background: "#0A0A0A",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8), 0 0 60px -10px rgba(182,255,0,0.15)",
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 text-center text-[11px] text-white/55 font-mono tracking-wider">
          claude-code · ~/projects/my-app
        </div>
      </div>

      {/* Terminal body */}
      <div
        className="p-5 md:p-6 text-sm md:text-[15px] leading-relaxed"
        style={{ fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace", minHeight: "260px" }}
      >
        <div className="text-white/55 mb-3">
          <span style={{ color: "#B6FF00" }}>$</span> claude
        </div>

        <div className="mb-2">
          <span style={{ color: "#FC5C02" }}>human:</span>{" "}
          <span className="text-white/90">{typedPrompt}</span>
          {phase === "prompt" && cursor}
        </div>

        {(phase === "response" || phase === "hold") && response && (
          <div className="mt-3">
            <span style={{ color: "#B6FF00" }}>claude:</span>{" "}
            <span className="text-white/75">{typedResponse}</span>
            {phase === "response" && cursor}
          </div>
        )}

        <style jsx>{`
          @keyframes sd-cursor-blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
        `}</style>
      </div>
    </motion.div>
  );
}
