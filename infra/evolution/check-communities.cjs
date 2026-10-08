// Проверка патча сообществ на подставном сокете и подставном контроллере, без WhatsApp, базы и Redis.
// Запуск из папки клона с наложенным патчем:
//   cd /opt/evolution-src   (или C:\Проекты\_evo\evolution-api)
//   npx tsx /путь/к/infra/evolution/check-communities.cjs
// Что проверяется:
//   1. IQ-запрос создания: нет allow_non_admin_sub_group_creation и create_general_chat, parent только при approvalRequired.
//   2. Поиск вкладки объявлений: признак default_sub_group, единственная подгруппа, метаданные, повторы.
//   3. Перевод ошибок WhatsApp в понятный текст.
//   4. Маршруты /community/* на настоящем Express-роутере: валидация, ?communityJid=, коды ответов.
'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const Module = require('node:module');

const root = process.cwd();
const src = (...p) => path.join(root, 'src', ...p);

// Подмена тяжёлых модулей Evolution (server.module тянет Prisma и Redis, index.router всё приложение).
const calls = [];
const stubController = new Proxy(
  {},
  {
    get: (_, method) => async (instance, data) => {
      calls.push({ method, instance: instance.instanceName, data: JSON.parse(JSON.stringify(data)) });
      return { ok: true, method };
    },
  },
);
const stubs = {
  '@api/server.module': { communityController: stubController },
  '@api/routes/index.router': { HttpStatus: { OK: 200, CREATED: 201, BAD_REQUEST: 400, INTERNAL_SERVER_ERROR: 500 } },
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === './index.router' && parent && /community\.router\.ts$/.test(parent.filename)) {
    request = '@api/routes/index.router';
  }
  if (stubs[request]) return `stub:${request}`;
  return originalResolve.call(this, request, parent, ...rest);
};
const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  const key = request === './index.router' && parent && /community\.router\.ts$/.test(parent.filename) ? '@api/routes/index.router' : request;
  if (stubs[key]) return stubs[key];
  return originalLoad.call(this, request, parent, ...rest);
};

const helpers = require(src('api', 'integrations', 'channel', 'whatsapp', 'community.helpers.ts'));
const { CommunityRouter } = require(src('api', 'routes', 'community.router.ts'));
const { CommunityController } = require(src('api', 'controllers', 'community.controller.ts'));

let passed = 0;
const ok = (name) => {
  passed += 1;
  console.log(`  ok  ${name}`);
};

const node = (tag, attrs = {}, content) => ({ tag, attrs, content });

// ---------- 1. создание ----------
async function checkCreate() {
  let sent;
  const client = {
    query: async (n) => {
      sent = n;
      return node('iq', { type: 'result' }, [node('group', { id: '120363040000000001' })]);
    },
    groupMetadata: async () => ({}),
  };

  const jid = await helpers.createCommunityRaw(client, { subject: 'Вайб-продакшен · эфир 11.10', description: 'Описание', approvalRequired: true });
  assert.equal(jid, '120363040000000001@g.us');
  assert.deepEqual(sent.attrs, { type: 'set', xmlns: 'w:g2', to: '@g.us' });
  const create = sent.content[0];
  assert.equal(create.tag, 'create');
  assert.equal(create.attrs.subject, 'Вайб-продакшен · эфир 11.10');
  const tags = create.content.map((c) => c.tag);
  assert.deepEqual(tags, ['description', 'parent']);
  assert.ok(!tags.includes('allow_non_admin_sub_group_creation'));
  assert.ok(!tags.includes('create_general_chat'));
  assert.deepEqual(create.content[1].attrs, { default_membership_approval_mode: 'request_required' });
  assert.equal(create.content[0].content[0].tag, 'body');
  assert.equal(Buffer.from(create.content[0].content[0].content).toString('utf-8'), 'Описание');
  assert.ok(create.content[0].attrs.id.length === 12);
  ok('create: теги description и parent, без подгрупп от участников и общего чата');

  await helpers.createCommunityRaw(client, { subject: 'X', approvalRequired: false });
  const create2 = sent.content[0];
  assert.deepEqual(create2.content.map((c) => c.tag), ['parent']);
  assert.deepEqual(create2.content[0].attrs, {});
  ok('create: без approvalRequired parent без атрибута, пустое описание не отправляется');

  const broken = { query: async () => node('iq', {}, []), groupMetadata: async () => ({}) };
  await assert.rejects(() => helpers.createCommunityRaw(broken, { subject: 'X' }), (e) => e instanceof helpers.CommunityUserError);
  ok('create: ответ без group даёт понятную ошибку');
}

