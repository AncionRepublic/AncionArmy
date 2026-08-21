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
