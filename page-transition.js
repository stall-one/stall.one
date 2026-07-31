/**
 * Cross-Document View Transitions — direction helper.
 *
 * Opt-in CSS lives in style.css (@view-transition + wipe keyframes).
 * This script only:
 *   1. Records data-page-transition="ltr|rtl" before navigation
 *   2. Applies matching view-transition types on pageswap / pagereveal
 *
 * Important: do NOT preventDefault() on links — the browser must perform
 * the navigation so the transition runs during the page change (not after load).
 *
 * Usage:
 *   <a href="./blog/" data-page-transition="ltr">Blog</a>
 *   <a href="../" data-page-transition="rtl">Home</a>
 */
(function () {
  "use strict";

  var STORAGE_KEY = "stall-vt-direction";
  var supported =
    "CSSViewTransitionRule" in window ||
    (typeof CSS !== "undefined" &&
      CSS.supports &&
      CSS.supports("view-transition-name", "none"));

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function readDirection() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || "ltr";
    } catch (e) {
      return "ltr";
    }
  }

  function writeDirection(dir) {
    try {
      sessionStorage.setItem(STORAGE_KEY, dir);
    } catch (e) {
      /* ignore */
    }
  }

  function clearDirection() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function normalizeDirection(value) {
    var dir = (value || "ltr").toLowerCase();
    return dir === "rtl" ? "rtl" : "ltr";
  }

  function typeFor(direction) {
    return direction === "rtl" ? "wipe-rtl" : "wipe-ltr";
  }

  function applyTypes(viewTransition, direction) {
    if (!viewTransition || !viewTransition.types) return;
    try {
      viewTransition.types.add(typeFor(direction));
    } catch (e) {
      /* types may be immutable in some edge cases */
    }
  }

  function sameOriginNavUrl(link) {
    var href = link.getAttribute("href");
    if (!href || href.charAt(0) === "#") return null;
    try {
      var url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return null;
      // Same-document hash only — not a full navigation.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return null;
      }
      return url;
    } catch (err) {
      return null;
    }
  }

  // Prefetch destination on hover/focus so the post-click freeze
  // (old page held while new document loads) is shorter.
  function prefetchLink(link) {
    if (!link || link.dataset.stallPrefetch === "1") return;
    var url = sameOriginNavUrl(link);
    if (!url) return;
    link.dataset.stallPrefetch = "1";
    try {
      var el = document.createElement("link");
      el.rel = "prefetch";
      el.href = url.href;
      el.as = "document";
      document.head.appendChild(el);
    } catch (err) {
      /* ignore */
    }
  }

  document.addEventListener(
    "pointerover",
    function (e) {
      var link = e.target.closest && e.target.closest("a[data-page-transition]");
      if (link) prefetchLink(link);
    },
    true
  );

  document.addEventListener(
    "focusin",
    function (e) {
      var link = e.target.closest && e.target.closest("a[data-page-transition]");
      if (link) prefetchLink(link);
    },
    true
  );

  // Capture intended direction on click without blocking navigation.
  document.addEventListener(
    "click",
    function (e) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var link = e.target.closest && e.target.closest("a[data-page-transition]");
      if (!link) return;

      // Skip pure hash / external / same-document — no MPA transition.
      if (!sameOriginNavUrl(link)) return;

      // Warm cache even if hover never fired (keyboard / touch).
      prefetchLink(link);

      writeDirection(
        normalizeDirection(link.getAttribute("data-page-transition"))
      );
    },
    true
  );

  // Outgoing document: tag the transition type for the old snapshot.
  window.addEventListener("pageswap", function (e) {
    if (!e.viewTransition || prefersReducedMotion()) return;

    var direction = normalizeDirection(readDirection());

    // History back/forward: reverse wipe when no explicit link direction was set.
    if (
      e.activation &&
      e.activation.navigationType === "traverse" &&
      !sessionStorage.getItem(STORAGE_KEY)
    ) {
      direction = "rtl";
      writeDirection(direction);
    }

    applyTypes(e.viewTransition, direction);
  });

  // Incoming document: same type so new-page wipe animation matches.
  window.addEventListener("pagereveal", function (e) {
    if (!e.viewTransition || prefersReducedMotion()) {
      clearDirection();
      return;
    }

    var direction = normalizeDirection(readDirection());
    applyTypes(e.viewTransition, direction);
    clearDirection();
  });

  window.StallPageTransition = {
    supported: supported,
    setDirection: function (dir) {
      writeDirection(normalizeDirection(dir));
    },
  };
})();
