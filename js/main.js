const SCROLL_RANGE = 120;
const SITE_ANALYTICS_ENDPOINT = "https://api.dxgames.cl/site/squeaks";

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
  initSiteAnalytics();

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

function initSiteAnalytics() {
  trackSiteEvent("view", pageViewTag());

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const modalButton = event.target.closest(".icon-square[data-game]");
    if (modalButton) {
      const game = snakeCase(modalButton.dataset.game || "unknown_game");
      trackSiteEvent("action", `modal_open_${game}`, game);
      return;
    }

    const link = event.target.closest("a");
    if (!link) return;

    const tag = analyticsTagForLink(link);
    if (!tag) return;
    trackSiteEvent("action", tag, link.href);
  });
}

function trackSiteEvent(eventType, tag, target) {
  const payload = {
    event_type: eventType,
    tag: clampText(snakeCase(tag), 64),
    path: clampText(normalizedSitePath(), 200)
  };

  const normalizedTarget = target ? clampText(String(target), 300) : "";
  if (normalizedTarget) {
    payload.target = normalizedTarget;
  }

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(SITE_ANALYTICS_ENDPOINT, blob)) return;
    }
    fetch(SITE_ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true
    }).catch(() => {});
  } catch {
    // Analytics must never interrupt navigation or game actions.
  }
}

function pageViewTag() {
  const path = normalizedSitePath();
  if (path === "/") return "view_home";
  if (path === "/profile.html") return "view_profile";
  if (path === "/privacy/") return "view_privacy";
  return "view_page";
}

function analyticsTagForLink(link) {
  const explicitTag = link.dataset.analyticsTag;
  if (explicitTag) return explicitTag;

  if (link.closest(".nav-links")) {
    return `nav_${snakeCase(link.textContent || "link")}`;
  }

  if (link.closest(".site-footer")) {
    return `footer_${snakeCase(link.textContent || "link")}`;
  }

  const game = gameSlugForElement(link);
  if (game) {
    if (link.querySelector(".game-card-image")) return `${game}_image`;
    const action = gameActionForLink(link);
    return `${game}_${action}`;
  }

  return "";
}

function gameSlugForElement(element) {
  const modal = element.closest(".game-modal[data-game]");
  if (modal?.dataset.game) return snakeCase(modal.dataset.game);

  const card = element.closest(".game-card[data-game]");
  if (card?.dataset.game) return snakeCase(card.dataset.game);

  return "";
}

function gameActionForLink(link) {
  const label = snakeCase(link.textContent || "link");
  if (label.includes("trailer")) return "trailer";
  if (label.includes("app_store") || label.includes("ios")) return "app_store";
  if (label.includes("download") || label.includes("desktop")) return "download";
  if (label.includes("print_and_play")) return "print_and_play";
  if (label.includes("play_online")) return "play_online";
  if (label.includes("join_the_beta") || label.includes("discord")) return "join_beta";
  if (label.includes("order")) return "order";
  return label || "link";
}

function normalizedSitePath() {
  const path = window.location.pathname || "/";
  if (path === "/index.html") return "/";
  if (path === "/privacy/index.html") return "/privacy/";
  return path;
}

function snakeCase(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_") || "unknown";
}

function clampText(value, maxLength) {
  return value.length <= maxLength ? value : value.slice(0, maxLength);
}
