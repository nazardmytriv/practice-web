/**
 * script.js
 * Логіка мобільного бургер-меню.
 *
 * Принцип роботи:
 *  - Клік на .burger додає/прибирає клас .is-open на .burger і .nav
 *  - CSS-клас .is-open відповідає за анімацію: меню розкривається через max-height
 *  - Клік на посилання меню закриває меню (зручно на мобільних)
 *  - Клік за межами header на відкрите меню — закриває його
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Знаходимо елементи ── */
  const burger = document.querySelector('.burger');
  const nav    = document.querySelector('.nav');
  const header = document.querySelector('.header');

  // Якщо потрібних елементів немає — виходимо
  if (!burger || !nav) return;

  /* ── Допоміжна функція: перемикає стан меню ── */
  const toggleMenu = (forceClose = false) => {
    const isOpen = burger.classList.contains('is-open');

    if (forceClose || isOpen) {
      // Закрити
      burger.classList.remove('is-open');
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    } else {
      // Відкрити
      burger.classList.add('is-open');
      nav.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
    }
  };

  /* ── Клік на бургер ── */
  burger.addEventListener('click', () => {
    toggleMenu();
  });

  /* ── Клік на посилання меню — закриває меню ── */
  const navLinks = nav.querySelectorAll('.nav__link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(true); // примусово закрити
    });
  });

  /* ── Клік за межами header — закриває відкрите меню ── */
  document.addEventListener('click', (event) => {
    const isMenuOpen = nav.classList.contains('is-open');

    // Якщо меню відкрите і клік відбувся поза header — закриваємо
    if (isMenuOpen && !header.contains(event.target) && !nav.contains(event.target)) {
      toggleMenu(true);
    }
  });

  /* ── Клавіша Escape — закриває меню ── */
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toggleMenu(true);
    }
  });

  /* ── При зміні розміру вікна: якщо > 1024px — закрити та прибрати класи ── */
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1025) {
      // На десктопі меню керується CSS, тому скидаємо JS-класи
      burger.classList.remove('is-open');
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

});
