const SCROLL_RANGE = 120;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateNavProgress() {
  const y = window.scrollY;
  const progress = clamp(y / SCROLL_RANGE, 0, 1);
  document.documentElement.style.setProperty("--nav-progress", String(progress));
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavProgress();

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateNavProgress();
        ticking = false;
      });
    },
    { passive: true }
  );

  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("open");
    navLinks.classList.toggle("open");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.classList.remove("open");
      navLinks.classList.remove("open");
    });
  });
});
