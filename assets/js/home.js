/**
 * home.js — головна сторінка:
 * популярні товари з Supabase та слайдер відгуків (дані з масиву об’єктів).
 */
(() => {
  'use strict';

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  /* ── Популярні товари ── */
  const grid = document.getElementById('home-products');
  const stateBox = document.getElementById('home-products-state');

  const PLACEHOLDER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" fill="#aaa" font-family="Arial" font-size="16" text-anchor="middle">Фото відсутнє</text></svg>'
    );

  function showState(message, withRetry = false) {
    stateBox.hidden = false;
    stateBox.replaceChildren(el('p', 'products__state-text', message));
    if (withRetry) {
      const btn = el('button', 'btn-outline', 'Спробувати ще раз');
      btn.type = 'button';
      btn.addEventListener('click', loadProducts);
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
    img.addEventListener('error', () => { img.src = PLACEHOLDER; }, { once: true });
    wrap.append(img);

    if (product.is_sale) {
      const badge = el('img', 'product-card__badge');
      badge.src = 'assets/images/icons/sale.svg';
      badge.alt = 'Акція';
      wrap.append(badge);
    }

    const link = el('a', 'btn-outline product-card__btn', 'Детальніше');
    link.href = `products.html?q=${encodeURIComponent(product.name)}`;

    card.append(
      wrap,
      el('h3', 'product-card__title', product.name),
      el('p', 'product-card__price', `$${Number(product.price).toLocaleString('en-US')}`),
      link
    );
    return card;
  }

  async function loadProducts() {
    grid.replaceChildren();
    showState('Завантажуємо товари…');
    try {
      const list = await window.Shop.api('products?select=*&order=id.asc&limit=6');
      if (!list.length) {
        showState('Товарів поки немає. Зазирніть пізніше.');
        return;
      }
      stateBox.hidden = true;
      grid.replaceChildren(...list.map(createCard));
    } catch (err) {
      console.error(err);
      showState('Не вдалося завантажити товари. Спробуйте ще раз.', true);
    }
  }

  if (grid) loadProducts();

  /* ── Слайдер відгуків ── */
  const reviews = [
    {
      author: 'Олена К.',
      source: 'через Instagram',
      text: 'Замовила крісло-гойдалку: приїхало акуратно запакованим, збирати не довелося. У вітальні воно одразу стало головним акцентом.'
    },
    {
      author: 'Андрій М.',
      source: 'через Facebook',
      text: 'Допомогли підібрати комод під наш інтер’єр і вклалися у строки. Якість матеріалів помітна одразу.'
    },
    {
      author: 'Марія Т.',
      source: 'через Twitter',
      text: 'Давно шукала щось незвичайне для вітальні. Тут знайшла журнальний столик, якого більше ніде немає.'
    }
  ];

  const authorEl = document.getElementById('testimonial-author');
  const textEl = document.getElementById('testimonial-text');
  const dotsEl = document.getElementById('testimonial-dots');

  if (authorEl && textEl && dotsEl) {
    const dots = reviews.map((review, index) => {
      const dot = el('button', 'testimonial__dot');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Відгук ${index + 1}`);
      dot.addEventListener('click', () => show(index));
      return dot;
    });
    dotsEl.replaceChildren(...dots);

    function show(index) {
      const review = reviews[index];
      authorEl.replaceChildren(
        `${review.author}, `,
        el('span', 'testimonial__author-twitter', review.source)
      );
      textEl.textContent = review.text;
      dots.forEach((dot, i) => {
        dot.classList.toggle('testimonial__dot--active', i === index);
        dot.setAttribute('aria-current', String(i === index));
      });
    }

    show(0);
  }
})();
