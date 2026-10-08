/*
 * Подключение к воркшопу: кнопки WhatsApp и Telegram.
 * Один модуль для окна «Готово» на лендинге (src = pp) и страницы «Спасибо» (src = ty). Без зависимостей, подключается с defer.
 *
 * Разметка (на узле, который передают в mount, или внутри него):
 *   [data-join="wa"]    ссылка на группу WhatsApp (в href запасная ссылка, API её обновит)
 *   [data-join="tg"]    ссылка на бота (в href запасная ссылка, модуль допишет метку заявки)
 *   [data-join="live"]  строка «Эфир идёт прямо сейчас…», показывается, когда EFIR.state === 'live'
 *   [data-join="help"]  подсказка для iOS во встроенном браузере, показывается только там
 *   [data-join="tgroute"]  строка под кнопкой Telegram «В России WhatsApp работает с перебоями…», только когда Telegram идёт первым
 *   [data-join="hint"]  прежняя подсказка «Из России или WhatsApp работает с перебоями? Выбирайте Telegram.», прячется, когда Telegram и так первый
 *   [data-join="copy"]  кнопки «Скопировать ссылку», у каждой data-copy="wa" или "tg"
 *   [data-join="head"]  заголовок, к которому добавляется имя из заявки
 *   a[data-efir-ics], [data-efir]  календарь и даты, заполняет efir.js
 *
 * Порядок кнопок зависит от страны номера из формы (sessionStorage efirPhone, его пишет окно записи на лендинге):
 *   +7 и вторая цифра 7 (Казахстан): первая WhatsApp, вторая Telegram, как раньше;
 *   +7 и вторая цифра не 7 (Россия) и любой другой код страны: первая и крупная кнопка Telegram, WhatsApp второй и скромнее;
 *   номера нет (thank-you.html открыли напрямую): как раньше.
 * Кнопки меняются местами в самой разметке (а не только стилем), чтобы порядок на экране совпадал с порядком чтения и табуляции.
 *
 * API: Join.mount(узел, { src: 'pp' | 'ty' }), Join.prefetch(). Повторный mount на том же узле безопасен.
 * Если модуль не загрузился, кнопки остаются обычными ссылками с запасными адресами и тоже работают.
 */
