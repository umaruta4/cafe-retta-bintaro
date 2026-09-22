(() => {
  'use strict';
  // Native dialog supplies modal focus containment and Escape support.
  const viewer = document.createElement('dialog');
  viewer.className = 'viewer';
  viewer.setAttribute('aria-labelledby', 'viewer-title');
  viewer.innerHTML = `
    <div class="viewer-shell">
      <header class="viewer-header"><h2 id="viewer-title"></h2><button type="button" id="viewer-close" autofocus>Tutup ×</button></header>
      <div class="viewer-toolbar" role="group" aria-label="Ukuran gambar menu" hidden>
        <button type="button" data-zoom="out" aria-label="Perkecil">−</button>
        <button type="button" data-zoom="in" aria-label="Perbesar">+</button>
        <button type="button" data-zoom="fit">Pas layar</button>
        <button type="button" data-zoom="original">Ukuran asli</button>
        <span id="viewer-scale" role="status"></span>
      </div>
      <div class="viewer-pan" tabindex="0" role="region" aria-label="Gambar; geser untuk melihat detail"><img id="viewer-image" alt="" /></div>
      <div class="viewer-footer"><p id="viewer-hint"></p><a id="viewer-original" target="_blank" rel="noopener noreferrer">Buka gambar asli ↗</a><a id="viewer-download" download>Unduh gambar</a></div>
    </div>`;
  document.body.append(viewer);
  const image = viewer.querySelector('#viewer-image');
  const pan = viewer.querySelector('.viewer-pan');
  const toolbar = viewer.querySelector('.viewer-toolbar');
  let opener;
  let zoom = 1;
  let mode = 'fit';

  function sizeImage() {
    if (!viewer.open || !viewer.classList.contains('is-menu') || !image.naturalWidth) return;
    const fit = Math.min(1, pan.clientWidth / image.naturalWidth);
    if (mode === 'fit') zoom = fit;
    if (mode === 'original') zoom = 1;
    zoom = Math.max(fit, Math.min(3, zoom));
    image.style.width = `${Math.round(image.naturalWidth * zoom)}px`;
    viewer.querySelector('#viewer-scale').textContent = `${Math.round(zoom * 100)}%`;
    viewer.querySelector('[data-zoom="out"]').disabled = zoom <= fit;
    viewer.querySelector('[data-zoom="in"]').disabled = zoom >= 3;
  }
  image.addEventListener('load', sizeImage);
  window.addEventListener('resize', sizeImage);
  toolbar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-zoom]');
    if (!button) return;
    mode = button.dataset.zoom;
    if (mode === 'in') zoom *= 1.5;
    if (mode === 'out') zoom /= 1.5;
    sizeImage();
    if (mode === 'fit') pan.scrollTo(0, 0);
  });
  function openImage(src, title, trigger, isMenu = false) {
    opener = trigger;
    mode = 'fit';
    zoom = 1;
    viewer.classList.toggle('is-menu', isMenu);
    toolbar.hidden = !isMenu;
    viewer.querySelector('#viewer-title').textContent = title;
    viewer.querySelector('#viewer-hint').textContent = isMenu
      ? 'Perbesar atau pilih Ukuran asli, lalu geser horizontal / vertikal. Keyboard: fokuskan gambar dan gunakan tombol panah.'
      : 'Deskripsi visual foto, bukan nama resmi produk. Lihat menu resmi untuk nama dan harga.';
    image.style.width = '';
    image.alt = title;
    image.src = src;
    viewer.querySelector('#viewer-original').href = src;
    viewer.querySelector('#viewer-download').href = src;
    viewer.showModal();
    document.body.classList.add('viewer-open');
    pan.scrollTo(0, 0);
    sizeImage();
  }
  viewer.querySelector('#viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) {
      const rect = viewer.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
    }
  });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
  // Menu controls work independently, even if catalog loading fails.
  document.querySelectorAll('[data-menu]').forEach((button) => {
    button.addEventListener('click', () => openImage(`assets/menu/menu-${button.dataset.menu}.jpg`, `Menu resmi · Halaman ${button.dataset.menu}`, button, true));
  });

  const grid = document.querySelector('#product-grid');
  const filters = document.querySelector('#product-filters');
  const status = document.querySelector('#gallery-status');
  const more = document.querySelector('#gallery-more');
  const all = document.querySelector('#gallery-all');
  const curated = [14, 18, 26, 28, 25, 10, 30, 65, 69, 73];
  // Editorial mood-board area mapping (id → grid area name)
  const editorialAreas = {
    102: 'hero-a',   // Americano (HERO 1)
    104: 'hero-b',   // Pancake Special (HERO 2)
    103: 'berry',    // Pancake Berry Cheese
    101: 'lychee',   // Lychee Tea
    107: 'avocado',  // Avocado Latte
    108: 'zesty',    // Zesty Americano
    109: 'lemon',    // Lemon Tea
    105: 'roasted',  // Roti Bakar Choco Cheese
    106: 'snack',    // Snack Platter
  };
  let products = [];
  let category = 'Semua';
  let limit = 12;

  function render(focusNew = false) {
    const previousCount = grid.children.length;
    const selection = products.filter((item) => category === 'Semua' || item.category === category);
    // Editorial mode: when category is "Semua" and selection contains the curated editorial ids
    const editorialIds = Object.keys(editorialAreas).map(Number);
    const isEditorial = category === 'Semua' && editorialIds.every((id) => selection.some((item) => item.id === id));
    grid.classList.toggle('editorial', isEditorial);
    grid.replaceChildren();
    const displayItems = isEditorial
      ? editorialIds.map((id) => selection.find((item) => item.id === id)).filter(Boolean)
      : selection.slice(0, limit);
    displayItems.forEach((item) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'product-card';
      card.dataset.id = item.id;
      card.setAttribute('aria-label', `Perbesar foto: ${item.label}`);
      if (isEditorial && editorialAreas[item.id]) {
        card.dataset.area = editorialAreas[item.id];
        if (item.is_hero) card.dataset.hero = 'true';
      }
      const wrap = document.createElement('span');
      wrap.className = 'img-wrap';
      const photo = document.createElement('img');
      photo.src = item.src;
      photo.alt = item.label;
      photo.width = item.width;
      photo.height = item.height;
      photo.loading = 'lazy';
      photo.decoding = 'async';
      wrap.append(photo);
      const caption = document.createElement('span');
      caption.className = 'product-caption';
      const label = document.createElement('strong');
      label.textContent = item.label;
      caption.append(label);
      card.append(wrap, caption);
      card.addEventListener('click', () => openImage(item.src, item.label, card));
      grid.append(card);
    });
    const shown = displayItems.length;
    const total = selection.length;
    status.textContent = isEditorial
      ? `Editorial layout · ${shown} menu pilihan`
      : `${Math.min(limit, shown)} dari ${total} foto · ${category}`;
    more.hidden = all.hidden = isEditorial || shown >= total;
    filters.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.textContent === category)));
    if (focusNew) grid.children[previousCount]?.focus({ preventScroll: true });
  }
  more.addEventListener('click', () => { limit += 12; render(true); });
  all.addEventListener('click', () => { limit = products.length; render(true); });
  fetch('assets/products/catalog.json')
    .then((response) => {
      if (!response.ok) throw new Error('Catalog unavailable');
      return response.json();
    })
    .then((catalog) => {
      const priority = (item) => curated.includes(item.id) ? curated.indexOf(item.id) : curated.length;
      products = catalog.sort((a, b) => priority(a) - priority(b));
      ['Semua', ...new Set(products.map((item) => item.category))].forEach((name) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = name;
        button.setAttribute('aria-controls', 'product-grid');
        button.addEventListener('click', () => { category = name; limit = 12; render(); });
        filters.append(button);
      });
      filters.hidden = false;
      render();
    })
    .catch(() => { status.textContent = 'Foto belum dapat dimuat. Muat ulang halaman atau lihat menu resmi di bawah.'; });
})();
