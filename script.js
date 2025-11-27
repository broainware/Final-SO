/* ==========================================================
   TOGGLE SIDEBAR
========================================================== */
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

closeSidebarBtn.addEventListener("click", () => {
  sidebar.classList.remove("open");
});

/* ==========================================================
   MANUAL DARK / LIGHT TOGGLE (WITH AUTO-DETECT SUPPORT) <!--Fitur Tambahan Theme -->
========================================================== */
const themeToggle = document.getElementById("themeToggle");

// Fungsi untuk memperbarui ARIA dan penampilan ikon SVG
function updateThemeAppearance(mode) {
  const isDark = mode === "dark";
  themeToggle.setAttribute("aria-pressed", isDark);
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"
  );
  // Tambah: Menambahkan kelas untuk mengontrol penampilan SVG (lihat CSS)
  themeToggle.classList.toggle("dark-mode-active", isDark);
}

// Apply saved theme
const savedTheme = localStorage.getItem("theme");
let initialTheme;

if (savedTheme) {
  initialTheme = savedTheme;
} else {
  // Detect OS theme (fallback)
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  initialTheme = prefersDark ? "dark" : "light";
}

document.documentElement.setAttribute("data-theme", initialTheme);
updateThemeAppearance(initialTheme);

themeToggle.addEventListener("click", () => {
  let current = document.documentElement.getAttribute("data-theme");
  let newTheme = current === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  updateThemeAppearance(newTheme);
});

const helpBubble = document.getElementById('help-bubble');
const helpPopup = document.getElementById('help-popup');
const helpClose = document.getElementById('help-close');

helpBubble.addEventListener('click', () => {
  helpPopup.classList.toggle('show');
});

helpClose.addEventListener('click', () => {
  helpPopup.classList.remove('show');
});

window.addEventListener('click', (e) => {
  if (
    helpPopup.classList.contains('show') &&
    !helpPopup.contains(e.target) &&
    e.target !== helpBubble
  ) {
    helpPopup.classList.remove('show');
  }
});

/* ==========================================================
   TITLE FLOAT ANIMATION BASED ON MOUSE
========================================================== */
const title = document.querySelector(".title");
const subtitles = document.querySelectorAll(".subtitle");

document.addEventListener("mousemove", (e) => {
  const x = (window.innerWidth / 2 - e.clientX) / 50;
  const y = (window.innerHeight / 2 - e.clientY) / 50;

  title.style.transform = `translate(${x}px, ${y}px)`;
  subtitles.forEach(
    (sub) => (sub.style.transform = `translate(${x}px, ${y}px)`)
  );
});

/* ==========================================================
   FLOATING BUBBLES
========================================================== */
for (let i = 0; i < 10; i++) {
  let bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.style.left = Math.random() * 100 + "vw";
  bubble.style.animationDuration = 8 + Math.random() * 10 + "s";
  bubble.style.opacity = 0.2 + Math.random() * 0.4;
  document.body.appendChild(bubble);
}

/* ==========================================================
   PARTICLES
========================================================== */
for (let i = 0; i < 25; i++) {
  let p = document.createElement("div");
  p.classList.add("particle");
  p.style.top = Math.random() * 100 + "vh";
  p.style.left = Math.random() * 100 + "vw";
  p.style.animationDelay = Math.random() * 3 + "s";
  document.body.appendChild(p);
}

/* ==========================================================
   FEATURE CARD HOVER ENHANCEMENT <!--Ganti Fitur Hover -->
========================================================== */
/*Hapus Object feturesCards & methode feturesCards*/
document.querySelectorAll(".feature-card").forEach((card) => {
  /*Tambah Document Querry Selector All*/
  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-12px) scale(1.03)";
  }); /*Mengubah translate & scale*/
  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0) scale(1)";
  });
});