// ---------- 2. вкладка объявлений ----------
const subGroupsReply = (groups) =>
  node('iq', { type: 'result' }, [node('sub_groups', {}, groups.map(([attrs, tags = []]) => node('group', attrs, tags.map((t) => node(t)))))]);

async function checkAnnouncement() {
  // признак в ответе sub_groups
  let client = {
    query: async () => subGroupsReply([[{ id: '111', subject: 'Общий', size: '3' }], [{ id: '222', subject: 'Объявления', size: '1' }, ['default_sub_group']]]),
    groupMetadata: async () => assert.fail('метаданные не нужны, признак уже есть'),
  };
  let r = await helpers.detectAnnouncement(client, '999@g.us');
  assert.equal(r.announcementJid, '222@g.us');
  assert.equal(r.source, 'sub_groups.default_sub_group');
  assert.equal(r.linkedGroups.length, 2);
  assert.equal(r.linkedGroups[1].isAnnouncement, true);
  assert.equal(r.linkedGroups[1].size, 1);
  ok('announcement: признак default_sub_group в sub_groups');

  // единственная подгруппа
  client = { query: async () => subGroupsReply([[{ id: '333', subject: 'Эфир' }]]), groupMetadata: async () => assert.fail('не нужны') };
  r = await helpers.detectAnnouncement(client, '999@g.us');
  assert.equal(r.announcementJid, '333@g.us');
  assert.equal(r.source, 'single_linked_group');
  ok('announcement: единственная привязанная группа');

  // несколько без признака, ищем через метаданные
  const asked = [];
  client = {
    query: async () => subGroupsReply([[{ id: '444' }], [{ id: '555' }]]),
    groupMetadata: async (jid) => {
      asked.push(jid);
      return { isCommunityAnnounce: jid === '555@g.us' };
    },
  };
  r = await helpers.detectAnnouncement(client, '999@g.us');
  assert.equal(r.announcementJid, '555@g.us');
  assert.equal(r.source, 'group_metadata.isCommunityAnnounce');
  assert.deepEqual(asked, ['444@g.us', '555@g.us']);
  ok('announcement: поиск через groupMetadata.isCommunityAnnounce');

  // пустой список с повтором
  let n = 0;
  client = {
    query: async () => (n++ < 2 ? subGroupsReply([]) : subGroupsReply([[{ id: '666' }]])),
    groupMetadata: async () => ({}),
  };
  r = await helpers.waitForAnnouncement(client, '999@g.us', { attempts: 4, delayMs: 1 });
  assert.equal(r.announcementJid, '666@g.us');
  assert.equal(n, 3);
  ok('announcement: повторы, пока WhatsApp не отдаст подгруппу');

  // так и не нашлась
  client = { query: async () => subGroupsReply([]), groupMetadata: async () => ({}) };
  r = await helpers.waitForAnnouncement(client, '999@g.us', { attempts: 2, delayMs: 1 });
  assert.equal(r.announcementJid, null);
  ok('announcement: не нашлась, announcementJid = null без исключения');

  // ошибка запроса на всех попытках уходит наверх
  client = { query: async () => { throw new Error('boom'); }, groupMetadata: async () => ({}) };
  await assert.rejects(() => helpers.waitForAnnouncement(client, '999@g.us', { attempts: 2, delayMs: 1 }), /boom/);
  ok('announcement: ошибка запроса не теряется');
}

