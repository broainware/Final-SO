
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");
const scrollContainer = document.querySelector(".scroll-container");

toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    scrollContainer.classList.toggle("shifted"); // Sekarang ini akan menggeser konten
    console.log("Sidebar toggled"); // Tambahkan ini untuk debug: buka console browser (F12) dan lihat apakah event terdeteksi
});

document.addEventListener("DOMContentLoaded", () => {
    const content = document.querySelector("main"); // bagian konten utama
    content.classList.add("fade-up");

    setTimeout(() => {
        content.classList.add("show");
    }, 50);
});

/* --- MOUSE MOVEMENT PADA SECTION-TITLE --- */
const sectionTitles = document.querySelectorAll(".section-title");

document.addEventListener("mousemove", (e) => {
    const x = (window.innerWidth / 2 - e.clientX) / 50;
    const y = (window.innerHeight / 2 - e.clientY) / 50;

    sectionTitles.forEach(title => {
        title.style.transform = `translate(${x}px, ${y}px)`;
    });
});

/* --- CREATE FLOATING BUBBLES --- */
for (let i = 0; i < 10; i++) {
    let bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.style.left = Math.random() * 100 + "vw";
    bubble.style.animationDuration = 8 + Math.random() * 10 + "s";
    bubble.style.opacity = 0.2 + Math.random() * 0.4;
    document.body.appendChild(bubble);
}

/* --- CREATE PARTICLES --- */
for (let i = 0; i < 25; i++) {
    let p = document.createElement("div");
    p.classList.add("particle");
    p.style.top = Math.random() * 100 + "vh";
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDelay = Math.random() * 3 + "s";
    document.body.appendChild(p);
}
// Array foto untuk slideshow
const slides = ['kelompok1.jpg', 'kelompok2.jpg', 'kelompok3.jpg'];
let currentSlide = 0; // Index slide saat ini
let autoSlideInterval; // Variabel untuk interval auto-slide

// Elemen slideshow
const slidesContainer = document.querySelector('.slides-container');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// Debug: Pastikan elemen ditemukan
console.log('slidesContainer:', slidesContainer);
console.log('prevBtn:', prevBtn);
console.log('nextBtn:', nextBtn);

// Fungsi untuk update slide
function updateSlide() {
    const offset = -currentSlide * 100; // Geser berdasarkan persen
    slidesContainer.style.transform = `translateX(${offset}%)`;
    console.log('Slide updated to:', currentSlide); // Debug
}

// Fungsi next slide (geser ke kanan)
function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length; // Loop ke awal
    updateSlide();
}

// Fungsi prev slide (geser ke kiri)
function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length; // Loop ke akhir
    updateSlide();
}

// Fungsi start auto-slide
function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000); // Geser otomatis setiap 5 detik
    console.log('Auto-slide started');
}

// Fungsi stop auto-slide (untuk pause saat manual)
function stopAutoSlide() {
    clearInterval(autoSlideInterval);
    console.log('Auto-slide stopped');
}

// Event listener untuk tombol (manual control) - dengan debug
if (prevBtn && nextBtn) {
    nextBtn.addEventListener('click', () => {
        console.log('Next button clicked'); // Debug
        stopAutoSlide(); // Pause auto saat manual
        nextSlide();
        startAutoSlide(); // Restart auto setelah manual
    });

    prevBtn.addEventListener('click', () => {
        console.log('Prev button clicked'); // Debug
        stopAutoSlide(); // Pause auto saat manual
        prevSlide();
        startAutoSlide(); // Restart auto setelah manual
    });
} else {
    console.error('prevBtn atau nextBtn tidak ditemukan! Periksa HTML.');
}

// Inisialisasi slide pertama dan start auto-slide
if (slidesContainer) {
    updateSlide();
    startAutoSlide();
} else {
    console.error('slidesContainer tidak ditemukan! Periksa HTML.');
}

/* --- FAQ ACCORDION FUNCTIONALITY --- */
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        // Toggle active class
        item.classList.toggle('active');
        
        // Close other items (optional: jika ingin hanya satu terbuka)
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });
    });
});
document.addEventListener("DOMContentLoaded", () => {
    const fadeElements = document.querySelectorAll(".fade-up");

    // Jalankan setelah render awal selesai
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            fadeElements.forEach(el => el.classList.add("show"));
        });
    });
});
document.addEventListener("DOMContentLoaded", () => {
    const firstLoad = sessionStorage.getItem("firstLoadDone");

    const section1 = document.querySelector(".section-1");
    const fadeItems = section1.querySelectorAll(".fade-up");

    if (!firstLoad) {
        // Pertama kali buka halaman → jalankan animasi section 1
        fadeItems.forEach(el => el.classList.add("show"));

        sessionStorage.setItem("firstLoadDone", "true");

    } else {
        // Bukan pertama → tampil normal tanpa animasi
        fadeItems.forEach(el => el.classList.add("show"));
    }
});

// ============================
// 1. SIMPAN POSISI SCROLL
// ============================
window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("scrollPos", window.scrollY);
});

// ============================
// 2. KEMBALIKAN POSISI SCROLL
// ============================
document.addEventListener("DOMContentLoaded", () => {
    const saved = sessionStorage.getItem("scrollPos");

    if (saved !== null) {
        window.scrollTo(0, parseFloat(saved));
    }
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