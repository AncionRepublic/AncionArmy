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

// Randomize party order (candidate cards + vote options) on each page load
(function randomizeParties() {
  const content = document.querySelector('.content');
  const voteSection = document.getElementById('vote');
  const fieldset = document.querySelector('.party-choices');
  const cards = Array.from(document.querySelectorAll('.candidate-card'));
  const opts = fieldset ? Array.from(fieldset.querySelectorAll('.party-option')) : [];
  if (!content || !voteSection || cards.length < 2) return;

  const perm = cards.map((_, i) => i);
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }

  const frag = document.createDocumentFragment();
  perm.forEach((i) => frag.appendChild(cards[i]));
  content.insertBefore(frag, voteSection);

  if (fieldset) {
    const frag2 = document.createDocumentFragment();
    perm.forEach((i) => frag2.appendChild(opts[i]));
    fieldset.appendChild(frag2);
  }
})();

// Client-side hint: disable form if this browser already voted (real guard is server-side)
(function voteGuard() {
  const form = document.getElementById('vote-form');
  if (!form) return;
  const voted = (function () { try { return localStorage.getItem('ancion_voted'); } catch (e) { return null; } })();
  if (voted) {
    form.querySelectorAll('input, button').forEach((el) => { el.disabled = true; });
    const note = document.createElement('p');
    note.className = 'tg-hint';
    note.style.color = 'var(--accent)';
    note.textContent = 'Вы уже проголосовали. Повторное голосование невозможно.';
    form.parentNode.insertBefore(note, form);
  }
  form.addEventListener('submit', () => {
    try { localStorage.setItem('ancion_voted', voted || '1'); } catch (e) {}
  });
})();
