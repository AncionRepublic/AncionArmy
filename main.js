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

// Mobile side-drawer navigation
const burger = document.getElementById('nav-burger');
const navEl = document.querySelector('.nav');
const overlay = document.getElementById('nav-overlay');

function openNav() {
  if (!navEl) return;
  navEl.classList.add('open');
  overlay.classList.add('open');
  burger.setAttribute('aria-expanded', 'true');
}
function closeNav() {
  if (!navEl) return;
  navEl.classList.remove('open');
  overlay.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
}

if (burger && navEl) {
  burger.addEventListener('click', () => {
    if (navEl.classList.contains('open')) closeNav();
    else openNav();
  });
  if (overlay) overlay.addEventListener('click', closeNav);
  navEl.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
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
