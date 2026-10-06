// Дата эфира. Меняется только здесь: страница, «Спасибо», таймер, календарь и разметка для поисковиков берут её отсюда.
// Время — по Алматы (UTC+5), длительность — в минутах.
var EFIR = { start: '2026-10-07T20:00:00+05:00', minutes: 80 };

(function(){
  var p = EFIR.start.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):\d{2}(.*)$/);
  var months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  var days = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  var inDays = ['в воскресенье','в понедельник','во вторник','в среду','в четверг','в пятницу','в субботу'];
  var wd = new Date(Date.UTC(+p[1], p[2] - 1, +p[3])).getUTCDay();
  // Часы на стене Алматы считаем из самой строки, а не из часового пояса браузера.
  var wall = new Date(Date.UTC(+p[1], p[2] - 1, +p[3], +p[4], +p[5]) + EFIR.minutes * 60000);
  function two(n){ return String(n).padStart(2, '0'); }

  EFIR.time = new Date(EFIR.start).getTime();
  EFIR.endIso = wall.getUTCFullYear() + '-' + two(wall.getUTCMonth() + 1) + '-' + two(wall.getUTCDate()) +
    'T' + two(wall.getUTCHours()) + ':' + two(wall.getUTCMinutes()) + ':00' + p[6];
  EFIR.text = {
    date: +p[3] + ' ' + months[p[2] - 1],      // 7 октября
    time: p[4] + ':' + p[5],                    // 20:00
    wd: days[wd],                               // среда
    Wd: days[wd][0].toUpperCase() + days[wd].slice(1),
    vwd: inDays[wd]                             // в среду
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
      'DESCRIPTION:Ссылку пришлём в WhatsApp перед началом. Записи не будет.',
      'ORGANIZER;CN=onAI Academy:mailto:platform@onai.academy',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }

  EFIR.fill = function(){
    document.querySelectorAll('[data-efir]').forEach(function(el){ el.textContent = EFIR.text[el.dataset.efir]; });
    document.querySelectorAll('a[data-efir-ics]').forEach(function(a){
      a.href = URL.createObjectURL(new Blob([ics()], { type: 'text/calendar;charset=utf-8' }));
    });
    var ld = document.getElementById('efir-ld');
    if (ld) {
      var j = JSON.parse(ld.textContent);
      j.startDate = EFIR.start; j.endDate = EFIR.endIso;
      ld.textContent = JSON.stringify(j, null, 2);
    }
  };
  document.addEventListener('DOMContentLoaded', EFIR.fill);
})();
