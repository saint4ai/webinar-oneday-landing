# Факты для новых раздаток (Higgsfield, Kling, Seedance, доска раскадровки, TikTok и YouTube, Google Таблица)

Сбор 10.10.2026. Статус: что подтверждено первоисточником, что поправлено проверкой, что нельзя писать. Пополнять по мере проверок (фактчекеры сессии «Вебинар» и «Монтаж Reels»).

## Higgsfield
- Подключение к Claude Code: официально рекомендуют CLI со скиллами, не MCP. `npm i -g @higgsfield/cli` → `higgsfield auth login` (вход через браузер, ключ не нужен) → `npx skills add higgsfield-ai/skills`. Источник: higgsfield.ai/creator-hub/help-center/integrations/how-do-i-connect-higgsfield-to-ai-agent (изм. 24.09.2026). Нужна активная платная подписка, генерации списываются кредитами.
- Скиллы (поправка «Монтаж Reels», проверено по GitHub): higgsfield-generate, higgsfield-soul-id, higgsfield-product-photoshoot, плюс brandkit, marketplace-cards, video-explainer, websites, youtube-thumbnail.
- MCP для Claude Desktop: Settings → Connectors → https://mcp.higgsfield.ai/mcp.
- Модели в CLI (github.com/higgsfield-ai/cli): видео kling3_0, kling3_0_turbo, kling2_6, seedance_2_5, seedance_2_0, seedance_2_0_mini, seedance1_5, veo3_1, wan2_7; картинки nano_banana_2 (это Nano Banana Pro), nano_banana_flash (это Nano Banana 2), seedream_v4_5, kling_omni_image. Ловушка имён nano_banana_2 / flash в раздатку.
- Синхронизации губ в CLI Higgsfield нет (только озвучка и замена голоса в видео). Поправка «Монтаж Reels».
- Тарифы (блог Higgsfield 15.09.2026): Starter $15/200 кредитов, Plus $49/1000, Ultra $129/3000; Kling 3.0 8 с 1080p = 20 кредитов, Seedance 2.5 8 с 1080p = 72 кредита. Ждёт проверки фактчекером.
- Оплата: «картой через Stripe» (марки карт в Terms не указаны, поправка). Казахстан не упомянут.
- Terms: §5.3 чужое лицо и голос только с согласия человека (верно). §5.5 раскрывать, что контент ИИ, «где этого требует закон» (не «всегда», поправка).

## Kling
- Официальный CLI `@klingai/cli-global` настоящий (npm). `kling login` через OAuth не проверен: не писать. Репозиторий klingai-tech/skills не официальный: не ставить в раздатку.
- Kling 3.0: 3–15 с, до 4K. Формат 9:16 официальная страница возможностей не подтверждает: не писать как факт.
- Подписка Standard $6,99 только первый месяц, дальше $8,80.
- На официальной странице Kling есть Lip Sync («текст или аудио двигает губы») и Avatar («видео диктора из одного фото»). Точные шаги проверяет «Монтаж Reels», основной вариант гайда «говорящее фото» сообщит он.

## Zernio, TikTok, YouTube, пробные рилсы
- Пробные рилсы через Zernio: trialParams.graduationStrategy MANUAL или SS_PERFORMANCE (сам выводит к подписчикам, если хорошо идёт). docs.zernio.com/platforms/instagram. Instagram решает автоперевод по первым 72 часам (creators.instagram.com/blog/instagram-trial-reels).
- TikTok через Zernio: аккаунты Creator и Business; 15 видео за 24 ч; через TikTok for Business только Public, иначе черновик (draft). docs.zernio.com/platforms/tiktok. Ждёт проверки.
- YouTube Shorts: вертикальное до 3 минут; свою обложку для Shorts через API не поставить. docs.zernio.com/platforms/youtube. Ждёт проверки.
- Цены Zernio: 2 аккаунта бесплатно, с 3-го $6 в месяц. docs.zernio.com/pricing.

