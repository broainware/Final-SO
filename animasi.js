const navigasi = document.getElementById("navigasi");
const toggleBtn = document.getElementById("toggleBtn");
const scrollContainer = document.querySelector(".scroll-container");

toggleBtn.addEventListener("click", () => {
    navigasi.classList.toggle("open");
    scrollContainer.classList.toggle("shifted"); // Geser konten saat sidebar toggle
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