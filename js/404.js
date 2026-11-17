document.addEventListener("DOMContentLoaded", () => {
  const page = document.body;
  const section = document.querySelector(".error-404-section");
  const scene = document.getElementById("scene");
  const layers = Array.from(document.querySelectorAll(".layer[data-depth]"));
  const monster = document.querySelector(".godzilla, .mechagodzilla");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!section || !scene) {
    return;
  }

  const state = {
    pointerX: 0,
    pointerY: 0,
    currentX: 0,
    currentY: 0,
    rafId: 0
  };

  function setReducedMotionState() {
    page.classList.toggle("reduced-motion", reducedMotionQuery.matches);

    if (reducedMotionQuery.matches) {
      section.style.setProperty("--error-bg-offset", "0px");

      for (const layer of layers) {
        layer.style.transform = "";
      }
    }
  }

  function setMonsterFacing(direction) {
    if (!monster) return;

    if (direction === "left") {
      monster.classList.add("facing-left");
      monster.classList.remove("facing-right");
      return;
    }

    monster.classList.add("facing-right");
    monster.classList.remove("facing-left");
  }

  function handleMonsterIteration(event) {
    if (!monster || event.animationName !== "monster-roam") {
      return;
    }

    if (monster.classList.contains("facing-right")) {
      setMonsterFacing("left");
    } else {
      setMonsterFacing("right");
    }
  }

  function updateParallaxTargets(clientX, clientY) {
    const rect = section.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;

    state.pointerX = (relativeX - 0.5) * 2;
    state.pointerY = (relativeY - 0.5) * 2;
  }

  function animateParallax() {
    if (reducedMotionQuery.matches) {
      state.rafId = 0;
      return;
    }

    state.currentX += (state.pointerX - state.currentX) * 0.08;
    state.currentY += (state.pointerY - state.currentY) * 0.08;

    for (const layer of layers) {
      const depth = Number(layer.dataset.depth || 0);
      const moveX = state.currentX * depth * 18;
      const moveY = state.currentY * depth * 12;
      layer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    }

    section.style.setProperty(
      "--error-bg-offset",
      `${state.currentY * 8}px`
    );

    state.rafId = window.requestAnimationFrame(animateParallax);
  }

  function startParallax() {
    if (state.rafId || reducedMotionQuery.matches) {
      return;
    }

    state.rafId = window.requestAnimationFrame(animateParallax);
  }

  function stopParallax() {
    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

  function resetParallax() {
    state.pointerX = 0;
    state.pointerY = 0;
  }

  setReducedMotionState();
  setMonsterFacing("right");

  if (monster) {
    monster.addEventListener("animationiteration", handleMonsterIteration);
  }

  section.addEventListener("pointermove", (event) => {
    if (reducedMotionQuery.matches) return;
    updateParallaxTargets(event.clientX, event.clientY);
    startParallax();
  });

  section.addEventListener("pointerleave", () => {
    resetParallax();
    startParallax();
  });

  window.addEventListener("resize", () => {
    resetParallax();
    startParallax();
  });

  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", () => {
      setReducedMotionState();

      if (reducedMotionQuery.matches) {
        stopParallax();
      } else {
        resetParallax();
        startParallax();
      }
    });
  } else if (typeof reducedMotionQuery.addListener === "function") {
    reducedMotionQuery.addListener(() => {
      setReducedMotionState();

      if (reducedMotionQuery.matches) {
        stopParallax();
      } else {
        resetParallax();
        startParallax();
      }
    });
  }

  startParallax();
});