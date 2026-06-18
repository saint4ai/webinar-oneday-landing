# Runbook: смена WhatsApp-ссылки на /thank-you через Telegram-бота

Цель: Александр шлёт боту новую WhatsApp-ссылку → она подставляется на
`/workshop/thank-you` **без пересборки**. Прод: `/var/www/workshop` (pm2 `workshop`,
`next start` :4001, basePath `/workshop`). Живая воронка — деплой только по «го».

## Что добавлено в код
- `lib/whatsapp-link.ts` — рантайм-стор ссылки (файл `/var/lib/workshop/whatsapp-link.json`), never-throw, WA-only валидация.
- `app/api/whatsapp-link/route.ts` — `GET` текущей ссылки (no-store).
- `app/api/tg-link/route.ts` — Telegram webhook: constant-time секрет + fail-closed allowlist владельца + лимит тела + WA-only.
- `app/thank-you/page.tsx` → server component (force-dynamic, читает ссылку) + `ThankYouClient.tsx` (проп).
- `app/thank-you/WhatsAppCommunityCTA.tsx` + `lib/whatsapp-deeplink.ts` — умный диплинк на кнопке: канонический `chat.whatsapp.com/<code>` (real-tap, same-tab) + Android `intent://` (форс приложения, веб-фолбэк) + iOS-нудж «открой в Safari» + «скопировать ссылку». Бот по-прежнему получает обычную ссылку — диплинк строится автоматически на рендере.
- `next.config.ts` — basePath возвращён к `NODE_ENV==='production' ? '/workshop' : ''`.

## ENV на проде (`/var/www/workshop/.env.local`)
```
WHATSAPP_LINK_PATH=/var/lib/workshop/whatsapp-link.json
WHATSAPP_COMMUNITY_FALLBACK=<сегодняшняя рабочая ссылка>
TG_LINK_BOT_TOKEN=<токен бота>
TG_LINK_WEBHOOK_SECRET=205d7347bad63b82a4d9912d234d4215b383531b45146753
TG_LINK_OWNER_IDS=789638302
```

## Шаги деплоя (по порядку, не менять очерёдность)
1. **Бэкап env**: `cp /var/www/workshop/.env.local /var/www/workshop/.env.local.bak.$(date +%Y%m%d-%H%M%S)`; добавить 5 строк выше.
2. **Сид ссылки** (чтобы новая ссылка ушла в бой сразу):
   `echo '{"link":"<новая ссылка>","updatedAt":"<ISO>","updatedBy":"seed"}' > /var/lib/workshop/whatsapp-link.json`
3. **Бэкап билда**: `cp -r /var/www/workshop/.next /var/www/workshop/.next.bak.$(date +%s)`
4. **Сборка локально**: `npm run build` (NODE_ENV=production → basePath /workshop). Проверить в выводе: `/workshop/api/tg-link`, `/workshop/api/whatsapp-link`, thank-you помечен `ƒ (Dynamic)`.
5. **Доставка в staging**: `rsync` нового `.next` → `/var/www/workshop/.next.new` (БЕЗ `--delete`, не поверх живого).
6. **Атомарный своп**: `mv .next .next.old && mv .next.new .next && pm2 restart workshop`.
7. **Проверка**:
   - `curl -s https://onai.academy/workshop/api/whatsapp-link` → 200 + сид-ссылка.
   - `curl -s https://onai.academy/workshop/thank-you | grep chat.whatsapp.com` → новая ссылка.
8. **Регистрация webhook**:
   `curl "https://api.telegram.org/bot<TOKEN>/setWebhook" -d url="https://onai.academy/workshop/api/tg-link" -d secret_token="<SECRET>"`
   затем `getWebhookInfo` → url верный, last_error_message пусто.
9. **Round-trip**: Александр /start боту → шлёт ссылку → бот «✅ обновлено» → `curl` thank-you = новая.

## Откат
`pm2 stop workshop && mv .next .next.failed && mv .next.bak.<ts> .next && pm2 start workshop`.
**НЕ трогать** `/var/lib/workshop/` (там `leads.jsonl` + `whatsapp-link.json`).

## От Александра (один раз)
Открыть нового бота в Telegram и нажать **/start** — иначе бот не сможет отвечать.