## Доска раскадровки
- Инструмент `C:\Проекты\claude-setups\storyboard\` (README, INSTALL). В курсе: `docs/guides/storyboard.md` («Монтаж Reels»). Скриншоты: `docs/guides/html/img/board/` (снимает исполнитель под замком). Режим «Сдвиг» ещё в разработке, скриншот позже.
- Remotion Studio и Storybook в раздатке не упоминать (поправка Александра).

## Файлы курса, на которые опираться (пишет «Монтаж Reels»)
docs/guides/higgsfield.md, docs/guides/higgsfield-talking-offer.md, docs/guides/storyboard.md, docs/guides/best-time.md, docs/guides/google-sheets-leads.md.

## «Говорящее фото»: итог поиска (10.10.2026, проверить фактчекером перед текстом)
- Seedance 2.x официально НЕ принимает фото и видео реальных людей (BytePlus LAS docs: «does not support direct upload of images and videos containing real faces», обход только по белому списку для проверенных клиентов). Jimeng в Китае с 09.02.2026 запретил похожие на реальных людей референсы. Значит Seedance для лица реального человека не годится; для фона и стройки годится (режим «первый и последний кадр», 9:16 есть).
- Русской речи в списках языков Seedance 1.5 и Kling 3.0 (своя генерация звука) нет. Поэтому голос делаем в ElevenLabs (русский есть в v4, v3, Multilingual v2) и подаём готовый mp3.
- Kling AI Avatar 2.0: фото + ваш аудиофайл, до 5 минут, 8 кредитов/с (Pro), 4 (Standard). kling.ai/quickstart/kling-ai-avatar-2-user-guide. Kling Lip Sync: на клипе Kling с лицом анфас, загруженное аудио на любом языке. kling.ai/quickstart/ai-lip-sync-guide, kling.ai/feature/lip-sync.
- ElevenLabs: мгновенный клон голоса с тарифа Starter $6/мес, 1–2 минуты чистой записи, подтверждение права на голос; профессиональный клон только своего голоса. Официальный MCP https://api.elevenlabs.io/v1/mcp (Settings → Connectors → ElevenLabs), озвучку умеет, клон голоса в описании не упомянут.
- Маркировка ИИ обязательна: YouTube (Studio → Attributes → AI use), TikTok (метка ИИ), Instagram/Facebook (метка для фотореалистичного видео). Лицо и голос только свои или с явного согласия (Kling, Higgsfield, ElevenLabs).
- Варианты сценария: А) голос ElevenLabs → говорящая голова Kling Avatar из своего фото → стройка Seedance или Kling отдельно → наложение в монтаже; Б) запасной сценарий Александра: человек снимает себя на видео с петличкой, ученик добавляет анимацию за спиной. Б проще и без ограничений на лица.

## Сценарий Александра (10.10, уточнение): своё снятое видео + сгенерированный фон за спиной, без lip-sync
Официальные материалы Higgsfield под это (найдено 10.10.2026, перед текстом проверить фактчекером):
- Страница «AI Video Background Changer» https://higgsfield.ai/ai-video-background-changer : загрузить видео, удалить или заменить фон через Kling 3.0 Omni Edit или FLUX 3 Video Edit.
- Справка «How to Use Kling on Higgsfield» https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-kling (обн. 09.09.2026): Omni Edit принимает клипы 3–10 с в 1080p.
- Kling O1 / 3.0 Omni: «Modify background», видео на вход 3–10 с, до 200 МБ, до 2K. https://kling.ai/quickstart/klingai-video-o1-user-guide , https://kling.ai/quickstart/klingai-video-3-omni-model-user-guide
- Higgsfield Genjutsu (31.08.2026): меняет локацию снятого на телефон видео, клип 4–30 с, выход до 1080p. https://higgsfield.ai/blog/higgsfield-genjutsu
- Официальные видео канала Higgsfield AI: «I Added Insane AI VFX to Real Footage in 4K (Seedance 2.0)» https://www.youtube.com/watch?v=Yte-UGhYkPQ (11:06, 29.06.2026, глава «Swapping the world» с 1:59); «I Mixed AI With Real Footage! (Premiere Pro + Higgsfield AI)» https://www.youtube.com/watch?v=DvRGamF7uRo (4:39, 05.06.2026, «Background Change» с 2:31); Shorts «Change Your Entire Video With One Prompt» https://www.youtube.com/watch?v=biDzR-ExEu8 (08.10.2026, Genjutsu).
- Противоречие: Higgsfield показывает Seedance 2.0 на реальной съёмке, а BytePlus для прямого API запрещает реальные лица. Для ученика опираться на Kling Omni Edit / Genjutsu и проверить на коротком клипе.
- Ограничение длины: правка 3–10 с (Omni Edit) или 4–30 с (Genjutsu), рилс 45 с режется на куски, склейка в монтаже. Звук и губы остаются из оригинала (наш вывод: проверить, сохраняется ли исходная дорожка или её подкладывать заново в монтаже).
- Запасной путь без генерации по человеку: вырезать человека локально (RVM) + фон-клип Seedance/Kling 9:16 по ТЗ + наложение в монтаже.