(function(){
  'use strict';
  if (window.Join && window.Join.version) return;

  var VERSION = '20261008a';
  var BOT = 'workshop_aiprod_bot';
  var API_WA = '/workshop/api/whatsapp-link';
  var API_CLICK = '/workshop/api/ty-click';

  // ---------- окружение ----------
  var INAPP_RE = /(FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram|Line\/|Snapchat|BytedanceWebview|musical_ly|MicroMessenger|Twitter)/i;
  function env(){
    if (window.EFIR && window.EFIR.env) return window.EFIR.env;
    var ua = (navigator && navigator.userAgent) || '';
    return { inApp: INAPP_RE.test(ua), isAndroid: /Android/i.test(ua), isIOS: /iPhone|iPad|iPod/i.test(ua) };
  }

  function closest(el, sel){
    while (el && el.nodeType === 1) {
      if ((el.matches || el.msMatchesSelector || el.webkitMatchesSelector).call(el, sel)) return el;
      el = el.parentNode;
    }
    return null;
  }
  function all(root, sel){ return [].slice.call(root.querySelectorAll(sel)); }

  // ---------- ссылки ----------
  // Принимаем только https и только эти два адреса: ответ API нельзя превратить в произвольный переход.
  function isWaLink(link){
    try { var u = new URL(link); return u.protocol === 'https:' && (u.hostname === 'chat.whatsapp.com' || u.hostname === 'wa.me'); }
    catch (e) { return false; }
  }
  function waCode(href){
    try {
      var u = new URL(href);
      return u.hostname === 'chat.whatsapp.com' ? (u.pathname.replace(/^\/+/, '').split('/')[0] || null) : null;
    } catch (e) { return null; }
  }
  // Android во встроенном браузере: intent открывает приложение, а если его нет, ведёт на веб-страницу.
  function waIntent(code){
    return 'intent://chat.whatsapp.com/' + code + '#Intent;scheme=https;package=com.whatsapp;S.browser_fallback_url=' +
      encodeURIComponent('https://chat.whatsapp.com/' + code) + ';end';
  }
  function tgIntent(payload){
    return 'intent://resolve?domain=' + BOT + '&start=' + payload + '#Intent;scheme=tg;S.browser_fallback_url=' +
      encodeURIComponent('https://t.me/' + BOT + '?start=' + payload) + ';end';
  }

  function readEid(){
    try { return (sessionStorage.getItem('efirEid') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60); } catch (e) { return ''; }
  }
  function readName(){
    try { return (sessionStorage.getItem('efirName') || '').trim(); } catch (e) { return ''; }
  }
  function readPhone(){
    try { return (sessionStorage.getItem('efirPhone') || '').slice(0, 40); } catch (e) { return ''; }
  }

  // ---------- страна номера ----------
  // 'kz': +7 и вторая цифра 7 (Казахстан); 'ru': +7 и вторая цифра не 7 (Россия); 'other': любой другой код страны;
  // '': номера нет или по нему нельзя понять, откуда он (тогда всё как раньше).
  function phoneRoute(raw){
    var d = String(raw || '').replace(/\D/g, '');
    if (d.length < 10 || d.length > 15) return '';
    if (d.length === 11 && d.charAt(0) === '8') d = '7' + d.slice(1);                              // 8 701 ... это +7 701 ...
    else if (d.length === 10 && (d.charAt(0) === '7' || d.charAt(0) === '9')) d = '7' + d;         // 701 ... или 916 ... без кода страны
    if (d.length === 10) return '';                                                                // десять цифр без понятного кода страны: не гадаем
    if (d.length === 11 && d.charAt(0) === '7') return d.charAt(1) === '7' ? 'kz' : 'ru';
    return 'other';
  }
  // Telegram первым для России и всех кодов, кроме Казахстана; без номера и для Казахстана первым остаётся WhatsApp.
  function tgFirst(route){ return route === 'ru' || route === 'other'; }

  // Порядок кнопок по стране номера. Повторный вызов безопасен: ставит нужный порядок и показывает или прячет строки-пояснения.
  function applyRoute(root, route){
    var waBtn = root.querySelector('[data-join="wa"]');
    var tgBtn = root.querySelector('[data-join="tg"]');
    var first = tgFirst(route);
    if (waBtn && tgBtn) {
      var waCell = waBtn.parentNode, tgCell = tgBtn.parentNode, box = waCell.parentNode;
      if (box && box === tgCell.parentNode) {
        var lead = first ? tgCell : waCell, other = first ? waCell : tgCell;
        if (box.firstElementChild !== lead) box.insertBefore(lead, other);
        box.setAttribute('data-route', first ? 'tg' : 'wa');
      }
    }
    all(root, '[data-join="tgroute"]').forEach(function(n){ n.hidden = !first; });
    all(root, '[data-join="hint"]').forEach(function(n){ n.hidden = first; });
  }

  // ---------- ссылка группы WhatsApp с сервера (одна на все узлы) ----------
  var wa = { link: '', pending: null, roots: [] };
  function applyWa(root){
    if (!wa.link) return;
    all(root, '[data-join="wa"]').forEach(function(a){ a.href = wa.link; });
  }
  // Адрес группы хранится на сервере: Александр меняет его через бота, страница берёт свежий.
  // Пока ответа нет или он не пришёл, работает запасная ссылка из href.
  function prefetch(){
    if (wa.link || wa.pending || typeof fetch !== 'function') return;
    wa.pending = fetch(API_WA).then(function(r){ return r.json(); }).then(function(d){
      var link = d && d.link;
      if (isWaLink(link || '')) { wa.link = link; wa.roots.forEach(applyWa); }
      wa.pending = null;
    }).catch(function(){ wa.pending = null; });
  }

  // ---------- клик считаем до перехода ----------
  function beacon(ch, eid, src){
    try {
      var body = 'ch=' + ch + '&eid=' + encodeURIComponent(eid) + '&src=' + src;
      var sent = navigator.sendBeacon ? navigator.sendBeacon(API_CLICK, body) : false;
      if (!sent && typeof fetch === 'function') fetch(API_CLICK, { method: 'POST', body: body, keepalive: true });
    } catch (e) {}
  }

  function fallbackCopy(text, done){
    try {
      var t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(t); t.select(); t.setSelectionRange(0, text.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(t);
      if (ok) done();
    } catch (e) {}
  }

  // ---------- подключение ----------
  function mount(root, opts){
    if (typeof root === 'string') root = document.querySelector(root);
    if (!root || root.nodeType !== 1) return null;
    var src = opts && opts.src === 'pp' ? 'pp' : 'ty';
    if (root.__join) { root.__join.refresh(); return root.__join; } // повторный mount ничего не дублирует

    var e = env();
    var inst = { root: root, src: src, eid: '', payload: '', tgUrl: '' };

    function tgLinks(){ return all(root, '[data-join="tg"]'); }
    inst.refresh = function(){
      // Метка Telegram: <src>_<номер заявки>. Без номера просто pp или ty.
      inst.eid = readEid();
      inst.payload = inst.eid ? src + '_' + inst.eid : src;
      inst.tgUrl = 'https://t.me/' + BOT + '?start=' + inst.payload;
      tgLinks().forEach(function(a){ a.href = inst.tgUrl; });
      applyWa(root);
      inst.route = phoneRoute(readPhone());
      applyRoute(root, inst.route);
      // имя из заявки в заголовок
      var name = readName();
      if (name) all(root, '[data-join="head"]').forEach(function(h){ h.textContent = name + ', остался один шаг'; });
      // эфир идёт: зовём сразу в Telegram, бот пришлёт ссылку
      if (window.EFIR && window.EFIR.state === 'live') all(root, '[data-join="live"]').forEach(function(l){ l.hidden = false; });
      // iOS во встроенном браузере: открыть программно нельзя, показываем подсказку и копирование
      if (e.inApp && e.isIOS) all(root, '[data-join="help"]').forEach(function(h){ h.hidden = false; });
      // даты и календарь во вставленном фрагменте
      if (window.EFIR && typeof window.EFIR.fill === 'function') { try { window.EFIR.fill(root); } catch (err) {} }
    };

    root.addEventListener('click', function(ev){
      var el = closest(ev.target, '[data-join]');
      if (!el) return;
      var kind = el.getAttribute('data-join');
      if (kind === 'wa') {
        beacon('wa', inst.eid, src);
        var code = waCode(el.href);
        if (code && e.inApp && e.isAndroid) { ev.preventDefault(); location.href = waIntent(code); }
      } else if (kind === 'tg') {
        beacon('tg', inst.eid, src);
        if (e.inApp && e.isAndroid) { ev.preventDefault(); location.href = tgIntent(inst.payload); }
      } else if (kind === 'copy') {
        var label = el.__label || (el.__label = el.textContent);
        var text = el.getAttribute('data-copy') === 'wa' ? (root.querySelector('[data-join="wa"]') || {}).href : inst.tgUrl;
        if (!text) return;
        var done = function(){
          el.textContent = 'Ссылка скопирована';
          setTimeout(function(){ el.textContent = label; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function(){ fallbackCopy(text, done); });
        else fallbackCopy(text, done);
      }
    });

    root.__join = inst;
    // убрали из страницы старые панели (окно «Готово» собирается заново): не держим их в памяти
    wa.roots = wa.roots.filter(function(r){ return document.documentElement.contains(r); });
    wa.roots.push(root);
    inst.refresh();
    prefetch();
    return inst;
  }

  window.Join = {
    version: VERSION,
    mount: mount,
    prefetch: prefetch,
    // для проверок
    build: { isWaLink: isWaLink, waCode: waCode, waIntent: waIntent, tgIntent: tgIntent, phoneRoute: phoneRoute, tgFirst: tgFirst, applyRoute: applyRoute }
  };
})();
