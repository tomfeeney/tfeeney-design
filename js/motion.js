/* =========================
   PORTFOLIO MOTION V6
   IntersectionObserver reveal + mobile-safe lightweight parallax
========================= */
(function () {
  document.documentElement.classList.add('js');

  var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileQuery = window.matchMedia('(max-width: 767.98px)');
  var revealObserver = null;
  var parallaxSections = [];
  var ticking = false;

  function prefersReducedMotion() {
    return reduceMotionQuery.matches;
  }

  function parallaxEnabled() {
    return !prefersReducedMotion() && !mobileQuery.matches;
  }



  function hasMotionAncestor(el) {
    var parent = el.parentElement;
    while (parent && parent !== document.body) {
      if (parent.hasAttribute && parent.hasAttribute('data-animate')) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  function setMotion(el, type, delay) {
    if (!el || el.hasAttribute('data-animate')) return;
    if (el.closest && (el.closest('.site-nav') || el.closest('.scroll-icon'))) return;
    el.setAttribute('data-animate', type || 'slide-up');
    if (typeof delay === 'number' && delay > 0 && !el.style.getPropertyValue('--motion-delay')) {
      el.style.setProperty('--motion-delay', delay + 'ms');
    }
  }

  function enhanceWhiteTextMotion(scope) {
    var root = scope || document;
    var sections = Array.prototype.slice.call(root.querySelectorAll(
      'section.gc-lesson-dark, section.gc-lesson-grad-ai, section.txt-white, section .txt-white'
    ));

    sections.forEach(function (section) {
      section.querySelectorAll('.gc-section-title, .section-heading h2').forEach(function (el, index) {
        if (!hasMotionAncestor(el)) setMotion(el, 'slide-up', index * 40);
      });

      section.querySelectorAll('.gc-lesson-title, .case-study-title').forEach(function (el, index) {
        if (!hasMotionAncestor(el)) setMotion(el, 'slide-up', 80 + index * 40);
      });

      var copyItems = Array.prototype.slice.call(section.querySelectorAll(
        '.gc-lesson-copy-wrap > p, .gc-lesson-copy-wrap .gc-copy, .gc-copy:not(.gc-overview-label), .case-study-copy, .case-study-note'
      ));

      copyItems.forEach(function (el, index) {
        if (!hasMotionAncestor(el)) setMotion(el, 'slide-up', 120 + index * 70);
      });

      var bulletItems = Array.prototype.slice.call(section.querySelectorAll('.gc-bullets-white li, .gc-bullets-dark li, .gc-bullets li'));
      bulletItems.forEach(function (el, index) {
        if (!hasMotionAncestor(el)) setMotion(el, 'slide-up', 120 + index * 55);
      });

      section.querySelectorAll('.gc-caption, figcaption').forEach(function (el, index) {
        if (!hasMotionAncestor(el)) setMotion(el, 'fade', 140 + index * 50);
      });
    });
  }

  function revealAll(scope) {
    var root = scope || document;
    root.querySelectorAll('[data-animate]').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  function initReveal(scope) {
    var root = scope || document;
    enhanceWhiteTextMotion(root);
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-animate]:not(.is-visible)'));

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      revealAll(root);
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.14,
        rootMargin: '0px 0px -8% 0px'
      });
    }

    items.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  function getParallaxStrength() {
    var value = getComputedStyle(document.documentElement).getPropertyValue('--motion-parallax-strength').trim();
    var parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 64;
  }

  function updateParallax() {
    if (!parallaxEnabled()) {
      parallaxSections.forEach(function (section) {
        section.style.setProperty('--case-parallax-offset', '0px');
      });
      ticking = false;
      return;
    }

    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var strength = getParallaxStrength();

    parallaxSections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportHeight) return;

      var progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      var clamped = Math.max(0, Math.min(1, progress));
      var offset = Math.round((clamped - 0.5) * strength);

      section.style.setProperty('--case-parallax-offset', offset + 'px');
    });

    ticking = false;
  }

  function requestParallaxUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  function initParallax() {
    parallaxSections = Array.prototype.slice.call(document.querySelectorAll('[data-parallax-section]'));
    updateParallax();
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    window.addEventListener('resize', requestParallaxUpdate);

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', requestParallaxUpdate);
      reduceMotionQuery.addEventListener('change', function () {
        if (prefersReducedMotion()) revealAll();
        requestParallaxUpdate();
      });
    }
  }

  function observeProtectedPage() {
    var protectedPage = document.getElementById('protectedPage');
    if (!protectedPage || !('MutationObserver' in window)) return;

    var observer = new MutationObserver(function () {
      if (!protectedPage.hidden) {
        window.requestAnimationFrame(function () {
          initReveal(protectedPage);
          requestParallaxUpdate();
        });
      }
    });

    observer.observe(protectedPage, { attributes: true, attributeFilter: ['hidden'] });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initParallax();
    observeProtectedPage();
  });
})();
