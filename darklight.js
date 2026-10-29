
/* =========================
   THEME TOGGLE (IIFE)
   Radi s <link id="theme-link"> i <button id="theme-toggle"><i class="..."></i></button>
   Opcionalno mijenja <img id="brand-logo" data-dark="..." data-light="...">
   ========================= */
(function () {
  'use strict';

  // ---- Putanje CSS-a
  var DARK_HREF  = '/style.css';
  var LIGHT_HREF = '/lightstyle.css';

  // Helper: provjerava je li href već pokazuje na light CSS
  function isLightHref(href) {
    if (!href) return false;
    return /(^|\/)lightstyle\.css(\?|#|$)/.test(href);
  }

  // Helper: localStorage
  function getSavedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }
  function setSavedTheme(val) {
    try { localStorage.setItem('theme', val); } catch (e) {}
  }

  // Primjena teme
  function applyTheme(theme, opts) {
    opts = opts || {};
    var link = document.getElementById('theme-link');
    if (!link) return;

    var targetHref = theme === 'light' ? LIGHT_HREF : DARK_HREF;
    if (link.getAttribute('href') !== targetHref) {
      link.setAttribute('href', targetHref);
    }

    // Klase na body
    if (document.body) {
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(theme);
    }

    // Zamjena loga (ako postoji)
    var logo = document.getElementById('brand-logo');
    if (logo) {
      var nextSrc = (theme === 'light') ? logo.getAttribute('data-light') : logo.getAttribute('data-dark');
      if (nextSrc) logo.src = nextSrc;
    }

    // Ažuriraj toggle ikonu (Font Awesome)
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      var icon = btn.querySelector('i'); // prva ikona unutar gumba
      if (icon) {
        if (theme === 'light') {
          icon.className = 'fa-solid fa-moon'; // prikaz za prelazak na dark
          btn.setAttribute('aria-label', 'Prebaci na dark');
        } else {
          icon.className = 'fa-solid fa-sun';  // prikaz za prelazak na light
          btn.setAttribute('aria-label', 'Prebaci na light');
        }
      }
    }

    // Spremi preferenciju (osim ako je skipSave)
    if (!opts.skipSave) {
      setSavedTheme(theme);
    }
  } // <-- KRAJ applyTheme

  // Init kad je DOM spreman
  function onReady() {
    var link = document.getElementById('theme-link');
    var btn  = document.getElementById('theme-toggle');

    // Ako nema linka ili gumba, izađi tiho (shared skripta)
    if (!link || !btn) return;

    // Početno stanje (sink s trenutnim href-om)
    var initialTheme = isLightHref(link.getAttribute('href')) ? 'light' : 'dark';
    applyTheme(initialTheme, { skipSave: true });

    // Klik za toggle
    btn.addEventListener('click', function () {
      var current = isLightHref(link.getAttribute('href')) ? 'light' : 'dark';
      var next = (current === 'light') ? 'dark' : 'light';
      applyTheme(next);
    });

    // (Opcionalno) prati OS promjenu kad user nije ručno odabrao
    var saved = getSavedTheme();
    if (!saved || (saved !== 'light' && saved !== 'dark')) {
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: light)');
        if (mq.addEventListener) {
          mq.addEventListener('change', function (e) {
            applyTheme(e.matches ? 'light' : 'dark');
          });
        } else if (mq.addListener) { // stariji Safari
          mq.addListener(function (e) {
            applyTheme(e.matches ? 'light' : 'dark');
          });
        }
      }
    }

    // Mali API za debug
    window.Theme = {
      apply: function (t) { applyTheme(t); },
      current: function () {
        var href = link.getAttribute('href');
        return isLightHref(href) ? 'light' : 'dark';
      }
    };
  }

  // Pokretanje
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})(); // <-- KRAJ IIFE
