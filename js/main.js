const SCROLL_RANGE = 120;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getScrollY() {
  const root = document.scrollingElement || document.documentElement;
  return window.scrollY ?? root.scrollTop ?? 0;
}

function updateNavProgress() {
  const y = getScrollY();
  const progress = clamp(y / SCROLL_RANGE, 0, 1);
  document.documentElement.style.setProperty("--nav-progress", String(progress));
}

let scrollRafPending = false;
function scheduleNavProgressUpdate() {
  if (scrollRafPending) return;
  scrollRafPending = true;
  requestAnimationFrame(() => {
    updateNavProgress();
    scrollRafPending = false;
  });
}

function initNavScroll() {
  updateNavProgress();
  window.addEventListener("scroll", scheduleNavProgressUpdate, { passive: true });
  window.addEventListener("resize", updateNavProgress, { passive: true });
  window.addEventListener("load", updateNavProgress);
  window.addEventListener("pageshow", updateNavProgress);
}

document.addEventListener("DOMContentLoaded", () => {
  initNavScroll();

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
