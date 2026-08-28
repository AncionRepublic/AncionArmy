/*
 * vote-apps-script.js
 * --------------------
 * Google Apps Script (серверная часть) для честной верификации Telegram
 * и приёма голосов с GitHub Pages.
 *
 * Как использовать:
 * 1. @BotFather -> создайте бота, получите BOT_TOKEN.
 * 2. @BotFather -> /setdomain для этого бота, укажите: anciorepublic.github.io
 * 3. https://script.google.com -> Новый проект -> вставьте код ниже.
 * 4. В редакторе: шестерёнка -> Project Settings -> Script Properties ->
 *    добавьте BOT_TOKEN = <токен бота>  (опц. SHEET_ID = <id таблицы для лога>).
 * 5. Deploy -> New deployment -> Web app:
 *       Execute as: Me
 *       Who has access: Anyone
 * 6. Скопируйте URL вида
 *       https://script.google.com/macros/s/AKfyc.../exec
 *    и вставьте его в vybory.html вместо ACTION_URL (в action формы).
 *
 * Поля, которые приходит от виджета Telegram Login:
 *   id, first_name, last_name, username, photo_url, auth_date, hash
 * Форма отправляет их с префиксом tg_ (tg_id, tg_first_name, ...).
 */

function doPost(e) {
  var p = e.parameter;
  var BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('8881312089:AAG3928rzXr8SBMl4H95F1UrpXIjMD25y7k');

  if (!BOT_TOKEN) {
    return HtmlService.createHtmlOutput('Ошибка сервера: не задан BOT_TOKEN.');
  }

  // Собираем только те поля, что прислал Telegram
  var fields = ['auth_date', 'first_name', 'id', 'last_name', 'photo_url', 'username'];
  var data = {};
  fields.forEach(function (f) {
    var v = p['tg_' + f];
    if (v) data[f] = v;
  });

  // data_check_string = "key=value\n..." отсортированный по ключу
  var sortedKeys = Object.keys(data).sort();
  var checkString = sortedKeys.map(function (k) {
    return k + '=' + data[k];
  }).join('\n');

  // secret_key = SHA256(BOT_TOKEN)  ->  hash = HMAC_SHA256(secret_key, data_check_string)
  var secretKey = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, BOT_TOKEN);
  var hmac = Utilities.computeHmacSha256(secretKey, checkString);
  var calcHash = hmac.map(function (b) {
    return ('0' + ((b + 256) % 256).toString(16)).slice(-2);
  }).join('');

  if (calcHash !== p['tg_hash']) {
    return HtmlService.createHtmlOutput(
      '<h2>Ошибка верификации Telegram</h2>' +
      '<p>Голос не принят. Попробуйте войти через Telegram ещё раз.</p>' +
      '<p><a href="https://anciorepublic.github.io/AncionArmy/vybory.html">Вернуться</a></p>'
    );
  }

  // Верификация пройдена — формируем и отправляем голос
  var party = p['party'] || '(не выбрано)';
  var tgLabel = p['tg_username'] ? '@' + p['tg_username'] : ('id ' + p['tg_id']);
  var body =
    'Новый голос на выборах Республики Анцион 2026\n\n' +
    'Партия: ' + party + '\n' +
    'Telegram: ' + tgLabel + ' (id ' + p['tg_id'] + ')\n' +
    'Время входа (auth_date): ' + p['tg_auth_date'] + '\n' +
    'Принято: ' + new Date().toISOString() + '\n';

  MailApp.sendEmail(
    'ancion.republic.official@gmail.com',
    'Новый голос — Выборы Анцион 2026',
    body
  );

  // (опционально) лог в Google Таблицу для подсчёта
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (sheetId) {
      var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
      sheet.appendRow([new Date(), party, tgLabel, p['tg_id'], p['tg_auth_date']]);
    }
  } catch (err) { /* лог не критичен */ }

  return HtmlService.createHtmlOutput(
    '<h2>Спасибо! Ваш голос учтён.</h2>' +
    '<p>Мы получили ваш выбор: <strong>' + party + '</strong>.</p>' +
    '<p><a href="https://anciorepublic.github.io/AncionArmy/vybory.html">Вернуться к списку кандидатов</a></p>'
  );
}

function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<h2>Бэкенд голосования Республики Анcion</h2>' +
    '<p>Отправляйте данные POST-ом из формы на странице выборов.</p>'
  );
}
