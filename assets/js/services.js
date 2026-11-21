/**
 * services.js — сторінка «Послуги»:
 * акордеон «Часті питання» та кнопка відкриття модального вікна із заявкою.
 */
(() => {
  'use strict';

  /* ── Акордеон: одночасно відкрите лише одне питання ── */
  const items = document.querySelectorAll('.faq__item');

  const setItem = (item, open) => {
    const button = item.querySelector('.faq__question');
    const panel = item.querySelector('.faq__answer');
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    item.classList.toggle('is-open', open);
  };

  items.forEach((item) => {
    item.querySelector('.faq__question').addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      items.forEach((other) => setItem(other, false));
      if (!wasOpen) setItem(item, true);
    });
  });

  if (items.length) setItem(items[0], true);

  /* ── Модальне вікно із заявкою ── */
  const openButton = document.getElementById('open-request');
  if (openButton) {
    openButton.addEventListener('click', () => window.Shop.openOrderModal(null));
  }
})();
