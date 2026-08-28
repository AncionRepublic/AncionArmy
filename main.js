const toggle = document.querySelector('.nav-toggle');
const menu = document.getElementById('more-menu');

if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = !menu.hasAttribute('hidden');
    if (open) {
      menu.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      menu.removeAttribute('hidden');
      toggle.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Elections: Telegram Login widget callback
function onTelegramAuth(user) {
  const field = document.getElementById('telegram_user');
  const status = document.getElementById('tg-status');
  const submit = document.getElementById('vote-submit');
  if (!field || !user) return;
  field.value = user.username
    ? '@' + user.username + ' (id ' + user.id + ')'
    : 'id ' + user.id;
  if (status) {
    status.textContent = 'Подтверждено через Telegram: ' + (user.first_name || user.username || user.id);
    status.style.color = 'var(--accent)';
  }
  if (submit) submit.disabled = false;
}
