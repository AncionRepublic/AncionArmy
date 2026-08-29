/*
 * vote-worker.js
 * -------------
 * Cloudflare Worker — серверная верификация Telegram + отправка голоса на почту.
 * Не использует Google, поэтому НЕТ экрана "Google hasn't verified this app".
 *
 * Развёртывание:
 * 1. https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker.
 * 2. В Secrets добавь: TELEGRAM_BOT_TOKEN = <токен бота от @BotFather>.
 * 3. Создай KV: Workers & Pages -> KV -> Create namespace (напр. "votes"),
 *    в Settings Worker -> Bindings добавь KV namespace с именем VOTES.
 * 4. Вставь код ниже, Deploy. Получишь URL вида https://vote-xxx.workers.dev
 * 5. В vybory.html замени ACTION_URL на этот URL (в action формы).
 *
 * Форма шлёт поля: tg_id, tg_first_name, tg_last_name, tg_username,
 * tg_photo_url, tg_auth_date, tg_hash, party.
 */

async function deliverEmail(url, body, attempts = 5) {
  let lastStatus = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      if (res.ok) return null;
      lastStatus = res.status;
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        continue;
      }
      return 'код ' + res.status;
    } catch (e) {
      lastStatus = 'сбой сети';
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  return lastStatus ? 'код ' + lastStatus : 'неизвестно';
}

export default {
  async fetch(request, env) {
    try {
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
      const cryptoKey = await crypto.subtle.importKey(
        'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
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

      // --- Защита от повторного голосования: 1 голос на 1 Telegram-id ---
      const tgId = form.get('tg_id');
      if (!tgId) {
        return new Response('Не удалось определить пользователя Telegram.', { status: 400 });
      }
      if (env.VOTES) {
        const already = await env.VOTES.get(tgId);
        if (already) {
          return new Response(
            '<h2>Вы уже голосовали</h2><p>Один аккаунт Telegram может отдать голос только один раз.</p>' +
            '<p><a href="https://ancioNrepublic.github.io/AncionArmy/vybory.html">Вернуться</a></p>',
            { status: 409, headers: { 'content-type': 'text/html; charset=utf-8' } }
          );
        }
        await env.VOTES.put(tgId, new Date().toISOString());
      }

      // Верификация пройдена — отправляем письмо.
      // EMAIL_APP_URL (secret) -> надёжный Google Apps Script; иначе Formsubmit.
      const party = form.get('party') || '(не выбрано)';
      const tg = form.get('tg_username') ? '@' + form.get('tg_username') : 'id ' + form.get('tg_id');
      const payload = new URLSearchParams();
      payload.set('party', party);
      payload.set('telegram', tg);
      payload.set('telegram_id', form.get('tg_id') || '');

      const EMAIL_URL = env.EMAIL_APP_URL || 'https://formsubmit.co/ancion.republic.official@gmail.com';
      let emailNote = '';
      const emailErr = await deliverEmail(EMAIL_URL, payload.toString());
      if (emailErr) emailNote = ' (внимание: письмо не отправлено, ' + emailErr + ')';

      return new Response(
        '<h2>Спасибо! Ваш голос учтён.</h2>' +
        '<p>Мы получили ваш выбор: <strong>' + party + '</strong>.' + emailNote + '</p>' +
        '<p><a href="https://ancioNrepublic.github.io/AncionArmy/vybory.html">Вернуться к списку кандидатов</a></p>',
        { headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    } catch (e) {
      return new Response('Worker error: ' + (e && e.message ? e.message : String(e)), {
        status: 500,
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      });
    }
  }
};