// ---------- 3. ошибки ----------
function boom(message, code) {
  const e = new Error(message);
  e.data = code;
  return e;
}
function checkErrors() {
  assert.match(helpers.describeWaError(boom('forbidden', 403)).reason, /нет прав/);
  assert.match(helpers.describeWaError(boom('not-authorized', 401)).reason, /нет прав/);
  assert.match(helpers.describeWaError(boom('item-not-found', 404)).reason, /не найден/);
  assert.match(helpers.describeWaError(boom('rate-overlimit', 429)).reason, /частоту/);
  assert.match(helpers.describeWaError(boom('conflict', 409)).reason, /Конфликт/);
  assert.match(helpers.describeWaError(boom('bad-request', 400)).reason, /не принял/);
  assert.match(helpers.describeWaError(boom('Timed Out', 408)).reason, /таймаут/);
  assert.match(helpers.describeWaError(boom('Connection Closed')).reason, /подключения/);
  assert.match(helpers.describeWaError(new TypeError("Cannot read properties of undefined (reading 'query')")).reason, /подключения/);
  assert.equal(helpers.describeWaError(boom('forbidden', 403)).raw, 'forbidden (код 403)');
  assert.deepEqual(helpers.describeWaError(new helpers.CommunityUserError('свой текст')), { reason: 'свой текст', raw: '' });
  ok('errors: коды и тексты WhatsApp переводятся в понятную причину');

  assert.deepEqual(
    helpers.normalizeRequestParticipants(['77001234567@s.whatsapp.net', '123456789@lid', '77001234567'], (v) => `${v}@jid`),
    ['77001234567@s.whatsapp.net', '123456789@lid', '77001234567@jid'],
  );
  ok('requests: JID из списка заявок идут как есть, голые номера превращаются в JID');
}

// ---------- 3б. контроллер: инстанс и подключение ----------
async function checkController() {
  const baileys = { createCommunity: async (d) => ({ got: d }), communityInfo: async () => ({ info: true }), connectionStatus: { state: 'open' } };
  const waMonitor = {
    waInstances: {
      good: baileys,
      closed: { ...baileys, connectionStatus: { state: 'close' } },
      business: { connectionStatus: { state: 'open' } },
    },
  };
  const controller = new CommunityController(waMonitor);
  const status = async (promise) => promise.then(() => 200, (e) => e.status);

  assert.deepEqual(await controller.createCommunity({ instanceName: 'good' }, { subject: 'X' }), { got: { subject: 'X' } });
  assert.equal(await status(controller.createCommunity({ instanceName: 'nope' }, { subject: 'X' })), 400);
  assert.equal(await status(controller.createCommunity({ instanceName: 'business' }, { subject: 'X' })), 400);
  assert.equal(await status(controller.createCommunity({ instanceName: 'closed' }, { subject: 'X' })), 400);
  ok('controller: рабочий инстанс проходит, неизвестный, не Baileys и отключённый дают 400');
}

