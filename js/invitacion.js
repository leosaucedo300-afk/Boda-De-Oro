/* ==========================================================
   PERSONALIZACIÓN RÁPIDA  ✏️
   ========================================================== */
const CONFIG = {
  // WhatsApp que recibe las confirmaciones: formato internacional,
  // solo números y sin "+". Ejemplo ficticio: "18095551234"
  whatsapp: "",

  // Lugar que se pone en el evento del calendario
  // (los botones "Ver ubicación" de la misa y la fiesta están en index.html).
  ubicacion: "Parroquia de la Purísima Concepción, Zumpango",

  // Fecha y hora del evento (formato 24 h). Se usa la hora de la misa.
  fecha: "2026-12-26",
  hora: "17:30",
  duracionHoras: 7,  // para el evento del calendario

  titulo: "Boda de Oro de Andrea y Martin",

  // 🎵 Música: copia tu canción en la carpeta "musica" con el nombre
  // "cancion.mp3". Empieza a sonar al abrir el sobre. Si el archivo
  // no existe, el botón de música simplemente no aparece.
  musica: "musica/cancion.mp3",

  // 🎵 O usa una canción de YouTube: pega aquí el enlace del video
  // (ej.: "https://www.youtube.com/watch?v=XXXXXXXXXXX" o "https://youtu.be/XXXXXXXXXXX").
  // Si pones un enlace aquí, se usa YouTube en lugar del mp3.
  youtube: "https://youtu.be/dmdXGXfohYk",

  musicaVolumen: 0.6,  // 0 a 1
  musicaInicio: 0,     // segundo en que empieza (ej.: 15 para saltar la intro)
};

