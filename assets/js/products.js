/**
 * products.js — каталог: завантаження товарів із Supabase,
 * фільтр за категорією, пошук за назвою, сортування за ціною.
 */
(() => {
  'use strict';

  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const stateBox = document.getElementById('products-state');
  const countEl = document.getElementById('products-count');
  const searchInput = document.getElementById('products-search');
  const sortSelect = document.getElementById('products-sort');
  const filterButtons = document.querySelectorAll('.filters__btn');

  const CATEGORIES = ['seating', 'tables', 'decor'];
  const PLACEHOLDER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" fill="#aaa" font-family="Arial" font-size="16" text-anchor="middle">Фото відсутнє</text></svg>'
    );

  const params = new URLSearchParams(window.location.search);
  const state = {
    category: CATEGORIES.includes(params.get('category')) ? params.get('category') : 'all',
    sort: 'default',
    q: (params.get('q') || '').trim()
  };
  let products = [];

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const createIcon = (name, className, label) => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `assets/images/icons/sprite.svg#icon-${name}`);
    svg.append(use);
    return svg;
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const formatPrice = (value) =>
    `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

  function showState(message, withRetry = false) {
    stateBox.hidden = false;
    stateBox.replaceChildren(el('p', 'products__state-text', message));
    if (withRetry) {
      const btn = el('button', 'btn-outline', 'Спробувати ще раз');
      btn.type = 'button';
      btn.addEventListener('click', load);
      stateBox.append(btn);
    }
  }

  function createCard(product) {
    const card = el('article', 'product-card');
    const wrap = el('div', 'product-card__image-wrapper');

    const img = el('img', 'product-card__image');
    img.src = product.image_url || PLACEHOLDER;
    img.alt = product.name;
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      img.src = PLACEHOLDER;
    }, { once: true });
    wrap.append(img);

    if (product.is_sale) {
      wrap.append(createIcon('sale', 'product-card__badge', 'Акція'));
    }

    const addButton = el('button', 'btn-solid product-card__btn', 'У кошик');
    addButton.type = 'button';
    let resetTimer;
    addButton.addEventListener('click', () => {
      window.Shop.cart.add(product);
      addButton.textContent = 'Додано ✓';
      addButton.classList.add('is-added');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        addButton.textContent = 'У кошик';
        addButton.classList.remove('is-added');
      }, 1200);
    });

    const quickButton = el('button', 'btn-outline product-card__btn', 'Швидке замовлення');
    quickButton.type = 'button';
    quickButton.addEventListener('click', () => window.Shop.openOrderModal(product));

    const actions = el('div', 'product-card__actions');
    actions.append(addButton, quickButton);

    card.append(
      wrap,
      el('h3', 'product-card__title', product.name),
      el('p', 'product-card__price', formatPrice(product.price)),
      actions
    );
    return card;
  }

  function getVisible() {
    const q = state.q.toLowerCase();
    let list = products.filter((p) => {
      const inCategory = state.category === 'all' || p.category === state.category;
      const inSearch =
        !q || `${p.name} ${p.description || ''}`.toLowerCase().includes(q);
      return inCategory && inSearch;
    });

    if (state.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'en'));
    return list;
  }

  function render() {
    const list = getVisible();
    grid.replaceChildren(...list.map(createCard));
    countEl.textContent = `Знайдено товарів: ${list.length}`;

    if (list.length === 0) {
      showState('За вашим запитом нічого не знайдено. Спробуйте змінити фільтри.');
    } else {
      stateBox.hidden = true;
    }
  }

  async function load() {
    grid.replaceChildren();
    countEl.textContent = '';
    showState('Завантажуємо товари…');
    try {
      products = await window.Shop.api('products?select=*&order=id.asc');
      render();
    } catch (err) {
      showState('Не вдалося завантажити товари. Перевірте з’єднання та спробуйте ще раз.', true);
    }
  }

  /* ── Події ── */
  filterButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      state.category = btn.dataset.category;
      syncFilters();
      render();
    })
  );

  function syncFilters() {
    filterButtons.forEach((btn) => {
      const active = btn.dataset.category === state.category;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  let timer;
  searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.q = searchInput.value.trim();
      render();
    }, 200);
  });

  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    render();
  });

  searchInput.value = state.q;
  syncFilters();
  load();
})();
