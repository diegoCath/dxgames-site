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

  initGameModals();
});

function initGameModals() {
  function openModal(gameSlug) {
    const modal = document.querySelector(`.game-modal[data-game="${gameSlug}"]`);
    if (!modal) return;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeActiveModal() {
    const active = document.querySelector(".game-modal.active");
    if (!active) return;
    active.classList.remove("active");
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".icon-square").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.game));
  });

  document.querySelectorAll(".game-modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", closeActiveModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeActiveModal();
  });
}
