/* ═══════════════════════════════════════════════════════════════
   THE MOVIE CLUB  ·  Ananda Sastralaya – Kotte
   script.js  |  Theme · Countdown · Scroll · Hamburger
═══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────
   ⏰  EXPIRY DATE CONFIGURATION
   Set your expiry date/time here.
   Format: new Date("YYYY-MM-DDTHH:MM:SS")
   Example below = 7 days from a chosen date.
   ──────────────────────────────────────────── */
const EXPIRY_DATE = new Date("2026-06-05T23:59:59");
//                                ↑ YYYY-MM-DD  ↑ HH:MM:SS

/* ══════════════════════════════════════════════
   1. THEME TOGGLE
══════════════════════════════════════════════ */
const html = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme(theme) {
  html.setAttribute("data-theme", theme);
  themeIcon.className =
    theme === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun";
  localStorage.setItem("mcTheme", theme);
}

// Load saved preference or default to dark
const savedTheme = localStorage.getItem("mcTheme") || "dark";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = html.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");

  // Quick pop animation on button
  themeToggle.style.transform = "scale(0.8) rotate(30deg)";
  setTimeout(() => {
    themeToggle.style.transform = "";
  }, 220);
});

/* ══════════════════════════════════════════════
   2. NAVBAR — scroll shadow & shrink
══════════════════════════════════════════════ */
const navbar = document.getElementById("navbar");

function onScroll() {
  if (window.scrollY > 20) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ══════════════════════════════════════════════
   3. HAMBURGER MENU
══════════════════════════════════════════════ */
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

hamburger.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("open");
  hamburger.classList.toggle("open", open);
  hamburger.setAttribute("aria-expanded", open);
});

// Close on outside click
document.addEventListener("click", (e) => {
  if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
    mobileMenu.classList.remove("open");
    hamburger.classList.remove("open");
  }
});

/* ══════════════════════════════════════════════
   4. COUNTDOWN TIMER
══════════════════════════════════════════════ */
const elDays = document.getElementById("cd-days");
const elHours = document.getElementById("cd-hours");
const elMins = document.getElementById("cd-mins");
const elSecs = document.getElementById("cd-secs");
const expiryDateDisplay = document.getElementById("expiryDateDisplay");
const expiryNote = document.getElementById("expiryNote");

// Display the formatted expiry date once
const dateOpts = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};
expiryDateDisplay.textContent = EXPIRY_DATE.toLocaleDateString(
  "en-GB",
  dateOpts,
);

// Helper: pad to 2 digits
function pad(n) {
  return String(Math.max(0, n)).padStart(2, "0");
}

// Animate a digit cell when the value changes
function animateFlip(el, newVal) {
  const formatted = pad(newVal);
  if (el.textContent !== formatted) {
    el.textContent = formatted;
    el.classList.remove("flip");
    // Trigger reflow
    void el.offsetWidth;
    el.classList.add("flip");
  }
}

function tick() {
  const now = Date.now();
  const diff = EXPIRY_DATE.getTime() - now;

  if (diff <= 0) {
    // Expired
    [elDays, elHours, elMins, elSecs].forEach((el) => {
      el.textContent = "00";
    });

    expiryNote.innerHTML = `
      <i class="fa-solid fa-circle-xmark" style="color:#c0392b"></i>
      <span style="color:#c0392b;font-weight:600;">Access has expired.</span>
    `;
    clearInterval(countdown);
    return;
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1_000);

  animateFlip(elDays, days);
  animateFlip(elHours, hours);
  animateFlip(elMins, mins);
  animateFlip(elSecs, secs);

  // Warning colour when < 24 h
  if (diff < 86_400_000) {
    [elDays, elHours, elMins, elSecs].forEach((el) => {
      el.style.color = "var(--crimson-2)";
    });
  }
}

const countdown = setInterval(tick, 1000);
tick(); // run immediately

/* ══════════════════════════════════════════════
   5. INTERSECTION OBSERVER — card entrance
      (re-triggers for browsers that don't
       support CSS animation-delay reliably)
══════════════════════════════════════════════ */
const cards = document.querySelectorAll(".movie-card");

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = "running";
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  cards.forEach((card) => {
    card.style.animationPlayState = "paused";
    io.observe(card);
  });
}

/* ══════════════════════════════════════════════
   6. CARD — subtle tilt on mouse move
══════════════════════════════════════════════ */
cards.forEach((card) => {
  if (card.classList.contains("coming-soon")) return; // skip disabled cards

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const rotX = -dy * 6; // degrees
    const rotY = dx * 6;
    card.style.transform = `translateY(-10px) scale(1.025) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

/* ══════════════════════════════════════════════
   7. SMOOTH SCROLL for anchor links
══════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
