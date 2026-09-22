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
  const status = document.querySelector('#gallery-status');
  const more = document.querySelector('#gallery-more');
  const all = document.querySelector('#gallery-all');

  // Editorial mood-board area mapping (id → grid area name)
  // 11 cards total: Mont Blue (seasonal full-width top), Americano + Pancake Special (stacked tall col 1),
  // Pan au Chocolat + Pancake Berry Cheese (col 2 bottom rows), and 7 medium cards.
  const editorialAreas = {
    110: 'mont-blue',     // Mont Blue (SEASONAL, full-width top row)
    102: 'hero-a',        // Americano (HERO 1, tall, top-left col 1)
    104: 'hero-b',        // Pancake Special (HERO 2, tall, bottom-left col 1)
    101: 'lychee',        // Lychee Tea
    107: 'avocado',       // Avocado Latte
    108: 'zesty',         // Zesty Americano
    109: 'lemon',         // Lemon Tea
    105: 'roasted',       // Roti Bakar Choco Cheese
    106: 'snack',         // Snack Platter
    111: 'pain',          // Pan au Chocolat
    103: 'berry',         // Pancake Berry Cheese
  };
  let products = [];

  function render() {
    // Editorial mode is the only mode now (no category filters).
    const editorialIds = Object.keys(editorialAreas).map(Number);
    const displayItems = editorialIds
      .map((id) => products.find((item) => item.id === id))
      .filter(Boolean);
    grid.classList.add('editorial');
    grid.replaceChildren();
    displayItems.forEach((item) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'product-card';
      card.dataset.id = item.id;
      card.setAttribute('aria-label', `Perbesar foto: ${item.label}`);
      card.dataset.area = editorialAreas[item.id];
      if (item.is_hero) card.dataset.hero = 'true';
      if (item.is_seasonal) card.dataset.seasonal = 'true';
      if (item.is_new) card.dataset.new = 'true';
      // Render sticker elements for seasonal + new items
      const stickers = [];
      if (item.is_seasonal) {
        const s = document.createElement('span');
        s.className = 'product-sticker sticker-seasonal';
        s.textContent = 'Seasonal';
        stickers.push(s);
      }
      if (item.is_new) {
        const s = document.createElement('span');
        s.className = 'product-sticker sticker-new';
        s.textContent = 'New';
        stickers.push(s);
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
      stickers.forEach((s) => card.append(s));
      card.addEventListener('click', () => openImage(item.src, item.label, card));
      grid.append(card);
    });
    const shown = displayItems.length;
    status.textContent = `Editorial layout · ${shown} menu pilihan`;
    more.hidden = all.hidden = true;
  }
  more.addEventListener('click', () => render());
  all.addEventListener('click', () => render());
  fetch('assets/products/catalog.json')
    .then((response) => {
      if (!response.ok) throw new Error('Catalog unavailable');
      return response.json();
    })
    .then((catalog) => {
      products = catalog;
      render();
    })
    .catch(() => { status.textContent = 'Foto belum dapat dimuat. Muat ulang halaman atau lihat menu resmi di bawah.'; });
})();
