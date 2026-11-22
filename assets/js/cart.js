/**
 * cart.js — кошик покупок:
 * стан у localStorage, лічильник у шапці, висувна панель з товарами
 * та оформлення замовлення (заявка записується в таблицю requests).
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'shop_cart';
  const MAX_QTY = 99;
  const PLACEHOLDER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="#f0f0f0"/></svg>'
    );

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const button = (className, text, onClick) => {
    const btn = el('button', className, text);
    btn.type = 'button';
    btn.addEventListener('click', onClick);
    return btn;
  };

  const formatPrice = (value) =>
    `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

  /* ── Стан кошика ── */
  let items = [];

  const isValidItem = (item) =>
    item &&
    Number.isFinite(item.id) &&
    typeof item.name === 'string' &&
    Number.isFinite(item.price) &&
    Number.isInteger(item.qty) &&
    item.qty > 0;

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      items = Array.isArray(data) ? data.filter(isValidItem) : [];
    } catch (err) {
      items = []; // сховище недоступне або містить некоректні дані
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      // приватний режим: кошик живе лише до закриття сторінки
    }
  }

  const getCount = () => items.reduce((sum, item) => sum + item.qty, 0);
  const getTotal = () => items.reduce((sum, item) => sum + item.price * item.qty, 0);

  /* ── Лічильник у шапці ── */
  function updateBadge() {
    const count = getCount();
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = count > 99 ? '99+' : String(count);
    });
    document.querySelectorAll('[data-cart-open]').forEach((btn) => {
      btn.setAttribute('aria-label', `Кошик, товарів: ${count}`);
    });
  }

  // Анімація: перезапускаємо CSS-клас, щоб вона спрацьовувала при кожному додаванні
  function bump() {
    document.querySelectorAll('[data-cart-open]').forEach((btn) => {
      btn.classList.remove('is-added');
      void btn.offsetWidth;
      btn.classList.add('is-added');
    });
  }

  /* ── Висувна панель ── */
  const overlay = el('div', 'cart');
  overlay.hidden = true;

  const panel = el('div', 'cart__panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'cart-title');

  const title = el('h2', 'cart__title', 'Кошик');
  title.id = 'cart-title';
  const closeBtn = button('cart__close', '\u00d7', () => close());
  closeBtn.setAttribute('aria-label', 'Закрити кошик');

  const body = el('div', 'cart__body');
  panel.append(el('div', 'cart__head'), body);
  panel.firstChild.append(title, closeBtn);
  overlay.append(panel);
  document.body.append(overlay);

  let view = 'list';
  let lastFocused = null;

  function render(focusKey) {
    if (view === 'checkout' && items.length) body.replaceChildren(buildCheckout());
    else if (view === 'done') body.replaceChildren(buildDone());
    else {
      view = 'list';
      body.replaceChildren(buildList());
    }
    if (focusKey) {
      const target = body.querySelector(`[data-focus="${focusKey}"]`);
      if (target && !target.disabled) target.focus();
    }
  }

  function buildList() {
    if (!items.length) {
      const empty = el('div', 'cart__empty');
      const link = el('a', 'btn-outline', 'До каталогу');
      link.href = 'products.html';
      empty.append(el('p', 'cart__empty-text', 'Кошик порожній. Оберіть щось із каталогу.'), link);
      return empty;
    }

    const list = el('ul', 'cart__list');
    items.forEach((item) => list.append(buildItem(item)));

    const total = el('p', 'cart__total');
    total.append(el('span', undefined, 'Разом'), el('strong', undefined, formatPrice(getTotal())));

    const footer = el('div', 'cart__footer');
    footer.append(
      total,
      button('form__submit', 'Оформити замовлення', () => {
        view = 'checkout';
        render();
      }),
      button('cart__link', 'Очистити кошик', () => {
        items = [];
        save();
        updateBadge();
        render();
      })
    );

    const box = el('div', 'cart__content');
    box.append(list, footer);
    return box;
  }

  function buildItem(item) {
    const li = el('li', 'cart__item');

    const img = el('img', 'cart__img');
    img.src = item.image_url || PLACEHOLDER;
    img.alt = '';
    img.width = 64;
    img.height = 64;
    img.addEventListener('error', () => { img.src = PLACEHOLDER; }, { once: true });

    const minus = button('cart__qty-btn', '\u2212', () => changeQty(item.id, -1));
    minus.setAttribute('aria-label', `Зменшити кількість: ${item.name}`);
    minus.dataset.focus = `minus-${item.id}`;
    minus.disabled = item.qty <= 1;

    const plus = button('cart__qty-btn', '+', () => changeQty(item.id, 1));
    plus.setAttribute('aria-label', `Збільшити кількість: ${item.name}`);
    plus.dataset.focus = `plus-${item.id}`;
    plus.disabled = item.qty >= MAX_QTY;

    const qty = el('div', 'cart__qty');
    qty.append(minus, el('span', 'cart__qty-value', String(item.qty)), plus);

    const remove = button('cart__link', 'Видалити', () => removeItem(item.id));
    remove.setAttribute('aria-label', `Видалити з кошика: ${item.name}`);
    qty.append(remove);

    const info = el('div', 'cart__info');
    info.append(el('p', 'cart__name', item.name), el('p', 'cart__price', formatPrice(item.price)), qty);

    li.append(img, info, el('p', 'cart__line-total', formatPrice(item.price * item.qty)));
    return li;
  }

  function field(name, labelText, type, autocomplete, id, maxLength) {
    const wrap = el('div', 'form__field');
    const label = el('label', 'form__label', labelText);
    label.htmlFor = id;
    const input = el('input', 'form__input');
    input.type = type;
    input.id = id;
    input.name = name;
    input.autocomplete = autocomplete;
    input.maxLength = maxLength;
    wrap.append(label, input, el('span', 'form__error'));
    return wrap;
  }

  const buildMessage = () =>
    [
      'Замовлення з кошика:',
      ...items.map((it, i) => `${i + 1}. ${it.name} × ${it.qty} — ${formatPrice(it.price * it.qty)}`),
      `Разом: ${formatPrice(getTotal())}`
    ].join('\n');

  function buildCheckout() {
    const form = el('form', 'form');
    form.setAttribute('data-request-form', '');
    form.noValidate = true;

    // Приховане поле: склад замовлення підставляється перед відправкою
    const hiddenWrap = el('div', 'form__field');
    hiddenWrap.hidden = true;
    const message = el('input');
    message.type = 'hidden';
    message.name = 'message';
    hiddenWrap.append(message, el('span', 'form__error'));

    const submit = el('button', 'form__submit', 'Надіслати замовлення');
    submit.type = 'submit';
    const status = el('p', 'form__status');
    status.setAttribute('role', 'status');

    form.append(
      field('name', 'Ім’я', 'text', 'name', 'cart-name', 60),
      field('email', 'Email', 'email', 'email', 'cart-email', 100),
      field('phone', 'Телефон (необов’язково)', 'tel', 'tel', 'cart-phone', 20),
      hiddenWrap,
      submit,
      status
    );

    // Слухач має бути доданий до bindRequestForm, щоб склад замовлення потрапив у відправку
    form.addEventListener('submit', () => { message.value = buildMessage(); });
    window.Shop.bindRequestForm(form);

    const back = button('cart__link cart__back', '← До кошика', () => {
      view = 'list';
      render();
    });

    const box = el('div', 'cart__content');
    box.append(
      back,
      el('p', 'cart__summary', `Товарів: ${getCount()} на суму ${formatPrice(getTotal())}`),
      form
    );
    return box;
  }

  function buildDone() {
    const done = el('div', 'cart__done');
    done.append(
      el('p', 'cart__done-text', 'Дякуємо! Замовлення надіслано, ми зв’яжемося з вами найближчим часом.'),
      button('btn-outline', 'Закрити', () => close())
    );
    return done;
  }

  // Заявку успішно збережено в БД: очищуємо кошик
  panel.addEventListener('request:sent', () => {
    items = [];
    save();
    updateBadge();
    view = 'done';
    render();
  });

  /* ── Дії ── */
  function changeQty(id, delta) {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    item.qty = Math.min(Math.max(item.qty + delta, 1), MAX_QTY);
    save();
    updateBadge();
    render(`${delta > 0 ? 'plus' : 'minus'}-${id}`);
  }

  function removeItem(id) {
    items = items.filter((it) => it.id !== id);
    save();
    updateBadge();
    render();
  }

  function add(product) {
    const existing = items.find((it) => it.id === product.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + 1, MAX_QTY);
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url || '',
        qty: 1
      });
    }
    save();
    updateBadge();
    bump();
    if (!overlay.hidden) render();
  }

  function open() {
    if (!overlay.hidden) return;
    lastFocused = document.activeElement;
    view = 'list';
    render();
    overlay.hidden = false;
    document.body.classList.add('is-locked');
    closeBtn.focus();
  }

  function close() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocused) lastFocused.focus();
  }

  /* ── Події ── */
  document.querySelectorAll('[data-cart-open]').forEach((btn) => btn.addEventListener('click', open));

  // Закриття: клік поза панеллю, Escape; Tab не виходить за межі панелі
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = [
      ...panel.querySelectorAll('button:not([disabled]), a[href], input:not([type="hidden"])')
    ];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Синхронізація кошика між вкладками
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    load();
    updateBadge();
    if (!overlay.hidden) render();
  });

  window.Shop.cart = { add, open };
  load();
  updateBadge();
})();
