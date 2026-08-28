/*
 * vote-email-apps-script.js
 * -------------------------
 * Минимальный Google Apps Script ТОЛЬКО для отправки письма (без верификации —
 * верификацию Telegram уже делает Cloudflare Worker). Вызывается сервер-to-сервер
 * из Worker, поэтому экран "Google hasn't verified this app" НЕ появляется.
 *
 * Развёртывание:
 * 1. https://script.google.com -> Новый проект -> вставь код ниже.
 * 2. Deploy -> New deployment -> Web app:
 *       Execute as: Me
 *       Who has access: Anyone
 * 3. Скопируй URL вида https://script.google.com/macros/s/AKfyc.../exec
 * 4. В Cloudflare Worker -> Settings -> Variables -> Secrets добавь
 *       EMAIL_APP_URL = <этот URL>
 * 5. Перезалей Worker.
 *
 * Поля, которые шлёт Worker: party, telegram, telegram_id.
 */

function doPost(e) {
  var p = e.parameter;
  var party = p['party'] || '(не выбрано)';
  var tg = p['telegram'] || '(нет)';
  var tgId = p['telegram_id'] || '';

  var body =
    'Новый голос на выборах Республики Анцион 2026\n\n' +
    'Партия: ' + party + '\n' +
    'Telegram: ' + tg + ' (id ' + tgId + ')\n' +
    'Принято: ' + new Date().toISOString() + '\n';

  MailApp.sendEmail(
    'ancion.republic.official@gmail.com',
    'Новый голос — Выборы Анцион 2026',
    body
  );

  return ContentService.createTextOutput('ok');
}

function doGet(e) {
  return ContentService.createTextOutput('email backend');
}