// ---------- 4. маршруты ----------
function request(port, method, url, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : Buffer.from(JSON.stringify(body));
    const req = http.request(
      { host: '127.0.0.1', port, method, path: url, headers: data ? { 'content-type': 'application/json', 'content-length': data.length } : {} },
      (res) => {
        let text = '';
        res.on('data', (c) => (text += c));
        res.on('end', () => resolve({ status: res.statusCode, json: text ? JSON.parse(text) : null }));
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function checkRoutes() {
  const express = require(path.join(root, 'node_modules', 'express'));
  const app = express();
  app.use(express.json());
  let guardHits = 0;
  const guard = (req, res, next) => {
    guardHits += 1;
    next();
  };
  app.use('/community', new CommunityRouter(guard).router);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ status: err.status || 500, error: err.error, response: { message: err.message } });
  });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const J = '120363040000000001@g.us';

  try {
    let r = await request(port, 'POST', '/community/create/test', { subject: 'Эфир', description: 'Д', approvalRequired: true });
    assert.equal(r.status, 201);
    assert.deepEqual(calls.pop(), { method: 'createCommunity', instance: 'test', data: { subject: 'Эфир', description: 'Д', approvalRequired: true } });
    ok('route: POST create -> 201, данные дошли до контроллера');

    r = await request(port, 'POST', '/community/create/test', { description: 'без названия' });
    assert.equal(r.status, 400);
    r = await request(port, 'POST', '/community/create/test', { subject: '   ' });
    assert.equal(r.status, 400);
    r = await request(port, 'POST', '/community/create/test', { subject: 'X', approvalRequired: 'yes' });
    assert.equal(r.status, 400);
    ok('route: create без названия, с пустым названием и с неверным approvalRequired -> 400');

    r = await request(port, 'GET', `/community/info/test?communityJid=${J}&participants=true`);
    assert.equal(r.status, 200);
    let c = calls.pop();
    assert.equal(c.method, 'communityInfo');
    assert.equal(c.data.communityJid, J);
    assert.equal(c.data.participants, 'true');
    r = await request(port, 'GET', '/community/info/test?communityJid=120363040000000001');
    assert.equal(r.status, 200);
    assert.equal(calls.pop().data.communityJid, J);
    r = await request(port, 'GET', '/community/info/test');
    assert.equal(r.status, 400);
    r = await request(port, 'GET', '/community/info/test?communityJid=abc@g.us');
    assert.equal(r.status, 400);
    ok('route: GET info, ?communityJid= с суффиксом и без, без JID и с кривым JID -> 400');

    r = await request(port, 'GET', `/community/inviteCode/test?communityJid=${J}`);
    assert.equal(r.status, 200);
    assert.equal(calls.pop().method, 'inviteCode');
    r = await request(port, 'POST', `/community/revokeInvite/test?communityJid=${J}`, {});
    assert.equal(r.status, 201);
    assert.equal(calls.pop().method, 'revokeInvite');
    ok('route: GET inviteCode и POST revokeInvite');

    for (const action of ['announcement', 'not_announcement', 'locked', 'unlocked']) {
      r = await request(port, 'POST', `/community/updateSetting/test?communityJid=${J}`, { action });
      assert.equal(r.status, 201);
      c = calls.pop();
      assert.deepEqual([c.method, c.data.communityJid, c.data.action], ['updateSetting', J, action]);
    }
    r = await request(port, 'POST', `/community/updateSetting/test?communityJid=${J}`, { action: 'boom' });
    assert.equal(r.status, 400);
    ok('route: POST updateSetting, 4 действия и неверное -> 400');

    for (const mode of ['admin_add', 'all_member_add']) {
      r = await request(port, 'POST', `/community/memberAddMode/test?communityJid=${J}`, { mode });
      assert.equal(r.status, 201);
      assert.equal(calls.pop().data.mode, mode);
    }
    r = await request(port, 'POST', `/community/memberAddMode/test?communityJid=${J}`, { mode: 'on' });
    assert.equal(r.status, 400);
    for (const mode of ['on', 'off']) {
      r = await request(port, 'POST', `/community/joinApprovalMode/test?communityJid=${J}`, { mode });
      assert.equal(r.status, 201);
      assert.equal(calls.pop().data.mode, mode);
    }
    r = await request(port, 'POST', `/community/joinApprovalMode/test?communityJid=${J}`, { mode: 'admin_add' });
    assert.equal(r.status, 400);
    ok('route: POST memberAddMode и joinApprovalMode, неверные режимы -> 400');

    r = await request(port, 'GET', `/community/requests/test?communityJid=${J}`);
    assert.equal(r.status, 200);
    assert.equal(calls.pop().method, 'requests');
    r = await request(port, 'POST', `/community/requests/test?communityJid=${J}`, { action: 'approve', participants: ['77001234567@s.whatsapp.net', '1234567890@lid'] });
    assert.equal(r.status, 201);
    c = calls.pop();
    assert.equal(c.method, 'requestsUpdate');
    assert.deepEqual(c.data.participants, ['77001234567@s.whatsapp.net', '1234567890@lid']);
    r = await request(port, 'POST', `/community/requests/test?communityJid=${J}`, { action: 'approve', participants: [] });
    assert.equal(r.status, 400);
    r = await request(port, 'POST', `/community/requests/test?communityJid=${J}`, { action: 'ban', participants: ['77001234567@s.whatsapp.net'] });
    assert.equal(r.status, 400);
    ok('route: GET requests, POST requests (approve), пустой список и неверное действие -> 400');

    assert.ok(guardHits > 0);
    ok('route: guards подключены ко всем маршрутам');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

(async () => {
  await checkCreate();
  await checkAnnouncement();
  checkErrors();
  await checkController();
  await checkRoutes();
  console.log(`\nВсё в порядке: ${passed} проверок`);
  process.exit(0);
})().catch((e) => {
  console.error('\nПРОВАЛ:', e);
  process.exit(1);
});
