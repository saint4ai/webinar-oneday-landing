// Эфир каждый день в 20:00 по Алматы, первый эфир 7 октября 2026. Страница, «Спасибо», таймер, календарь и разметка для поисковиков берут старт отсюда.
// Ближайший эфир: сегодня, пока в Алматы раньше 20:00 + joinLiveMinutes (в эти минуты ещё можно зайти), иначе завтра. Раньше firstDay не бывает.
// Время Алматы считаем от фиксированного смещения +05:00, без Intl и базы поясов: на старых телефонах база даёт Алматы +6.
// minutes: длительность эфира, joinLiveMinutes: сколько минут после старта эфир считается идущим и на него ещё зовём.
var EFIR = { firstDay: '2026-10-07', hour: 20, minutes: 80, joinLiveMinutes: 40 };

(function(){
  var OFFSET = 5 * 60; // минут от UTC
  var months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  var days = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  var inDays = ['в воскресенье','в понедельник','во вторник','в среду','в четверг','в пятницу','в субботу'];
  function two(n){ return String(n).padStart(2, '0'); }

  // Часы на стене Алматы для абсолютного момента ms.
  function wall(ms){
    var d = new Date(ms + OFFSET * 60000);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  }
  function wallToUTC(y, m0, d, h, min){ return Date.UTC(y, m0, d, h, min, 0) - OFFSET * 60000; }
  function iso(ms){
    var p = wall(ms);
    return p.year + '-' + two(p.month) + '-' + two(p.day) + 'T' + two(p.hour) + ':' + two(p.minute) + ':00+05:00';
  }
  function dayNum(ms){ return Math.floor((ms + OFFSET * 60000) / 86400000); }

  var now = Date.now();
  var joinMs = EFIR.joinLiveMinutes * 60000;
  var f = EFIR.firstDay.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  var firstMs = f ? wallToUTC(+f[1], +f[2] - 1, +f[3], EFIR.hour, 0) : 0;
  var today = wall(now);
  var startMs = wallToUTC(today.year, today.month - 1, today.day, EFIR.hour, 0);
  if (now >= startMs + joinMs) startMs += 86400000; // смещение фиксированное, перехода на летнее время нет
  if (startMs < firstMs) startMs = firstMs;
  var t = wall(startMs);
  var wd = new Date(Date.UTC(t.year, t.month - 1, t.day)).getUTCDay();
  var diff = dayNum(startMs) - dayNum(now);

  EFIR.time = startMs;
  EFIR.start = iso(startMs);
  EFIR.endIso = iso(startMs + EFIR.minutes * 60000);
  EFIR.state = (now >= startMs && now < startMs + joinMs) ? 'live' : 'before';
  EFIR.text = {
    date: t.day + ' ' + months[t.month - 1],    // 7 октября
    time: two(t.hour) + ':' + two(t.minute),     // 20:00
    wd: days[wd],                               // среда
    Wd: days[wd][0].toUpperCase() + days[wd].slice(1),
    vwd: inDays[wd]                             // в среду
  };
  EFIR.text.rel = diff === 0 ? 'сегодня' : diff === 1 ? 'завтра' : EFIR.text.date;
  EFIR.text.wdDate = EFIR.text.wd + ', ' + EFIR.text.date;      // среда, 7 октября
  EFIR.text.WdDate = EFIR.text.Wd + ', ' + EFIR.text.date;      // Среда, 7 октября
  EFIR.text.vwdDate = EFIR.text.vwd + ', ' + EFIR.text.date;    // в среду, 7 октября
  EFIR.text.relDate = diff === 0 || diff === 1 ? EFIR.text.rel + ', ' + EFIR.text.date : EFIR.text.date; // завтра, 7 октября
  EFIR.text.timeMsk = two((t.hour + 24 - 2) % 24) + ':' + two(t.minute); // Москва на 2 часа западнее Алматы: 18:00

  // Встроенные браузеры (Instagram, Facebook и др.): ссылки WhatsApp и blob-файлы там работают плохо.
  var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  EFIR.env = {
    inApp: /(FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram|Line\/|Snapchat|BytedanceWebview|musical_ly|MicroMessenger|Twitter)/i.test(ua),
    isAndroid: /Android/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua)
  };

  function utc(ms){ return new Date(ms).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'; }
  function ics(){
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//onAI Academy//Efir//RU', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:efir-' + utc(EFIR.time) + '@onai.academy',
      'DTSTAMP:' + utc(Date.now()),
      'DTSTART:' + utc(EFIR.time),
      'DTEND:' + utc(EFIR.time + EFIR.minutes * 60000),
      'SUMMARY:Бесплатный эфир: рилсы без знаний монтажа',
      'DESCRIPTION:Ссылку пришлём в группу WhatsApp и в Telegram-бот. Записи не будет.',
      'ORGANIZER;CN=onAI Academy:mailto:platform@onai.academy',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }

  // Ссылка на календарь: во встроенном браузере blob-файл не скачивается, поэтому отдаём календарь с сервера.
  EFIR.calendarHref = function(){
    if (EFIR.env.inApp) return '/workshop/calendar';
    if (!EFIR._ics) EFIR._ics = URL.createObjectURL(new Blob([ics()], { type: 'text/calendar;charset=utf-8' }));
    return EFIR._ics;
  };

  // fill() без аргумента заполняет страницу целиком; fill(узел) только вставленный фрагмент (например, окно «Готово»).
  EFIR.fill = function(root){
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-efir]').forEach(function(el){
      var v = EFIR.text[el.dataset.efir];
      if (v) el.textContent = v;
    });
    scope.querySelectorAll('a[data-efir-ics]').forEach(function(a){
      a.href = EFIR.calendarHref();
      if (EFIR.env.inApp) a.removeAttribute('download');
    });
    if (scope !== document) return;
    // Заголовок вкладки: в HTML он без дня, здесь добавляем «сегодня» или «завтра».
    var title = document.querySelector('title[data-efir-title]');
    if (title) document.title = title.getAttribute('data-efir-title').replace(/\{(\w+)\}/g, function(m, k){ return EFIR.text[k] || ''; });
    var ld = document.getElementById('efir-ld');
    if (ld) {
      var j = JSON.parse(ld.textContent);
      j.startDate = EFIR.start; j.endDate = EFIR.endIso;
      ld.textContent = JSON.stringify(j, null, 2);
    }
  };
  document.addEventListener('DOMContentLoaded', EFIR.fill);
})();
