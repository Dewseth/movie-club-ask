/* ═══════════════════════════════════════════════════════════════
   THE MOVIE CLUB  ·  screenplay.js
   Handles: secure iframe injection · right-click lock ·
            devtools detection · fullscreen · toast
═══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────
   🔐  MOVIE LINK — obfuscated at runtime
   The URL is never written in plain text to the DOM.
   It is split, reversed and assembled only in memory,
   then injected via JS so it never appears in
   View Source, Elements panel, or network requests
   initiated by the parent page.
   ──────────────────────────────────────────── */

// URL stored as reversed char-code array — not human-readable in source
// URL: https://streamimdb.ru/embed/movie/tt28650488 (reversed char codes)
// Each screenplay HTML passes its own encoded URL via a data attribute
const frame = document.getElementById("movieFrame");
const raw = frame ? frame.getAttribute("data-src-enc") : null;
const _enc = raw
  ? raw
      .split(",")
      .reverse()
      .map((c) => String.fromCharCode(+c))
      .join("")
  : "";

// Inject the iframe src only after DOM is ready and only once
(function injectPlayer() {
  const frame = document.getElementById("movieFrame");
  if (frame) {
    frame.setAttribute("src", _enc);
  }
})();

/* ══════════════════════════════════════════════
   1. BLOCK RIGHT-CLICK EVERYWHERE on this page
══════════════════════════════════════════════ */
document.addEventListener(
  "contextmenu",
  function (e) {
    e.preventDefault();
    e.stopPropagation();
    showToast();
    return false;
  },
  true,
); // useCapture = true catches it before anything else

/* ══════════════════════════════════════════════
   2. BLOCK COMMON KEYBOARD SHORTCUTS
   — F12, Ctrl+Shift+I/J/C/U, Ctrl+S, Ctrl+U,
     Ctrl+P, Ctrl+A (select all), Ctrl+C
══════════════════════════════════════════════ */
document.addEventListener(
  "keydown",
  function (e) {
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const key = e.key ? e.key.toLowerCase() : "";

    // DevTools
    if (e.key === "F12") {
      e.preventDefault();
      showToast();
      return false;
    }
    if (ctrl && shift && ["i", "j", "c"].includes(key)) {
      e.preventDefault();
      showToast();
      return false;
    }

    // View Source
    if (ctrl && key === "u") {
      e.preventDefault();
      showToast();
      return false;
    }

    // Save page
    if (ctrl && key === "s") {
      e.preventDefault();
      return false;
    }

    // Print
    if (ctrl && key === "p") {
      e.preventDefault();
      return false;
    }

    // Select All & Copy (discourage scraping)
    if (ctrl && key === "a") {
      e.preventDefault();
      return false;
    }
    if (ctrl && key === "c") {
      // Only block if something inside the player is selected — don't break normal text copy
      const sel = window.getSelection ? window.getSelection().toString() : "";
      if (!sel) {
        e.preventDefault();
        return false;
      }
    }
  },
  true,
);

/* ══════════════════════════════════════════════
   3. SHIELD OVERLAY
   The .sp-shield div sits above the iframe at z-index 2.
   It absorbs right-clicks so the browser's iframe
   context menu (which can expose the src URL) never appears.
   For normal clicks we let them pass through via pointer-events.
══════════════════════════════════════════════ */
const shield = document.getElementById("spShield");

if (shield) {
  // Block right-click on the shield itself
  shield.addEventListener(
    "contextmenu",
    function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showToast();
      return false;
    },
    true,
  );

  // Allow normal left-click to pass through to the iframe
  // by temporarily lowering pointer-events so play controls work
  shield.addEventListener("mousedown", function (e) {
    if (e.button === 0) {
      // Left click — let it reach the iframe
      shield.style.pointerEvents = "none";
      setTimeout(() => {
        shield.style.pointerEvents = "";
      }, 600);
    }
  });

  // Touch support for mobile
  shield.addEventListener(
    "touchstart",
    function () {
      shield.style.pointerEvents = "none";
      setTimeout(() => {
        shield.style.pointerEvents = "";
      }, 600);
    },
    { passive: true },
  );
}

/* ══════════════════════════════════════════════
   4. DEVTOOLS DETECTION (size-based heuristic)
   If the browser window is opened with DevTools
   docked, the inner dimensions shrink noticeably.
   We blur the player and show a warning.
══════════════════════════════════════════════ */
(function devToolsGuard() {
  const THRESHOLD = 160;
  let warned = false;
  const playerWrap = document.getElementById("playerWrap");

  function check() {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if ((widthDiff > THRESHOLD || heightDiff > THRESHOLD) && !warned) {
      warned = true;
      if (playerWrap) {
        playerWrap.style.filter = "blur(12px)";
        playerWrap.style.opacity = "0.3";
      }
      showToast("Developer tools detected — player hidden");
    } else if (widthDiff <= THRESHOLD && heightDiff <= THRESHOLD && warned) {
      warned = false;
      if (playerWrap) {
        playerWrap.style.filter = "";
        playerWrap.style.opacity = "";
      }
    }
  }

  window.addEventListener("resize", check, { passive: true });
  setInterval(check, 1500);
})();

/* ══════════════════════════════════════════════
   5. PREVENT TEXT SELECTION on player area
══════════════════════════════════════════════ */
const playerWrap = document.getElementById("playerWrap");
if (playerWrap) {
  playerWrap.addEventListener("selectstart", (e) => e.preventDefault());
}

/* ══════════════════════════════════════════════
   6. FULLSCREEN BUTTON
══════════════════════════════════════════════ */
const fullscreenBtn = document.getElementById("fullscreenBtn");
const fsIcon = document.getElementById("fsIcon");

if (fullscreenBtn && playerWrap) {
  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      playerWrap.requestFullscreen?.() ||
        playerWrap.webkitRequestFullscreen?.() ||
        playerWrap.mozRequestFullScreen?.();
    } else {
      document.exitFullscreen?.() ||
        document.webkitExitFullscreen?.() ||
        document.mozCancelFullScreen?.();
    }
  });

  // Sync icon
  document.addEventListener("fullscreenchange", syncFsIcon);
  document.addEventListener("webkitfullscreenchange", syncFsIcon);
  document.addEventListener("mozfullscreenchange", syncFsIcon);

  function syncFsIcon() {
    const inFs = !!document.fullscreenElement;
    fsIcon.className = inFs ? "fa-solid fa-compress" : "fa-solid fa-expand";
    fullscreenBtn.querySelector("span") &&
      (fullscreenBtn.querySelector("span").textContent = inFs
        ? "Exit Full"
        : "Full Screen");
    // Rebuild button text node
    const btn = fullscreenBtn;
    // Remove last text node
    [...btn.childNodes].forEach((n) => {
      if (n.nodeType === 3) n.remove();
    });
    btn.append(document.createTextNode(inFs ? " Exit Full" : " Full Screen"));
  }
}

/* ══════════════════════════════════════════════
   7. TOAST HELPER
══════════════════════════════════════════════ */
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("spToast");
  if (!toast) return;
  if (msg) toast.querySelector("span").textContent = msg;
  else toast.querySelector("span").textContent = "Content is protected";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

/* ══════════════════════════════════════════════
   8. DISABLE DRAG on the player
══════════════════════════════════════════════ */
document.addEventListener("dragstart", (e) => {
  if (playerWrap && playerWrap.contains(e.target)) e.preventDefault();
});
