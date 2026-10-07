"use client";

import { useLayoutEffect } from "react";
import { glue } from "./ui";

/**
 * Типографика всей колоды разом: каждому текстовому узлу внутри .montage-deck применяет glue() (ui.tsx): число идёт со своим словом
 * («6 форматов», «150 000 ₸»), предлоги и союзы приклеены к следующему слову, короткое последнее слово не остаётся одно.
 * Заголовки, подводки и подписи получают то же через glueNode() ещё на сервере; этот слой догоняет весь остальной текст
 * (карточки, чипы, плашки, подписи в телефонах) и всё, что появляется позже: печать, счётчики, смена слайдов.
 * Стоит в MontageBg, поэтому есть на каждом слайде. MutationObserver работает до отрисовки кадра: сдвига строк на экране нет.
 * Стили и скрипты не трогает, повторный проход ничего не меняет (glue идемпотентна).
 */
const SKIP = new Set(["STYLE", "SCRIPT", "NOSCRIPT", "TEXTAREA", "INPUT"]);

function fix(node: Text) {
  const p = node.parentElement;
  if (!p || SKIP.has(p.tagName)) return;
  const v = node.nodeValue ?? "";
  if (v.indexOf(" ") < 0) return;
  const g = glue(v);
  if (g !== v) node.nodeValue = g;
}

function walk(root: Node) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) fix(n as Text);
}

export function Typo() {
  useLayoutEffect(() => {
    const root = document.querySelector(".montage-deck");
    if (!root) return;
    walk(root);
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "characterData") fix(m.target as Text);
        else m.addedNodes.forEach((n) => { if (n.nodeType === 3) fix(n as Text); else if (n.nodeType === 1) walk(n); });
      }
    });
    mo.observe(root, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, []);
  return null;
}
