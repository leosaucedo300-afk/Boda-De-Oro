/* ==========================================================
   PORTADA · inclinación 3D, reflejo y transición de apertura
   ========================================================== */
(function () {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const dust = GoldDust.create(document.getElementById("dust"), { count: 50 });
  const card = document.getElementById("card");
  const inner = document.getElementById("cardInner");
  let opening = false;

  // ----- Inclinación 3D con el mouse (escritorio) -----
  if (finePointer && !reduceMotion) {
    card.addEventListener("pointermove", (e) => {
      if (opening) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      inner.style.setProperty("--ry", ((x - 0.5) * 14).toFixed(2) + "deg");
      inner.style.setProperty("--rx", ((0.5 - y) * 12).toFixed(2) + "deg");
      inner.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      inner.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      card.classList.add("is-hover");
    });
    card.addEventListener("pointerleave", () => {
      inner.style.setProperty("--rx", "0deg");
      inner.style.setProperty("--ry", "0deg");
      card.classList.remove("is-hover");
    });
  }

  // ----- Pequeño destello al tocar (celular) -----
  card.addEventListener("pointerdown", (e) => {
    if (!opening) dust.burst(e.clientX, e.clientY, 14, 0.5);
  });

  // ----- Abrir: zoom al sello + destello dorado + navegación -----
  card.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // abrir en otra pestaña
    if (reduceMotion) return;                           // navegación normal
    e.preventDefault();
    if (opening) return;
    opening = true;

    inner.style.setProperty("--rx", "0deg");
    inner.style.setProperty("--ry", "0deg");

    const r = inner.getBoundingClientRect();
    const sx = r.left + r.width * 0.515;
    const sy = r.top + r.height * 0.511;
    dust.burst(sx, sy, 110, 1.1);
    if (navigator.vibrate) navigator.vibrate(25);

    document.body.classList.add("opening");
    setTimeout(() => { window.location.href = card.href; }, 1250);
  });

  // Si el usuario vuelve con el botón "atrás", restaurar la portada
  addEventListener("pageshow", (e) => {
    if (e.persisted) {
      opening = false;
      document.body.classList.remove("opening");
    }
  });
})();
