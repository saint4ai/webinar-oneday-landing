// Общий скрипт гайдов: подвал с номером страницы и значки правил. Статичный, без анимаций.
(function () {
  const pages = [...document.querySelectorAll(".page")];
  pages.forEach((p, i) => {
    if (p.classList.contains("cover")) return;
    p.insertAdjacentHTML("beforeend",
      `<div class="foot"><span><a href="https://onai.academy/">onAI Academy</a> · воркшоп «Вайб-продакшен» · <a href="https://www.instagram.com/saint4ai/">@saint4ai</a></span><span class="pn">${i + 1} / ${pages.length}</span></div>`);
  });
  document.querySelectorAll(".rule .mk").forEach((m) => {
    m.innerHTML = '<svg viewBox="0 0 24 24" fill="#2A211C"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>';
  });
})();
