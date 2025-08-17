(function () {
  const esc = (s) => String(s ?? '').replace(/[&<>\\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const HEX = (n) => n.toString(16).padStart(2, '0');
  function hexToRgb(h) { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h || ''); return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 255, g: 255, b: 255 }; }
  function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); const r = Math.round(A.r * (1 - t) + B.r * t), g = Math.round(A.g * (1 - t) + B.g * t), b2 = Math.round(A.b * (1 - t) + B.b * t); return `#${HEX(r)}${HEX(g)}${HEX(b2)}`; }

  async function loadContent() {
    const res = await fetch('data/content.json', { cache: 'no-store' });
    return res.ok ? res.json() : {};
  }

  function applyBrand(brand = {}) {
    const root = document.documentElement;
    const primary = brand.primary || getComputedStyle(root).getPropertyValue('--brand').trim() || '#6B3F18';
    const accent = brand.accent || getComputedStyle(root).getPropertyValue('--accent').trim() || '#22C55E';
    const bg = brand.bg || getComputedStyle(root).getPropertyValue('--bg').trim() || '#EAF7F1';
    root.style.setProperty('--brand', primary);
    root.style.setProperty('--brand-dark', primary);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--bg', bg);
    const card = mix(bg, accent, 0.08);
    const border = mix(card, accent, 0.15);
    root.style.setProperty('--card', card);
    root.style.setProperty('--card-border', border);
  }

  function buildHeader(d) {
    const header = document.querySelector('header.site-header');
    if (!header) return;
    const menu = header.querySelector('#site-menu');
    const logoEl = header.querySelector('#logo');
    const nameEl = header.querySelector('#siteName');
    if (d.site?.logo && logoEl) logoEl.src = d.site.logo;
    if (d.site?.name && nameEl) nameEl.textContent = d.site.name;

    const links = [
      { label: 'Home', href: 'index.html' },
      { label: 'Programmes', href: 'programmes.html' },
      { label: 'Get involved', href: 'get-involved.html' },
      { label: 'Gallery', href: 'gallery.html' },
      { label: 'Contact', href: 'contact.html' }
    ];
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (menu) {
      menu.innerHTML = links.map(l => {
        const active = (here === l.href.toLowerCase() || (here === '' && l.href === 'index.html')) ? 'active' : '';
        return `<a class="${active}" href="${l.href}">${esc(l.label)}</a>`;
      }).join('');
    }

    const toggle = header.querySelector('.menu-toggle');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? 'Close' : 'Menu';
      });
    }
  }

  function buildFooter(d) {
    const y = document.getElementById('year');
    const fn = document.getElementById('footerName');
    const sc = document.getElementById('scio');
    const os = document.getElementById('oscrBadge');
    if (y) y.textContent = new Date().getFullYear();
    if (fn && d.site?.name) fn.textContent = d.site.name;
    if (sc && d.legal?.scio) sc.textContent = d.legal.scio;
    if (os && d.legal?.oscr_badge) os.src = d.legal.oscr_badge;
  }

  // Slideshow helpers (shared)
  function initSlideshow(id, images, { interval = 4000 } = {}) {
    const root = document.getElementById(id);
    if (!root || !images?.length) return;
    const slidesEl = root.querySelector('.slides');
    const dotsEl = root.querySelector('.dots');
    if (!slidesEl || !dotsEl) return;

    slidesEl.innerHTML = images.map((g, i) => `
      <div class="slide ${i === 0 ? 'active' : ''}">
        <img src="${esc(g.src)}" alt="${esc(g.alt || 'Photo')}" loading="lazy"/>
        ${g.caption ? `<div class="caption">${esc(g.caption)}</div>` : ''}
      </div>`).join('');
    dotsEl.innerHTML = images.map((_, i) => `<button class="dot ${i === 0 ? 'active' : ''}" aria-label="Go to slide ${i + 1}"></button>`).join('');

    const slides = root.querySelectorAll('.slide');
    const dots = root.querySelectorAll('.dot');
    const prev = root.querySelector('[data-prev]');
    const next = root.querySelector('[data-next]');
    let idx = 0, timer = null;

    const render = () => { slides.forEach((s, i) => s.classList.toggle('active', i === idx)); dots.forEach((d, i) => d.classList.toggle('active', i === idx)); };
    const go = n => { idx = (n + images.length) % images.length; render(); };
    const start = () => { stop(); timer = setInterval(() => go(idx + 1), interval); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };

    prev?.addEventListener('click', () => { go(idx - 1); start(); });
    next?.addEventListener('click', () => { go(idx + 1); start(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { idx = i; start(); }));
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    render(); start();
  }

  // Export helpers
  window.SITE = { esc, loadContent, applyBrand, buildHeader, buildFooter, initSlideshow };

  // Auto init header/footer + brand on every page
  document.addEventListener('DOMContentLoaded', async () => {
    const d = await loadContent();
    window.__SITE__ = d;
    applyBrand(d.site?.brand || {});
    buildHeader(d);
    buildFooter(d);
  });
})();


