(() => {
  const body = document.body;
  const scene = document.getElementById("scene");
  const section = document.querySelector("[data-parallax-section]");
  const bg = document.querySelector("[data-parallax-bg]");
  const walker = document.querySelector(".godzilla");

  if (!body || !scene || !section || !bg || !walker) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");

  let parallaxInstance = null;
  let pointerYOffset = 0;
  let facingRafId = 0;
  let lastWalkerX = null;

  const setReducedMotionClass = () => {
    body.classList.toggle("reduced-motion", prefersReducedMotion.matches);
  };

  const shouldEnableSceneParallax = () => {
    return (
      typeof window.Parallax !== "undefined" &&
      !prefersReducedMotion.matches &&
      !coarsePointer.matches &&
      window.innerWidth >= 768
    );
  };

  const destroySceneParallax = () => {
    if (!parallaxInstance) return;

    try {
      parallaxInstance.disable();
      if (typeof parallaxInstance.destroy === "function") {
        parallaxInstance.destroy();
      }
    } catch (error) {
      console.warn("Parallax teardown skipped:", error);
    }

    parallaxInstance = null;
  };

  const createSceneParallax = () => {
    if (parallaxInstance || !shouldEnableSceneParallax()) return;

    parallaxInstance = new window.Parallax(scene, {
      selector: ".layer",
      relativeInput: true,
      hoverOnly: true,
      clipRelativeInput: true,
      calibrationThreshold: 100,
      scalarX: 25,
      scalarY: 15,
      frictionX: 0.08,
      frictionY: 0.08,
      pointerEvents: true
    });
  };

  const updateBackgroundParallax = () => {
    if (prefersReducedMotion.matches) {
      section.style.setProperty("--error-bg-offset", "0px");
      return;
    }

    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const scrollProgress = ((viewportHeight * 0.5) - rect.top) / (viewportHeight + rect.height);
    const scrollOffset = (scrollProgress - 0.5) * -42;
    const totalOffset = scrollOffset + pointerYOffset;

    section.style.setProperty("--error-bg-offset", `${totalOffset.toFixed(2)}px`);
  };

  const handlePointerMove = (event) => {
    if (prefersReducedMotion.matches || coarsePointer.matches) {
      pointerYOffset = 0;
      updateBackgroundParallax();
      return;
    }

    const rect = section.getBoundingClientRect();
    const relativeY = (event.clientY - rect.top) / rect.height;
    const centeredY = Math.max(-1, Math.min(1, (relativeY - 0.5) * 2));

    pointerYOffset = centeredY * 14;
    updateBackgroundParallax();
  };

  const resetPointerParallax = () => {
    pointerYOffset = 0;
    updateBackgroundParallax();
  };

  const setFacing = (isMovingRight) => {
    walker.classList.toggle("facing-right", isMovingRight);
    walker.classList.toggle("facing-left", !isMovingRight);
  };

  const stopWalkerTracking = () => {
    if (facingRafId) {
      cancelAnimationFrame(facingRafId);
      facingRafId = 0;
    }
    lastWalkerX = null;
  };

  const trackWalkerDirection = () => {
    const currentX = walker.getBoundingClientRect().left;

    if (lastWalkerX !== null) {
      const deltaX = currentX - lastWalkerX;
      if (Math.abs(deltaX) > 0.05) {
        setFacing(deltaX > 0);
      }
    }

    lastWalkerX = currentX;
    facingRafId = window.requestAnimationFrame(trackWalkerDirection);
  };

  const startWalkerTracking = () => {
    if (prefersReducedMotion.matches || facingRafId) {
      return;
    }

    lastWalkerX = null;
    facingRafId = window.requestAnimationFrame(trackWalkerDirection);
  };

  const syncEffects = () => {
    setReducedMotionClass();

    if (shouldEnableSceneParallax()) {
      createSceneParallax();
    } else {
      destroySceneParallax();
    }

    if (prefersReducedMotion.matches) {
      stopWalkerTracking();
      setFacing(true);
    } else {
      startWalkerTracking();
    }

    updateBackgroundParallax();
  };

  setFacing(true);

  section.addEventListener("pointermove", handlePointerMove, { passive: true });
  section.addEventListener("pointerleave", resetPointerParallax, { passive: true });

  window.addEventListener("scroll", updateBackgroundParallax, { passive: true });
  window.addEventListener("resize", syncEffects, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopWalkerTracking();
    } else {
      startWalkerTracking();
    }
  });

  if (typeof prefersReducedMotion.addEventListener === "function") {
    prefersReducedMotion.addEventListener("change", syncEffects);
    coarsePointer.addEventListener("change", syncEffects);
  } else {
    prefersReducedMotion.addListener(syncEffects);
    coarsePointer.addListener(syncEffects);
  }

  syncEffects();
  updateBackgroundParallax();
})();