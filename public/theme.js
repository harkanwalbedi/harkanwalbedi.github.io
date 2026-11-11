// Colour theme: applies a saved choice before first paint and wires the toggle.
// Shipped as a small first-party file (not an inline script) so the site's
// Content-Security-Policy can stay at script-src 'self'.
(function () {
  'use strict';

  var KEY = 'hb-theme';
  var root = document.documentElement;

  function saved() {
    try {
      var value = window.localStorage.getItem(KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (error) {
      return null; // storage disabled or blocked: fall back to the system theme
    }
  }

  function current() {
    var chosen = root.getAttribute('data-theme');
    if (chosen === 'dark' || chosen === 'light') {
      return chosen;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function describe(button) {
    var next = current() === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    button.setAttribute('title', 'Switch to ' + next + ' theme');
  }

  var initial = saved();
  if (initial) {
    root.setAttribute('data-theme', initial);
  }
  // Lets the stylesheet reveal controls that only work with JavaScript.
  root.classList.add('js');

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.getElementById('theme-toggle');
    if (!button) {
      return;
    }
    describe(button);

    button.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        window.localStorage.setItem(KEY, next);
      } catch (error) {
        // The choice still applies to this page view.
      }
      describe(button);
    });

    // Without a saved choice the page follows the system, so keep the label in step.
    var query = window.matchMedia('(prefers-color-scheme: dark)');
    if (query.addEventListener) {
      query.addEventListener('change', function () {
        describe(button);
      });
    }
  });
})();
