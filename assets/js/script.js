/**
 * script.js — спільна логіка всіх сторінок:
 * бургер-меню, пошук у шапці, API-клієнт Supabase,
 * валідація форм, модальне вікно замовлення, підписка на розсилку.
 */
(() => {
  'use strict';

  const cfg = window.SHOP_CONFIG;

  /* ── Клієнт Supabase REST (fetch) ── */
  async function api(path, options = {}) {
    const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: cfg.SUPABASE_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!res.ok) throw new Error(`Помилка сервера: ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /* ── Бургер-меню ── */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  const header = document.querySelector('.header');

  if (burger && nav) {
    const setMenu = (open) => {
      burger.classList.toggle('is-open', open);
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    };

    burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.querySelectorAll('.nav__link').forEach((link) =>
      link.addEventListener('click', () => setMenu(false))
    );
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1025) setMenu(false);
    });
  }

  /* ── Пошук у шапці: перехід на каталог із параметром q ── */
  const goSearch = (value) => {
    const q = value.trim();
    window.location.href = q ? `products.html?q=${encodeURIComponent(q)}` : 'products.html';
  };

  document
    .querySelectorAll('.header__search-input, .header__mobile-search-input')
    .forEach((input) =>
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') goSearch(input.value);
      })
    );

  document.querySelectorAll('.header__action--search').forEach((link) =>
    link.addEventListener('click', (e) => {
      e.preventDefault();
      goSearch(link.closest('.header__search').querySelector('input').value);
    })
  );

  const mobileIcon = document.querySelector('.header__mobile-search-icon');
  if (mobileIcon) {
    mobileIcon.addEventListener('click', () =>
      goSearch(document.querySelector('.header__mobile-search-input').value)
    );
  }

  /* ── Валідація форм ── */
  const RULES = {
    name: (v) => (v.length < 2 ? 'Вкажіть ім’я (мінімум 2 символи)' : ''),
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Введіть коректну електронну адресу',
    phone: (v) =>
      !v || /^\+?[0-9\s()-]{7,20}$/.test(v)
        ? ''
        : 'Телефон: цифри, пробіли, +, дужки або дефіс (7–20 символів)',
    message: (v) => (v.length > 1000 ? 'Максимум 1000 символів' : '')
  };

  function validateField(input) {
    const rule = RULES[input.name];
    if (!rule) return true;
    const error = rule(input.value.trim());
    const slot = input.closest('.form__field').querySelector('.form__error');
    slot.textContent = error;
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    return !error;
  }

  function validateForm(form) {
    let firstInvalid = null;
    form.querySelectorAll('input[name], textarea[name]').forEach((input) => {
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function setStatus(form, text, type) {
    const status = form.querySelector('.form__status');
    status.textContent = text;
    status.className = `form__status${type ? ` is-${type}` : ''}`;
  }

  /* ── Форми заявки (модалка і сторінка «Контакти») ── */
  const bindRequestForm = (form) => {
    form.querySelectorAll('input[name], textarea[name]').forEach((input) => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus(form, '', '');
      if (!validateForm(form)) return;

      const data = Object.fromEntries(new FormData(form));
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: (data.phone || '').trim() || null,
        message: (data.message || '').trim() || null,
        product_id: data.product_id ? Number(data.product_id) : null
      };

      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      setStatus(form, 'Надсилаємо…', '');

      try {
        await api('requests', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(payload)
        });
        form.reset();
        setStatus(form, 'Дякуємо! Заявку отримано, ми зв’яжемося з вами.', 'ok');
        if (form.closest('#order-modal')) setTimeout(() => window.Shop.closeModal(), 2000);
        form.dispatchEvent(new CustomEvent('request:sent', { bubbles: true }));
      } catch (err) {
        setStatus(form, 'Не вдалося надіслати заявку. Спробуйте ще раз пізніше.', 'error');
      } finally {
        button.disabled = false;
      }
    });
  };

  document.querySelectorAll('form[data-request-form]').forEach(bindRequestForm);

  /* ── Модальне вікно замовлення ── */
  const modal = document.getElementById('order-modal');
  let closeModal = () => {};
  let openOrderModal = () => {};

  if (modal) {
    const productLabel = modal.querySelector('.modal__product');
    const productIdInput = modal.querySelector('[name="product_id"]');
    const form = modal.querySelector('form');
    let lastFocused = null;

    openOrderModal = (product) => {
      lastFocused = document.activeElement;
      productIdInput.value = product ? product.id : '';
      productLabel.textContent = product ? product.name : '';
      setStatus(form, '', '');
      modal.hidden = false;
      document.body.classList.add('is-locked');
      modal.querySelector('input[name="name"]').focus();
    };

    closeModal = () => {
      if (modal.hidden) return;
      modal.hidden = true;
      document.body.classList.remove('is-locked');
      if (lastFocused) lastFocused.focus();
    };

    // Закриття: кнопка «×» або клік на фон поза вікном
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-modal-close]')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ── Підписка на розсилку (без збереження, лише валідація) ── */
  document.querySelectorAll('.newsletter__form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const status = form.parentElement.querySelector('.newsletter__status');
      const ok = RULES.email(input.value.trim()) === '';
      status.textContent = ok
        ? 'Дякуємо за підписку!'
        : 'Введіть коректну електронну адресу.';
      if (ok) form.reset();
    });
  });

  window.Shop = { api, openOrderModal, closeModal, bindRequestForm };
})();
