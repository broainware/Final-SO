/* ==========================================================
   TOGGLE SIDEBAR
========================================================== */
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");
const closeSidebarBtn = document.getElementById("closeSidebar"); // Tambah

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  const isExpanded = sidebar.classList.contains("open");
  toggleBtn.setAttribute("aria-expanded", isExpanded);
});

// Tambah: Listener untuk tombol tutup sidebar
closeSidebarBtn.addEventListener("click", () => {
  sidebar.classList.remove("open");
  toggleBtn.setAttribute("aria-expanded", "false");
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
   VIDEO CAROUSEL LOGIC
========================================================== */

const videoSlides = document.querySelectorAll(".video-slide");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const carouselContainer = document.querySelector(".video-carousel");
let currentVideoIndex = 0;

function stopAllVideos() {
  // Menghentikan semua video dengan mereset src iframe
  document.querySelectorAll(".video-slide iframe").forEach((iframe) => {
    const src = iframe.src;
    // Teknik untuk menghentikan playback YouTube
    iframe.src = "";
    iframe.src = src;
  });
}

function updateVideoCarousel() {
  // 1. Hentikan semua video saat berganti slide
  stopAllVideos();

  // 2. Update 'active' class dan visibilitas
  videoSlides.forEach((slide, index) => {
    slide.classList.remove("active");
    // Update aria-label untuk pembaca layar
    slide.setAttribute("aria-hidden", "true");

    if (index === currentVideoIndex) {
      slide.classList.add("active");
      slide.setAttribute("aria-hidden", "false");
    }
  });

  // 3. Update button states (Enable/Disable)
  prevBtn.disabled = currentVideoIndex === 0;
  nextBtn.disabled = currentVideoIndex === videoSlides.length - 1;

  // 4. Update aria-live status (Accessibility)
  if (carouselContainer) {
    carouselContainer.setAttribute("aria-live", "off"); // Matikan sebentar
    setTimeout(() => {
      carouselContainer.setAttribute("aria-live", "polite"); // Aktifkan lagi
    }, 100);
  }
}

// Event Listeners
nextBtn.addEventListener("click", () => {
  if (currentVideoIndex < videoSlides.length - 1) {
    currentVideoIndex++;
    updateVideoCarousel();
  }
});

prevBtn.addEventListener("click", () => {
  if (currentVideoIndex > 0) {
    currentVideoIndex--;
    updateVideoCarousel();
  }
});

// Panggilan awal untuk mengatur slide pertama
updateVideoCarousel();

/* ======= Skip buttons: header + main + video (IntersectionObserver & focus) ======= */
document.addEventListener("DOMContentLoaded", () => {
  // wrappers
  const heroWrap = document.querySelector(".hero-skip-wrap");
  const mainWrap = document.querySelector(".main-skip-wrap");
  const videoWrap = document.querySelector(".video-skip-wrap");

  // target sections
  const heroSection = document.querySelector("header.hero");
  const mainSection = document.getElementById("mainContent");
  const videoSection = document.getElementById("video-section");

  // helper
  function show(wrap) {
    if (!wrap) return;
    wrap.classList.remove("section-skip-hidden");
    wrap.setAttribute("aria-hidden", "false");
  }
  function hide(wrap) {
    if (!wrap) return;
    wrap.classList.add("section-skip-hidden");
    wrap.setAttribute("aria-hidden", "true");
  }

  const opts = { root: null, rootMargin: "0px", threshold: 0.12 };

  // Observe hero: show header buttons only when hero is visible (initial load)
  if (heroSection && heroWrap) {
    const heroObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // jika hero terlihat: tampilkan header buttons
          show(heroWrap);
        } else {
          // jika hero tidak terlihat (user sudah scroll): sembunyikan header buttons
          hide(heroWrap);
        }
      });
    }, opts);
    heroObs.observe(heroSection);
  }

  // Observe main: tampilkan main-skip-wrap saat main terlihat
  if (mainSection && mainWrap) {
    const mainObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) show(mainWrap);
        else hide(mainWrap);
      });
    }, opts);
    mainObs.observe(mainSection);
  }

  // Observe video: tampilkan video-skip-wrap saat video section terlihat
  if (videoSection && videoWrap) {
    const videoObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) show(videoWrap);
        else hide(videoWrap);
      });
    }, opts);
    videoObs.observe(videoSection);
  }

  // Klik semua tombol: fokus target & sembunyikan wrapper sumber supaya tidak menghalangi
  document.querySelectorAll(".section-skip-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const href = btn.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const id = href.slice(1);
      const target = document.getElementById(id);

      // hide the wrap containing this button (so it won't block the view)
      const wrap = btn.closest(
        ".hero-skip-wrap, .main-skip-wrap, .video-skip-wrap"
      );
      if (wrap) hide(wrap);

      if (target) {
        if (!target.hasAttribute("tabindex"))
          target.setAttribute("tabindex", "-1");
        // delay sedikit biar scroll selesai, lalu fokus
        setTimeout(() => {
          target.focus({ preventScroll: true });
        }, 220);
      }
    });
  });
});