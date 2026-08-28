/*
 * vote-worker.js
 * -------------
 * Cloudflare Worker — серверная верификация Telegram + отправка голоса на почту.
 * Не использует Google, поэтому НЕТ экрана "Google hasn't verified this app".
 *
 * Развёртывание:
 * 1. https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker.
 * 2. В Secrets добавь: TELEGRAM_BOT_TOKEN = <токен бота от @BotFather>.
 * 3. Вставь код ниже, Deploy. Получишь URL вида https://vote-xxx.workers.dev
 * 4. В vybory.html замени ACTION_URL на этот URL (в action формы).
 *
 * Форма шлёт поля: tg_id, tg_first_name, tg_last_name, tg_username,
 * tg_photo_url, tg_auth_date, tg_hash, party.
 */

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response(
        '<h2>Бэкенд голосования Республики Анцион</h2><p>POST-запросы принимаются только из формы выборов.</p>',
        { headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    }

    let form;
    try {
      form = await request.formData();
    } catch (e) {
      return new Response('Bad request', { status: 400 });
    }

    const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) return new Response('Server error: token missing', { status: 500 });

    // Собираем только те поля, что прислал Telegram
    const fields = ['auth_date', 'first_name', 'id', 'last_name', 'photo_url', 'username'];
    const data = {};
    for (const f of fields) {
      const v = form.get('tg_' + f);
      if (v) data[f] = v;
    }

    // data_check_string = "key=value\n..." отсортированный по ключу
    const checkString = Object.keys(data).sort()
      .map((k) => k + '=' + data[k])
      .join('\n');

    // secret_key = SHA256(BOT_TOKEN); hash = HMAC_SHA256(secret_key, data_check_string)
    const key = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(BOT_TOKEN));
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(checkString));
    const calcHash = [...new Uint8Array(sig)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (calcHash !== form.get('tg_hash')) {
      return new Response(
        '<h2>Ошибка верификации Telegram</h2><p>Голос не принят. Войдите через Telegram ещё раз.</p>' +
        '<p><a href="https://ancioNrepublic.github.io/AncionArmy/vybory.html">Вернуться</a></p>',
        { status: 403, headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    }

    // Верификация пройдена — отправляем письмо через Formsubmit (без прав Google)
    const party = form.get('party') || '(не выбрано)';
    const tg = form.get('tg_username') ? '@' + form.get('tg_username') : 'id ' + form.get('tg_id');
    const payload = new URLSearchParams();
    payload.set('_subject', 'Новый голос — Выборы Анцион 2026');
    payload.set('party', party);
    payload.set('telegram', tg);
    payload.set('telegram_id', form.get('tg_id') || '');
    payload.set('_captcha', 'false');

    await fetch('https://formsubmit.co/ancion.republic.official@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString()
    });

    return new Response(
      '<h2>Спасибо! Ваш голос учтён.</h2>' +
      '<p>Мы получили ваш выбор: <strong>' + party + '</strong>.</p>' +
      '<p><a href="https://ancioNrepublic.github.io/AncionArmy/vybory.html">Вернуться к списку кандидатов</a></p>',
      { headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }
};
