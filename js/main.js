document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("[data-parallax-section]");

  if (!sections.length) return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotionQuery.matches) {
    sections.forEach((section) => {
      section.style.setProperty("--case-parallax-offset", "0px");
    });
    return;
  }

  let ticking = false;

  function updateParallax() {
    const viewportHeight = window.innerHeight;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();

      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const distanceFromCenter = sectionCenter - viewportCenter;

      const maxOffset = 80;
      const rawOffset = (distanceFromCenter / viewportHeight) * -120;
      const offset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));

      section.style.setProperty("--case-parallax-offset", `${offset}px`);
    });

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(updateParallax);
  }

  updateParallax();

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
});