/* ========================================================== */
(function () {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const dust = GoldDust.create($("dust"), { count: 38, opacity: 0.85 });

  /* ---------- Ramas doradas: se copian como SVG real para poder animarlas ---------- */
  const branchSymbol = document.getElementById("branch");
  document.querySelectorAll("svg.branch").forEach((svg) => {
    svg.setAttribute("viewBox", branchSymbol.getAttribute("viewBox"));
    svg.innerHTML = branchSymbol.innerHTML;
  });

  /* ---------- Música ---------- */
  const musicBtn = $("musicButton");
  // "music" expone play(), pause() y paused, venga de un mp3 o de YouTube
  let music = null;
  const setPlaying = (on) => musicBtn.classList.toggle("playing", on);
  const ytId = youtubeId(CONFIG.youtube);

  // Primero se intenta el mp3 (más confiable en celulares); si no existe, se usa YouTube.
  if (CONFIG.musica) {
    const audio = new Audio(CONFIG.musica);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = CONFIG.musicaVolumen;
    let started = false;
    // Solo mostrar el botón si la canción existe y se puede reproducir
    audio.addEventListener("canplay", () => (musicBtn.hidden = false), { once: true });
    audio.addEventListener("error", () => {
      musicBtn.hidden = true;
      music = ytId ? createYouTubeMusic(ytId) : null;
      if (music && opened) music.play();
    }, { once: true });
    audio.addEventListener("loadedmetadata", () => {
      if (!started && CONFIG.musicaInicio) audio.currentTime = CONFIG.musicaInicio;
    }, { once: true });
    audio.addEventListener("play", () => (started = true), { once: true });
    music = {
      get paused() { return audio.paused; },
      play() { audio.play().then(() => setPlaying(true)).catch(() => {}); },
      pause() { audio.pause(); setPlaying(false); },
    };
  } else if (ytId) {
    music = createYouTubeMusic(ytId);
  }
  if (music) musicBtn.addEventListener("click", () => (music && music.paused ? playMusic() : pauseMusic()));

  function playMusic() {
    if (!music) return;
    musicBtn.hidden = false;
    music.play();
  }
  function pauseMusic() {
    if (music) music.pause();
  }

  function youtubeId(url) {
    const m = String(url || "").match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|shorts|live)\/)([\w-]{11})/);
    return m ? m[1] : (/^[\w-]{11}$/.test(url) ? url : "");
  }

  // Reproductor de YouTube invisible (solo se escucha el audio)
  function createYouTubeMusic(id) {
    let player = null;
    let ready = false;
    let wantPlay = false;
    let isPaused = true;

    const holder = document.createElement("div");
    holder.className = "yt-music";
    holder.setAttribute("aria-hidden", "true");
    holder.innerHTML = '<div id="ytPlayer"></div>';
    document.body.appendChild(holder);

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      player = new YT.Player("ytPlayer", {
        width: 200, height: 200, videoId: id,
        playerVars: {
          playsinline: 1, controls: 0, disablekb: 1, rel: 0,
          loop: 1, playlist: id, start: CONFIG.musicaInicio || 0,
        },
        events: {
          onReady: () => {
            ready = true;
            player.setVolume(Math.round(CONFIG.musicaVolumen * 100));
            musicBtn.hidden = false;
            if (wantPlay) player.playVideo();
          },
          onStateChange: (e) => {
            isPaused = e.data !== YT.PlayerState.PLAYING;
            setPlaying(!isPaused);
          },
          onError: () => { music = null; musicBtn.hidden = true; holder.remove(); },
        },
      });
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = () => { music = null; musicBtn.hidden = true; };
    document.head.appendChild(tag);

    return {
      get paused() { return isPaused; },
      play() { wantPlay = true; if (ready) player.playVideo(); },
      pause() { wantPlay = false; if (ready) player.pauseVideo(); },
    };
  }

  /* ---------- Sobre de la intro ---------- */
  const intro = $("intro");
  const envelope = $("envelope");
  let opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;
    playMusic();
    if (navigator.vibrate) navigator.vibrate(30);

    const finish = () => {
      intro.classList.add("is-done");
      document.body.classList.remove("locked");
      document.body.classList.add("revealed");
      window.scrollTo(0, 0);
      setTimeout(() => intro.remove(), 1100);
    };

    if (reduceMotion) return finish();

    intro.classList.add("is-opening");
    envelope.classList.add("is-opening");

    const seal = $("sealButton").getBoundingClientRect();
    dust.burst(seal.left + seal.width / 2, seal.top + seal.height / 2, 60, 0.8);

    // Cuando la carta termina de salir: lluvia dorada y entrada al hero
    setTimeout(() => {
      const r = envelope.getBoundingClientRect();
      dust.burst(r.left + r.width / 2, r.top, 140, 1.25);
    }, 1500);
    setTimeout(finish, 2600);
  }

  envelope.addEventListener("click", openEnvelope);
  // Si alguien llega con un #enlace directo, igual se muestra el sobre primero.

  /* ---------- Destellos al tocar la página ---------- */
  document.addEventListener("pointerdown", (e) => {
    if (!opened || e.target.closest("input, select, textarea")) return;
    dust.burst(e.clientX, e.clientY, 10, 0.45);
  });

  /* ---------- Cuenta regresiva ---------- */
  const eventDate = new Date(CONFIG.fecha + "T" + (CONFIG.hora || "00:00") + ":00");
  const cdBox = $("countdown");
  const cells = {};
  cdBox.querySelectorAll(".cd-num").forEach((el) => (cells[el.dataset.unit] = el));

  function setCell(unit, value) {
    const el = cells[unit];
    const text = String(value).padStart(2, "0");
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove("tick");
    void el.offsetWidth; // reinicia la animación
    el.classList.add("tick");
  }
  function updateCountdown() {
    let diff = Math.max(0, eventDate - new Date());
    if (diff === 0) {
      cdBox.innerHTML = '<p class="countdown-done">¡Hoy celebramos!</p>';
      clearInterval(timer);
      return;
    }
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
    const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    setCell("d", d); setCell("h", h); setCell("m", m); setCell("s", s);
  }
  const timer = setInterval(updateCountdown, 1000);
  updateCountdown();

  /* ---------- Revelado al hacer scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      revealObserver.unobserve(entry.target);
      if (entry.target.id === "ring") countTo50();
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));

  /* ---------- Contador 0 → 50 con anillo ---------- */
  function countTo50() {
    const num = $("countUp");
    const ring = document.querySelector(".ring-fill");
    const circ = 339.3;
    const duration = reduceMotion ? 0 : 2200;
    const t0 = performance.now();
    function step(now) {
      const p = duration ? Math.min(1, (now - t0) / duration) : 1;
      const eased = 1 - Math.pow(1 - p, 3);
      num.textContent = Math.round(eased * 50);
      ring.style.strokeDashoffset = circ * (1 - eased);
      if (p < 1) requestAnimationFrame(step);
      else {
        const r = num.getBoundingClientRect();
        dust.burst(r.left + r.width / 2, r.top + r.height / 2, 40, 0.7);
      }
    }
    requestAnimationFrame(step);
  }

  /* ---------- Línea del tiempo que se llena con el scroll ---------- */
  const timeline = $("timeline");
  const tlFill = $("tlFill");
  const tlItems = timeline.querySelectorAll(".tl-item");
  let ticking = false;
  function updateTimeline() {
    ticking = false;
    const r = timeline.getBoundingClientRect();
    const mid = window.innerHeight * 0.6;
    const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
    tlFill.style.setProperty("--p", p.toFixed(3));
    tlItems.forEach((item) => {
      const dot = item.querySelector(".tl-dot").getBoundingClientRect();
      item.classList.toggle("lit", dot.top < mid);
    });
  }
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateTimeline); }
  }, { passive: true });
  addEventListener("resize", updateTimeline);
  updateTimeline();

  /* ---------- Galería + visor ---------- */
  const lightbox = $("lightbox");
  document.querySelectorAll(".photo img").forEach((img) => {
    const fig = img.closest(".photo");
    const markEmpty = () => fig.classList.add("empty");
    if (img.complete && img.naturalWidth === 0) markEmpty();
    img.addEventListener("error", markEmpty);
    fig.addEventListener("click", () => {
      if (fig.classList.contains("empty")) return;
      $("lbImg").src = img.src;
      $("lbImg").alt = img.alt;
      $("lbCaption").textContent = fig.querySelector("figcaption")?.textContent.trim() || "";
      lightbox.hidden = false;
      document.body.classList.add("locked");
    });
  });
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("locked");
  }
  lightbox.addEventListener("click", (e) => { if (e.target !== $("lbImg")) closeLightbox(); });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    if ((e.key === "Enter" || e.key === " ") && !opened && document.activeElement === document.body) openEnvelope();
  });

  /* ---------- Agregar al calendario (.ics) ---------- */
  $("calendarButton").addEventListener("click", () => {
    const pad = (n) => String(n).padStart(2, "0");
    const ymd = CONFIG.fecha.replace(/-/g, "");
    let start, end;
    if (CONFIG.hora) {
      const s = new Date(CONFIG.fecha + "T" + CONFIG.hora + ":00");
      const e = new Date(s.getTime() + CONFIG.duracionHoras * 36e5);
      const fmt = (d) => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";
      start = "DTSTART:" + fmt(s);
      end = "DTEND:" + fmt(e);
    } else {
      const next = new Date(CONFIG.fecha + "T00:00:00");
      next.setDate(next.getDate() + 1);
      start = "DTSTART;VALUE=DATE:" + ymd;
      end = "DTEND;VALUE=DATE:" + next.getFullYear() + pad(next.getMonth() + 1) + pad(next.getDate());
    }
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BodasDeOro//ES", "BEGIN:VEVENT",
      "UID:bodas-de-oro-" + ymd + "@invitacion",
      "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
      start, end,
      "SUMMARY:" + CONFIG.titulo,
      "LOCATION:" + (CONFIG.ubicacion || ""),
      "DESCRIPTION:Misa 5:30 pm en la Parroquia de la Purísima Concepción. Fiesta 7:30 pm en casa. ¡Te esperamos para celebrar 50 años de amor! " + pageUrl(),
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = "bodas-de-oro.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  /* ---------- Confirmación por WhatsApp ---------- */
  const form = $("rsvpForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameField = $("rsvpName");
    const name = nameField.value.trim();
    const errorEl = $("rsvpError");
    nameField.parentElement.classList.remove("invalid");
    if (!name) {
      void nameField.offsetWidth;
      nameField.parentElement.classList.add("invalid");
      errorEl.textContent = "Por favor escribe tu nombre.";
      nameField.focus();
      return;
    }
    errorEl.textContent = "";

    const attend = $("rsvpAttend").value === "si";
    const guests = $("rsvpGuests").value;
    const note = $("rsvpMsg").value.trim();
    let msg = attend
      ? `¡Hola! Soy ${name} y confirmo mi asistencia a la Boda de Oro de Andrea y Martin el 26 de diciembre de 2026. ❤️\nPersonas: ${guests}`
      : `¡Hola! Soy ${name}. Lamentablemente no podré asistir a la Boda de Oro de Andrea y Martin, pero les envío todo mi cariño. ❤️`;
    if (note) msg += `\nMensaje: ${note}`;

    // api.whatsapp.com conserva los emojis (wa.me a veces los cambia por "�")
    const number = CONFIG.whatsapp.trim();
    const url = "https://api.whatsapp.com/send?" + (number ? "phone=" + number + "&" : "") + "text=" + encodeURIComponent(msg);

    const r = form.querySelector("button[type=submit]").getBoundingClientRect();
    dust.burst(r.left + r.width / 2, r.top, 70, 0.9);
    setTimeout(() => window.open(url, "_blank", "noopener"), 450);
  });

  /* ---------- Compartir ---------- */
  function pageUrl() {
    // Comparte la portada si existe (para que vean primero la imagen)
    return location.href.split("#")[0].replace(/index\.html$/, "portada.html");
  }
  $("shareButton").addEventListener("click", async () => {
    const text = "✨ Estás invitado/a a la Boda de Oro de Andrea y Martin · 50 años de amor · 26 de diciembre de 2026.";
    if (navigator.share) {
      try { await navigator.share({ title: CONFIG.titulo, text, url: pageUrl() }); return; }
      catch (err) { if (err.name === "AbortError") return; }
    }
    window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n\nAbre la invitación aquí: " + pageUrl()), "_blank", "noopener");
  });
})();
