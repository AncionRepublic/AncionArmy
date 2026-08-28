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
  const status = document.getElementById('tg-status');
  const submit = document.getElementById('vote-submit');
  if (!user) return;
  const raw = {
    tg_id: user.id,
    tg_first_name: user.first_name,
    tg_last_name: user.last_name,
    tg_username: user.username,
    tg_photo_url: user.photo_url,
    tg_auth_date: user.auth_date,
    tg_hash: user.hash
  };
  Object.keys(raw).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = raw[id] || '';
  });
  if (status) {
    status.textContent = 'Подтверждено через Telegram: ' + (user.first_name || user.username || user.id);
    status.style.color = 'var(--accent)';
  }
  if (submit) submit.disabled = false;
}
