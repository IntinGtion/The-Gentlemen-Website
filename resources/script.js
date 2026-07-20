// The Gentlemen – UI helpers (no frameworks, no dependencies)

document.addEventListener("DOMContentLoaded", () => {
  initDynamicCards();
  initSlideshow();
  initSpieltag();
  initMemberLinks();
  initNews();
  initNewsButton();
  initMobileNav();
});

async function initDynamicCards() {
  // Team
  const teamGrid = document.getElementById("teamGrid");
  if (teamGrid) {
    const status = document.getElementById("teamGridStatus");
    const src = teamGrid.getAttribute("data-source") || "data/team.json";

    try {
      setStatus(status, "Lade Mitglieder…");
      const data = await fetchJson(src);
      renderMembers(teamGrid, (data && data.members) || []);
      setStatus(status, "");
    } catch (err) {
      setStatus(status, buildLocalHint(err));
    }
  }

  // Fields
  const regularGrid = document.getElementById("fieldsRegularGrid");
  const visitedGrid = document.getElementById("fieldsVisitedGrid");
  if (regularGrid || visitedGrid) {
    const src = (regularGrid || visitedGrid).getAttribute("data-source") || "data/fields.json";

    let data;
    try {
      const status = document.getElementById("fieldsRegularStatus") || document.getElementById("fieldsVisitedStatus");
      setStatus(status, "Lade Spielfelder…");
      data = await fetchJson(src);
      setStatus(status, "");
    } catch (err) {
      const statusA = document.getElementById("fieldsRegularStatus");
      const statusB = document.getElementById("fieldsVisitedStatus");
      const hint = buildLocalHint(err);
      setStatus(statusA, hint);
      setStatus(statusB, hint);
      return;
    }

    if (regularGrid) {
      const status = document.getElementById("fieldsRegularStatus");
      renderFields(regularGrid, (data && data.regular) || []);
      setStatus(status, "");
    }

    if (visitedGrid) {
      const status = document.getElementById("fieldsVisitedStatus");
      renderFields(visitedGrid, (data && data.visited) || []);
      setStatus(status, "");
    }
  }

  // Gallery
  const galleryGrid = document.getElementById("galleryGrid");
  const galleryAlbums = document.getElementById("galleryAlbums");
  if (galleryGrid && galleryAlbums) {
    const status = document.getElementById("galleryStatus");
    const rootEl = document.getElementById("galleryRoot");
    const src = (rootEl && rootEl.getAttribute("data-source")) || "data/gallery.json";

    try {
      setStatus(status, "Lade Galerie…");
      const data = await fetchJson(src);
      renderGallery({ albumsEl: galleryAlbums, gridEl: galleryGrid, statusEl: status }, (data && data.albums) || []);
      setStatus(status, "");
    } catch (err) {
      setStatus(status, buildLocalHint(err));
    }
  }

}

async function initSpieltag() {
  const block = document.getElementById("spieltagBlock");
  if (!block) return;

  const src = block.getAttribute("data-source") || "data/spieltag.json";

  let data;
  try {
    data = await fetchJson(src);
  } catch {
    return;
  }

  const date = safeText(data && data.date);
  const location = safeText(data && data.location);
  const info = safeText(data && data.info);
  const confirmed = !!(data && data.confirmed);

  const dateLabel = date ? formatSpieltag(date) : "Datum folgt";
  const locationLabel = location || "Ort folgt";

  const note = document.createElement("div");
  note.className = "note";

  const strong = document.createElement("strong");
  strong.textContent = confirmed ? "Bestätigt" : "Nächster Spieltag";
  note.appendChild(strong);

  const pills = document.createElement("div");
  pills.className = "pills";

  const locPill = document.createElement("span");
  locPill.className = "pill";
  locPill.textContent = "📍 " + locationLabel;
  pills.appendChild(locPill);

  const datePill = document.createElement("span");
  datePill.className = "pill";
  datePill.textContent = "🗓️ " + dateLabel;
  pills.appendChild(datePill);

  note.appendChild(pills);

  if (info) {
    const p = document.createElement("p");
    p.className = "muted";
    p.style.marginTop = "8px";
    p.style.marginBottom = "0";
    p.textContent = info;
    note.appendChild(p);
  }

  block.appendChild(note);
}

function formatSpieltag(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

async function initMemberLinks() {
  const container = document.getElementById("memberLinks");
  if (!container) return;

  const src = container.getAttribute("data-source") || "data/team.json";

  let data;
  try {
    data = await fetchJson(src);
  } catch {
    return;
  }

  const members = Array.isArray(data && data.members) ? data.members : [];
  const withLinks = members.filter(
    (m) => Array.isArray(m && m.links) && m.links.length > 0
  );

  if (!withLinks.length) return;

  const list = document.createElement("div");
  list.className = "member-links-list";

  withLinks.forEach((m) => {
    const callsign = safeText(m.callsign || m.name) || "Member";
    const links = (m.links || [])
      .map((l) => ({ label: safeText(l && l.label), url: safeText(l && l.url) }))
      .filter((l) => l.label && l.url);

    if (!links.length) return;

    const row = document.createElement("div");
    row.className = "member-links-row";

    const nameEl = document.createElement("div");
    nameEl.className = "member-links-row__name";
    nameEl.textContent = callsign;
    row.appendChild(nameEl);

    const pills = document.createElement("div");
    pills.className = "pills pills--auto";

    links.forEach((l) => {
      const a = document.createElement("a");
      a.className = "pill pill--small pill--link";
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = l.label;
      pills.appendChild(a);
    });

    row.appendChild(pills);
    list.appendChild(row);
  });

  container.appendChild(list);
}

function initMobileNav() {
  const nav = document.querySelector("nav.tabs");
  const topbar = document.querySelector(".topbar");
  if (!nav || !topbar) return;

  nav.id = nav.id || "mainNav";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav-toggle";
  btn.setAttribute("aria-label", "Navigation öffnen");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "mainNav");
  btn.innerHTML = "<span></span><span></span><span></span>";
  topbar.appendChild(btn);

  function setOpen(open) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Navigation schließen" : "Navigation öffnen");
    nav.classList.toggle("is-open", open);
  }

  btn.addEventListener("click", () => {
    setOpen(btn.getAttribute("aria-expanded") !== "true");
  });

  // Auto-close when a link is clicked (navigating away on mobile)
  nav.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 980px)").matches) setOpen(false);
    });
  });
}

async function initNewsButton() {
  let neuigkeit;
  try {
    neuigkeit = await fetchJson("data/neuigkeit.json");
  } catch {
    return;
  }

  if (!neuigkeit || !neuigkeit.aktiv || !safeText(neuigkeit.titel)) return;

  const btn = document.createElement("a");
  btn.className = "news-fab";
  btn.setAttribute("aria-label", "Neuigkeit anzeigen");

  const onStartPage = !!document.getElementById("newsBlock");
  btn.href = onStartPage ? "#newsBlock" : "start.html#newsBlock";

  if (onStartPage) {
    btn.addEventListener("click", (e) => {
      const target = document.getElementById("newsBlock");
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  const img = document.createElement("img");
  img.src = "resources/brand/badge.png";
  img.alt = "";
  img.className = "news-fab__logo";
  btn.appendChild(img);

  const label = document.createElement("span");
  label.className = "news-fab__label";
  label.textContent = "News";
  btn.appendChild(label);

  document.body.appendChild(btn);
}

async function initNews() {
  const block = document.getElementById("newsBlock");
  if (!block) return;

  const berichteSrc = block.getAttribute("data-source") || "data/berichte.json";

  const [posts, neuigkeit] = await Promise.all([
    fetchJson(berichteSrc).catch(() => null),
    fetchJson("data/neuigkeit.json").catch(() => null),
  ]);

  // ---- Pinned manual entry ----
  if (neuigkeit && neuigkeit.aktiv && safeText(neuigkeit.titel)) {
    const url = safeText(neuigkeit.link_url);
    const el = url ? document.createElement("a") : document.createElement("div");
    el.className = "news-item news-item--pin";
    if (url) el.href = url;

    const meta = document.createElement("span");
    meta.className = "news-item__meta";
    const metaParts = ["Neuigkeit"];
    const nDatum = safeText(neuigkeit.datum);
    if (nDatum) {
      try {
        const d = new Date(nDatum);
        metaParts.push(isNaN(d) ? nDatum : d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }));
      } catch { metaParts.push(nDatum); }
    }
    meta.textContent = metaParts.join(" · ");
    el.appendChild(meta);

    const titleEl = document.createElement("span");
    titleEl.className = "news-item__title";
    titleEl.textContent = safeText(neuigkeit.titel);
    el.appendChild(titleEl);

    const text = safeText(neuigkeit.text);
    if (text) {
      const textEl = document.createElement("span");
      textEl.className = "news-item__intro muted";
      textEl.textContent = text;
      el.appendChild(textEl);
    }

    const linkLabel = safeText(neuigkeit.link_label);
    if (linkLabel && url) {
      const linkEl = document.createElement("span");
      linkEl.className = "news-item__link";
      linkEl.textContent = "→ " + linkLabel;
      el.appendChild(linkEl);
    }

    block.appendChild(el);
  }

  // ---- Auto-Berichte ----
  if (!Array.isArray(posts) || !posts.length) return;

  posts.slice(0, 3).forEach((post) => {
    const title = safeText(post && post.titel) || "Spielbericht";
    const datum = safeText(post && post.datum);
    const intro = safeText(post && post.intro);
    const feld = safeText(post && post.feld);

    const a = document.createElement("a");
    a.className = "news-item";
    a.href = "berichte.html";

    const meta = document.createElement("span");
    meta.className = "news-item__meta muted";
    const parts = [];
    if (datum) {
      try {
        const d = new Date(datum);
        parts.push(isNaN(d) ? datum : d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }));
      } catch { parts.push(datum); }
    }
    if (feld) parts.push(feld);
    meta.textContent = parts.join(" · ");
    a.appendChild(meta);

    const titleEl = document.createElement("span");
    titleEl.className = "news-item__title";
    titleEl.textContent = title;
    a.appendChild(titleEl);

    if (intro) {
      const introEl = document.createElement("span");
      introEl.className = "news-item__intro muted";
      introEl.textContent = intro;
      a.appendChild(introEl);
    }

    block.appendChild(a);
  });
}

async function initSlideshow() {
  const root = document.querySelector(".slideshow");
  if (!root) return;

  // Prevent double init (e.g., script included twice)
  if (root.dataset.slideshowInit === "1") return;
  root.dataset.slideshowInit = "1";

  const imgA = root.querySelector(".slide--a");
  const imgB = root.querySelector(".slide--b");
  if (!imgA || !imgB) return;

  const src = root.getAttribute("data-source") || "data/media.json";

  let config;
  try {
    config = await fetchJson(src);
  } catch {
    return; // keep fallback gradient
  }

  const images = Array.isArray(config && config.images) ? config.images : [];
  if (!images.length) return;

  const seconds = Math.max(3, Number(config && config.rotationSeconds) || 8);
  const randomize = !!(config && config.randomize);

  const pool = images
    .map((x) => ({ src: safeText(x && x.src), alt: safeText(x && x.alt) }))
    .filter((x) => x.src);

  if (!pool.length) return;

  // ---- helpers ----
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // "Deck" gives nicer random: each image once per round
  let deck = [...Array(pool.length).keys()];
  if (randomize) shuffle(deck);
  let deckPos = 0;

  // pick first
  let idx = deck[deckPos++];
  let showingA = true;

  let timerId = null;
  let busy = false;

  async function setSlideDecoded(imgEl, item) {
    imgEl.alt = item.alt || "";
    imgEl.src = item.src;

    // Wait until the browser decoded the image -> prevents "flash of previous image"
    try {
      if (typeof imgEl.decode === "function") {
        await imgEl.decode();
      } else {
        await new Promise((resolve, reject) => {
          imgEl.onload = () => resolve();
          imgEl.onerror = () => reject(new Error("image load failed"));
        });
      }
    } catch {
      // If decode fails, we still proceed (better than freezing)
    }
  }

  function nextIndex() {
    if (pool.length === 1) return 0;

    if (!randomize) return (idx + 1) % pool.length;

    if (deckPos >= deck.length) {
      deck = [...Array(pool.length).keys()];
      shuffle(deck);

      // avoid immediate repeat after reshuffle
      if (deck[0] === idx) deck.push(deck.shift());
      deckPos = 0;
    }
    return deck[deckPos++];
  }

  async function step() {
    if (busy) return;
    busy = true;

    const next = nextIndex();
    const incoming = showingA ? imgB : imgA;
    const outgoing = showingA ? imgA : imgB;

    // 1) set & decode incoming image first
    await setSlideDecoded(incoming, pool[next]);

    // 2) then crossfade (now the correct pixels are ready)
    incoming.classList.remove("is-visible");
    void incoming.offsetWidth; // reflow to ensure transition triggers
    incoming.classList.add("is-visible");
    outgoing.classList.remove("is-visible");

    showingA = !showingA;
    idx = next;

    busy = false;

    timerId = window.setTimeout(step, seconds * 1000);
  }

  // start: set first image decoded and show it
  await setSlideDecoded(imgA, pool[idx]);
  imgA.classList.add("is-visible");

  timerId = window.setTimeout(step, seconds * 1000);

  // cleanup (important for SPA-like navigation / reloads)
  window.addEventListener("pagehide", () => {
    if (timerId) window.clearTimeout(timerId);
    timerId = null;
  });

  document.addEventListener("visibilitychange", () => {
    // optional: pause when tab hidden, resume when visible
    if (document.hidden) {
      if (timerId) window.clearTimeout(timerId);
      timerId = null;
    } else if (!timerId) {
      timerId = window.setTimeout(step, 600); // quick resume, but not instant
    }
  });
}

function setSlide(img, item) {
  img.alt = item.alt || "";
  img.src = item.src;
}

function setStatus(el, text) {
  if (!el) return;
  el.textContent = text || "";
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error("HTTP " + res.status + " for " + path);
  }
  return await res.json();
}

function renderMembers(container, members) {
  container.innerHTML = "";

  if (!Array.isArray(members) || members.length === 0) {
    container.appendChild(makeEmptyCard("Noch keine Member eingetragen.", "Trag sie in data/team.json ein."));
    return;
  }

  // Ensure modal exists once (about.html uses this grid)
  const modal = ensureMemberModal();

  members.forEach((m) => {
    const callsign = safeText(m && (m.callsign || m.name)) || "Member";
    const subtitle = safeText(m && m.subtitle) || "";
    const tags = Array.isArray(m && m.tags) ? m.tags : [];
    const photo = safeText(m && m.photo) || "";

    const article = document.createElement("article");
    article.className = "card card--click";
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", "Steckbrief öffnen: " + callsign);

    const wrap = document.createElement("div");
    wrap.className = "person";

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    if (photo) {
      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = callsign;
      img.src = photo;
      avatar.appendChild(img);
    } else {
      avatar.textContent = initialsFrom(callsign);
      avatar.setAttribute("aria-hidden", "true");
    }

    const meta = document.createElement("div");

    const h3 = document.createElement("h3");
    h3.textContent = callsign;
    meta.appendChild(h3);

    if (subtitle) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = subtitle;
      meta.appendChild(p);
    }

    if (tags.length) {
      meta.appendChild(buildTagRow(tags));
    }

    wrap.appendChild(avatar);
    wrap.appendChild(meta);

    article.appendChild(wrap);

    const open = () => openMemberModal(modal, m, { callsign, photo });
    article.addEventListener("click", open);
    article.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        open();
      }
    });

    container.appendChild(article);
  });

  // Equalize all card heights so the grid looks uniform
  document.fonts.ready.then(() => {
    if (window.matchMedia("(max-width: 520px)").matches) return;
    const cards = Array.from(container.querySelectorAll(".card"));
    if (cards.length < 2) return;
    cards.forEach((c) => { c.style.minHeight = ""; });
    const maxH = cards.reduce((m, c) => Math.max(m, c.offsetHeight), 0);
    if (maxH > 0) cards.forEach((c) => { c.style.minHeight = maxH + "px"; });
  });
}

function renderFields(container, fields) {
  container.innerHTML = "";

  if (!Array.isArray(fields) || fields.length === 0) {
    container.appendChild(makeEmptyCard("Noch keine Spielfelder eingetragen.", "Trag sie in data/fields.json ein."));
    return;
  }

  // Ensure modal exists once (spielfelder.html uses these grids)
  const modal = ensureFieldModal();

  fields.forEach((f) => {
    const name = safeText(f && f.name) || "Spielfeld";
    const location = safeText(f && f.location) || "";
    const type = safeText(f && f.type) || "";
    const oneLiner = safeText(f && f.oneLiner) || "";
    const tags = Array.isArray(f && f.tags) ? f.tags : [];
    const url = safeText(f && f.url) || "";

    const article = document.createElement("article");
    article.className = "card card--click";
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", "Bericht öffnen: " + name);

    const h3 = document.createElement("h3");
    h3.textContent = name + (location ? " (" + location + ")" : "");
    article.appendChild(h3);

    const metaBits = [];
    if (type) metaBits.push(type);
    if (tags && tags.length) metaBits.push(tags.join(" • "));

    if (metaBits.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = metaBits.join(" • ");
      article.appendChild(p);
    }

    if (oneLiner) {
      const p2 = document.createElement("p");
      p2.textContent = oneLiner;
      article.appendChild(p2);
    }

    if (url) {
      const a = document.createElement("a");
      a.className = "card-link";
      a.textContent = "Website";
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      // Clicking the website link should not open the report modal.
      a.addEventListener("click", (ev) => ev.stopPropagation());
      article.appendChild(a);
    }

    const open = () => openFieldModal(modal, f);
    article.addEventListener("click", open);
    article.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        open();
      }
    });

    container.appendChild(article);
  });
}


/* ---------- Gallery (Albums + Lightbox) ---------- */

function renderGallery(ctx, albums) {
  const albumsEl = ctx.albumsEl;
  const gridEl = ctx.gridEl;

  albumsEl.innerHTML = "";
  gridEl.innerHTML = "";

  // make albums container a tablist (works for both horizontal & vertical)
  albumsEl.setAttribute("role", "tablist");
  albumsEl.setAttribute("aria-label", "Alben");

  if (!Array.isArray(albums) || albums.length === 0) {
    gridEl.appendChild(makeEmptyCard("Noch keine Bilder eingetragen.", "Trag sie in data/gallery.json ein."));
    return;
  }

  // normalize albums/items
  const normAlbums = albums
    .filter((a) => a && typeof a === "object")
    .map((a) => ({
      id: safeText(a.id) || safeText(a.title) || "album",
      title: safeText(a.title) || safeText(a.id) || "Album",
      items: Array.isArray(a.items)
        ? a.items
            .filter((it) => it && typeof it === "object")
            .map((it) => ({
              src: safeText(it.src),
              thumb: safeText(it.thumb),
              alt: safeText(it.alt),
              meta: safeText(it.meta),
            }))
            .filter((it) => it.src)
        : [],
    }))
    .filter((a) => a.items.length > 0);

  if (!normAlbums.length) {
    gridEl.appendChild(makeEmptyCard("Keine gültigen Bilder gefunden.", "Bitte prüfe data/gallery.json (items[].src)."));
    return;
  }

  const modal = ensureGalleryModal();

  let activeAlbum = 0;

  function setActiveAlbum(index, focusTab) {
    activeAlbum = Math.max(0, Math.min(index, normAlbums.length - 1));

    // update tabs
    const tabs = albumsEl.querySelectorAll("[role='tab']");
    tabs.forEach((t, i) => {
      const selected = i === activeAlbum;
      t.setAttribute("aria-selected", selected ? "true" : "false");
      t.tabIndex = selected ? 0 : -1;
      if (selected) t.classList.add("album-tab--active");
      else t.classList.remove("album-tab--active");
    });

    if (focusTab) {
      const tab = tabs[activeAlbum];
      if (tab) tab.focus();
    }

    renderAlbumGrid();
  }

  function renderAlbumGrid() {
    const album = normAlbums[activeAlbum];
    gridEl.innerHTML = "";

    // title row (optional)
    const header = document.createElement("div");
    header.className = "gallery-head";
    header.innerHTML = `<h3 style="margin:0">${escapeHtml(album.title)}</h3><p class="muted" style="margin:0">${album.items.length} Bilder</p>`;
    gridEl.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "gallery-grid-inner";

    album.items.forEach((it, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-thumb";
      btn.setAttribute("aria-label", "Bild öffnen: " + (it.alt || album.title));

      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = it.alt || album.title;
      img.src = it.thumb || it.src;

      btn.appendChild(img);

      btn.addEventListener("click", () => {
        openGalleryModal(modal, normAlbums, activeAlbum, idx);
      });

      grid.appendChild(btn);
    });

    gridEl.appendChild(grid);
  }

  // Build tabs
  normAlbums.forEach((a, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "album-tab";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", "false");
    btn.tabIndex = -1;
    btn.textContent = a.title;

    btn.addEventListener("click", () => setActiveAlbum(idx, false));

    btn.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
        ev.preventDefault();
        setActiveAlbum((idx + 1) % normAlbums.length, true);
      } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
        ev.preventDefault();
        setActiveAlbum((idx - 1 + normAlbums.length) % normAlbums.length, true);
      }
    });

    albumsEl.appendChild(btn);
  });

  setActiveAlbum(0, false);
}

function ensureGalleryModal() {
  let modal = document.getElementById("galleryModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "galleryModal";
  modal.className = "modal modal--gallery";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="modal__backdrop" data-close="1"></div>
    <div class="modal__panel gpanel" role="document">
      <button class="modal__close" type="button" aria-label="Schließen" data-close="1">✕</button>

      <div class="gviewer">
        <button class="gnav gnav--prev" type="button" aria-label="Vorheriges Bild" data-prev="1">‹</button>

        <figure class="gfigure">
          <img class="gimg" alt="" data-img />
          <figcaption class="gcap">
            <div class="gcap__title" data-title></div>
            <div class="gcap__meta muted" data-meta></div>
            <div class="gcap__pos muted" data-pos></div>
          </figcaption>
        </figure>

        <button class="gnav gnav--next" type="button" aria-label="Nächstes Bild" data-next="1">›</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (ev) => {
    const target = ev.target;
    if (!(target instanceof Element)) return;
    if (target && target.getAttribute("data-close") === "1") {
      closeModal(modal);
    }
  });

  document.addEventListener("keydown", (ev) => {
    if (modal.getAttribute("aria-hidden") === "true") return;

    if (ev.key === "Escape") {
      ev.preventDefault();
      closeModal(modal);
      return;
    }

    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      const btn = modal.querySelector("[data-prev='1']");
      if (btn) btn.click();
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      const btn = modal.querySelector("[data-next='1']");
      if (btn) btn.click();
    }
  });

  return modal;
}

async function openGalleryModal(modal, albums, albumIndex, itemIndex) {
  const imgEl = modal.querySelector("[data-img]");
  const titleEl = modal.querySelector("[data-title]");
  const metaEl = modal.querySelector("[data-meta]");
  const posEl = modal.querySelector("[data-pos]");

  if (!imgEl || !titleEl || !metaEl || !posEl) return;

  // Store state on modal
  modal._galleryState = { albums: albums, a: albumIndex, i: itemIndex };

  const btnPrev = modal.querySelector("[data-prev='1']");
  const btnNext = modal.querySelector("[data-next='1']");

  if (btnPrev) {
    btnPrev.onclick = () => stepGallery(modal, -1);
  }
  if (btnNext) {
    btnNext.onclick = () => stepGallery(modal, +1);
  }

  await renderGalleryImage(modal);

  openModal(modal);
}

async function stepGallery(modal, dir) {
  const st = modal._galleryState;
  if (!st) return;

  const album = st.albums[st.a];
  const count = album.items.length;
  if (count <= 1) return;

  st.i = (st.i + dir + count) % count;
  await renderGalleryImage(modal);
}

async function renderGalleryImage(modal) {
  const st = modal._galleryState;
  if (!st) return;

  const album = st.albums[st.a];
  const item = album.items[st.i];

  const imgEl = modal.querySelector("[data-img]");
  const titleEl = modal.querySelector("[data-title]");
  const metaEl = modal.querySelector("[data-meta]");
  const posEl = modal.querySelector("[data-pos]");

  if (!imgEl || !titleEl || !metaEl || !posEl) return;

  titleEl.textContent = item.alt || album.title || "Bild";
  metaEl.textContent = item.meta || "";
  posEl.textContent = `${st.i + 1} / ${album.items.length}`;

  // decode before showing to prevent "flash"
  imgEl.src = item.src;
  imgEl.alt = item.alt || album.title || "";

  try {
    if (typeof imgEl.decode === "function") {
      await imgEl.decode();
    }
  } catch {
    // ignore
  }
}

/* ---------- Modal helpers ---------- */

function openModal(modal) {
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function escapeHtml(s) {
  return safeText(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}




function buildTagRow(tags) {
  const row = document.createElement("div");
  row.className = "tag-row";

  tags
    .map((t) => safeText(t))
    .filter(Boolean)
    .slice(0, 6)
    .forEach((t) => {
      const span = document.createElement("span");
      span.className = "pill pill--small";
      span.textContent = t;
      row.appendChild(span);
    });

  return row;
}

function buildLinkRow(links) {
  const valid = (links || [])
    .filter((l) => l && typeof l === "object")
    .map((l) => ({ label: safeText(l.label), url: safeText(l.url) }))
    .filter((l) => l.label && l.url);

  if (!valid.length) return null;

  const row = document.createElement("div");
  row.className = "person__links";

  valid.slice(0, 4).forEach((l) => {
    const a = document.createElement("a");
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = l.label;
    row.appendChild(a);
  });

  return row;
}

function makeEmptyCard(title, text) {
  const article = document.createElement("article");
  article.className = "card";

  const h3 = document.createElement("h3");
  h3.textContent = title;

  const p = document.createElement("p");
  p.className = "muted";
  p.textContent = text;

  article.appendChild(h3);
  article.appendChild(p);

  return article;
}

function safeText(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function initialsFrom(text) {
  const t = safeText(text);
  if (!t) return "TG";

  // Take first two letters, ignoring emojis/symbols.
  const letters = t
    .replace(/[^A-Za-zÄÖÜäöüß0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .join(" ");

  const parts = letters.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return letters.substring(0, 2).toUpperCase();
}

// ---------- Member Steckbrief Overlay ----------

function ensureMemberModal() {
  let modal = document.getElementById("memberModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "memberModal";
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="modal__backdrop" data-close="1"></div>
    <div class="modal__panel" role="document">
      <button class="modal__close" type="button" aria-label="Schließen" data-close="1">✕</button>
      <div class="profile">
        <div class="profile__media">
          <div class="profile__avatar" data-avatar></div>
        </div>
        <div class="profile__main">
          <div class="profile__content">
            <div class="profile__head">
              <h2 class="profile__name" data-name></h2>
              <p class="profile__sub muted" data-sub></p>
            </div>
            <div class="profile__bio" data-bio hidden></div>
            <div class="profile__grid" data-grid></div>
            <div class="profile__tags" data-tags></div>
            <div class="profile__links" data-links></div>
          </div>
          <div class="profile__videos" data-videos hidden></div>
        </div>
      </div>
      <div class="profile__weapons" data-weapons hidden></div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (ev) => {
    const t = ev.target;
    if (t && t.getAttribute && t.getAttribute("data-close") === "1") {
      closeMemberModal(modal);
    }
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      ev.preventDefault();
      closeMemberModal(modal);
    }
  });

  return modal;
}

function openMemberModal(modal, member, opts) {
  if (!modal) return;

  const callsign = (opts && opts.callsign)
    ? opts.callsign
    : (safeText(member && (member.callsign || member.name)) || "Member");
  const subtitle = safeText(member && member.subtitle) || "";
  const photo = (opts && opts.photo) ? opts.photo : (safeText(member && member.photo) || "");

  const nameEl = modal.querySelector("[data-name]");
  const subEl = modal.querySelector("[data-sub]");
  const bioEl = modal.querySelector("[data-bio]");
  const gridEl = modal.querySelector("[data-grid]");
  const tagsEl = modal.querySelector("[data-tags]");
  const linksEl = modal.querySelector("[data-links]");
  const avatarWrap = modal.querySelector("[data-avatar]");

  if (nameEl) nameEl.textContent = callsign;
  if (subEl) subEl.textContent = subtitle;

  // Avatar
  if (avatarWrap) {
    avatarWrap.innerHTML = "";
    if (photo) {
      const img = document.createElement("img");
      img.alt = callsign;
      img.decoding = "async";
      img.loading = "eager";
      img.src = photo;
      avatarWrap.appendChild(img);
    } else {
      const span = document.createElement("span");
      span.className = "profile__initials";
      span.textContent = initialsFrom(callsign);
      avatarWrap.appendChild(span);
    }
  }

  // Bio (separate block, not inside the grid to avoid layout "shift")
  if (bioEl) {
    const bio = safeText(member && (member.bio || member.text || member.shortText || member.kurzText));
    if (bio) {
      bioEl.textContent = bio;
      bioEl.hidden = false;
    } else {
      bioEl.textContent = "";
      bioEl.hidden = true;
    }
  }

  // Steckbrief grid
  if (gridEl) {
    gridEl.innerHTML = "";

    const fields = [
      { label: "Name", keys: ["name", "realName"] },
      { label: "Spielertag", keys: ["playday", "spielertag", "playerDay"] },
      { label: "Alter", keys: ["age", "alter"] },
      { label: "Airsoft Spielzeit", keys: ["airsoftTime", "airsoftYears", "spielzeit"] },
      { label: "Tarn", keys: ["camo", "tarn"] },
      { label: "Plattenträger", keys: ["plateCarrier", "plattentraeger", "carrier"] },
      { label: "Langwaffe", keys: ["primary", "langwaffe", "rifle"] },
      { label: "BackUp", keys: ["backup", "sidearm"] },
      { label: "Gimmick", keys: ["gimmick", "gimik"] },
    ];

    let any = false;
    for (const f of fields) {
      const val = pickFirst(member, f.keys);
      if (!val) continue;
      any = true;

      const dt = document.createElement("div");
      dt.className = "profile__dt";
      dt.textContent = f.label;

      const dd = document.createElement("div");
      dd.className = "profile__dd";
      dd.textContent = val;

      gridEl.appendChild(dt);
      gridEl.appendChild(dd);
    }

    if (!any && (!bioEl || bioEl.hidden)) {
      const p = document.createElement("p");
      p.className = "muted profile__empty";
      p.textContent = "Noch kein Steckbrief hinterlegt. (Eintrag in data/team.json ergänzen)";
      gridEl.appendChild(p);
    }
  }

  // Tags
  if (tagsEl) {
    tagsEl.innerHTML = "";
    const tags = Array.isArray(member && member.tags) ? member.tags : [];
    if (tags.length) {
      const label = document.createElement("div");
      label.className = "profile__section-title muted";
      label.textContent = "Tags";
      tagsEl.appendChild(label);
      tagsEl.appendChild(buildTagRow(tags));
    }
  }

  // Links as tags
  if (linksEl) {
    linksEl.innerHTML = "";
    const links = Array.isArray(member && member.links) ? member.links : [];
    const valid = (links || [])
      .filter((l) => l && typeof l === "object")
      .map((l) => ({ label: safeText(l.label), url: safeText(l.url) }))
      .filter((l) => l.label && l.url);

    if (valid.length) {
      const label = document.createElement("div");
      label.className = "profile__section-title muted";
      label.textContent = "Links";
      linksEl.appendChild(label);

      const row = document.createElement("div");
      row.className = "tag-row";
      valid.slice(0, 8).forEach((l) => {
        const a = document.createElement("a");
        a.className = "pill pill--small pill--link";
        a.href = l.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = l.label;
        row.appendChild(a);
      });
      linksEl.appendChild(row);
    }
  }

  const weaponsEl = modal.querySelector("[data-weapons]");
  if (weaponsEl) {
    weaponsEl.innerHTML = "";
    const weapons = Array.isArray(member && member.weapons) ? member.weapons : [];
    const validWeapons = weapons
      .map((w) => ({ src: safeText(w && w.src), alt: safeText(w && w.alt) }))
      .filter((w) => w.src);

    if (validWeapons.length) {
      weaponsEl.hidden = false;
      const label = document.createElement("div");
      label.className = "profile__section-title muted";
      label.textContent = "Paintjobs & Gear";
      weaponsEl.appendChild(label);

      const strip = document.createElement("div");
      strip.className = "weapon-strip";

      validWeapons.forEach((w, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "weapon-thumb-btn";
        btn.setAttribute("aria-label", "Bild vergrößern: " + (w.alt || "Waffe"));

        const img = document.createElement("img");
        img.src = w.src;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.className = "weapon-thumb";
        btn.appendChild(img);
        btn.addEventListener("click", () => openWeaponLightbox(validWeapons, idx));
        strip.appendChild(btn);
      });

      weaponsEl.appendChild(strip);
    } else {
      weaponsEl.hidden = true;
    }
  }

  const videosEl = modal.querySelector("[data-videos]");
  if (videosEl) {
    videosEl.innerHTML = "";
    const videos = Array.isArray(member && member.videos) ? member.videos : [];
    const validVideos = videos
      .map((v) => ({ src: safeText(v && v.src), alt: safeText(v && v.alt) }))
      .filter((v) => v.src);

    if (validVideos.length) {
      videosEl.hidden = false;
      const label = document.createElement("div");
      label.className = "profile__section-title muted";
      label.textContent = "Gameplay";
      videosEl.appendChild(label);

      validVideos.forEach((v) => {
        const video = document.createElement("video");
        video.src = v.src;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.className = "profile__video";
        if (v.alt) video.setAttribute("aria-label", v.alt);
        videosEl.appendChild(video);
      });
    } else {
      videosEl.hidden = true;
    }
  }

  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const btn = modal.querySelector(".modal__close");
  if (btn) btn.focus();
}

function closeMemberModal(modal) {
  if (!modal) return;
  modal.querySelectorAll("video").forEach((v) => { v.pause(); v.currentTime = 0; });
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

// ---------- Weapon Lightbox ----------

function ensureWeaponLightbox() {
  let lb = document.getElementById("weaponLightbox");
  if (lb) return lb;

  lb = document.createElement("div");
  lb.id = "weaponLightbox";
  lb.className = "weapon-lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-hidden", "true");
  lb.setAttribute("aria-label", "Bildansicht");

  lb.innerHTML = `
    <div class="weapon-lightbox__backdrop" data-close="1"></div>
    <button class="weapon-lightbox__close" type="button" aria-label="Schließen" data-close="1">✕</button>
    <button class="weapon-lightbox__nav weapon-lightbox__nav--prev" type="button" aria-label="Vorheriges Bild">‹</button>
    <div class="weapon-lightbox__stage">
      <img class="weapon-lightbox__img" alt="" />
    </div>
    <button class="weapon-lightbox__nav weapon-lightbox__nav--next" type="button" aria-label="Nächstes Bild">›</button>
  `;

  document.body.appendChild(lb);

  lb.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-close='1']")) closeWeaponLightbox(lb);
  });

  document.addEventListener("keydown", (ev) => {
    if (lb.getAttribute("aria-hidden") === "true") return;
    if (ev.key === "Escape") { ev.preventDefault(); closeWeaponLightbox(lb); }
    if (ev.key === "ArrowLeft") lb.querySelector(".weapon-lightbox__nav--prev").click();
    if (ev.key === "ArrowRight") lb.querySelector(".weapon-lightbox__nav--next").click();
  });

  return lb;
}

function openWeaponLightbox(images, startIdx) {
  const lb = ensureWeaponLightbox();
  document.body.appendChild(lb); // ans Ende verschieben → sicher über allen anderen Elementen
  const imgEl = lb.querySelector(".weapon-lightbox__img");
  const btnPrev = lb.querySelector(".weapon-lightbox__nav--prev");
  const btnNext = lb.querySelector(".weapon-lightbox__nav--next");

  let current = startIdx;

  function show(idx) {
    current = (idx + images.length) % images.length;
    imgEl.src = images[current].src;
    imgEl.alt = images[current].alt || "Waffe";
    btnPrev.hidden = images.length <= 1;
    btnNext.hidden = images.length <= 1;
  }

  btnPrev.onclick = () => show(current - 1);
  btnNext.onclick = () => show(current + 1);

  show(startIdx);
  lb.setAttribute("aria-hidden", "false");
  lb.querySelector(".weapon-lightbox__close").focus();
}

function closeWeaponLightbox(lb) {
  lb.setAttribute("aria-hidden", "true");
}


// ---------- Spielfeld Bericht Overlay ----------

function ensureFieldModal() {
  let modal = document.getElementById("fieldModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "fieldModal";
  modal.className = "modal modal--field";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="modal__backdrop" data-close="1"></div>
    <div class="modal__panel" role="document">
      <button class="modal__close" type="button" aria-label="Schließen" data-close="1">✕</button>
      <div class="field">
        <div class="field__head">
          <div>
            <h2 class="field__title" data-title></h2>
            <p class="field__sub muted" data-sub></p>
          </div>
          <a class="pill pill--small pill--link" data-site hidden target="_blank" rel="noopener noreferrer">Website</a>
        </div>

        <div class="field__badges" data-badges></div>

        <div class="field__callout" data-verdict hidden></div>

        <div class="field__split" data-split hidden>
          <div class="field__box" data-prosbox hidden>
            <div class="field__box-title muted">Plus</div>
            <ul class="field__list" data-pros></ul>
          </div>
          <div class="field__box" data-consbox hidden>
            <div class="field__box-title muted">Minus</div>
            <ul class="field__list" data-cons></ul>
          </div>
        </div>

        <div class="field__report" data-report></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (ev) => {
    const t = ev.target;
    if (t && t.getAttribute && t.getAttribute("data-close") === "1") {
      closeFieldModal(modal);
    }
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      ev.preventDefault();
      closeFieldModal(modal);
    }
  });

  return modal;
}

function openFieldModal(modal, field) {
  if (!modal) return;

  const name = safeText(field && field.name) || "Spielfeld";
  const location = safeText(field && field.location) || "";
  const country = safeText(field && field.country) || "";
  const type = safeText(field && field.type) || "";
  const oneLiner = safeText(field && field.oneLiner) || "";
  const url = safeText(field && field.url) || "";
  const tags = Array.isArray(field && field.tags) ? field.tags : [];

  const titleEl = modal.querySelector("[data-title]");
  const subEl = modal.querySelector("[data-sub]");
  const badgesEl = modal.querySelector("[data-badges]");
  const siteEl = modal.querySelector("[data-site]");
  const verdictEl = modal.querySelector("[data-verdict]");
  const splitEl = modal.querySelector("[data-split]");
  const prosBox = modal.querySelector("[data-prosbox]");
  const consBox = modal.querySelector("[data-consbox]");
  const prosEl = modal.querySelector("[data-pros]");
  const consEl = modal.querySelector("[data-cons]");
  const reportEl = modal.querySelector("[data-report]");

  if (titleEl) titleEl.textContent = name;

  const subBits = [];
  const locBits = [];
  if (location) locBits.push(location);
  if (country) locBits.push(country);
  if (locBits.length) subBits.push(locBits.join(" / "));
  if (type) subBits.push(type);
  if (oneLiner) subBits.push(oneLiner);
  if (subEl) subEl.textContent = subBits.join(" • ");

  // Website
  if (siteEl) {
    if (url) {
      siteEl.hidden = false;
      siteEl.href = url;
    } else {
      siteEl.hidden = true;
      siteEl.removeAttribute("href");
    }
  }

  // Badges (Type + Tags)
  if (badgesEl) {
    badgesEl.innerHTML = "";
    const all = [];
    if (type) all.push(type);
    (tags || []).forEach((t) => all.push(t));
    if (all.length) badgesEl.appendChild(buildTagRow(all));
  }

  // Verdict callout
  if (verdictEl) {
    const verdict = safeText(field && (field.verdict || field.summary || field.einschaetzung));
    if (verdict) {
      verdictEl.textContent = verdict;
      verdictEl.hidden = false;
    } else {
      verdictEl.textContent = "";
      verdictEl.hidden = true;
    }
  }

  // Pros / Cons
  const pros = Array.isArray(field && field.pros) ? field.pros : [];
  const cons = Array.isArray(field && field.cons) ? field.cons : [];
  const anyList = (pros && pros.length) || (cons && cons.length);

  if (splitEl) splitEl.hidden = !anyList;

  if (prosBox && prosEl) {
    prosEl.innerHTML = "";
    if (pros.length) {
      prosBox.hidden = false;
      pros.slice(0, 12).forEach((x) => {
        const li = document.createElement("li");
        li.textContent = safeText(x);
        prosEl.appendChild(li);
      });
    } else {
      prosBox.hidden = true;
    }
  }

  if (consBox && consEl) {
    consEl.innerHTML = "";
    if (cons.length) {
      consBox.hidden = false;
      cons.slice(0, 12).forEach((x) => {
        const li = document.createElement("li");
        li.textContent = safeText(x);
        consEl.appendChild(li);
      });
    } else {
      consBox.hidden = true;
    }
  }

  // Report (long text)
  if (reportEl) {
    reportEl.innerHTML = "";

    const reportHtml = safeText(field && (field.reportHtml || field.html));
    const report = field && (field.report || field.text || field.reportText);

    if (reportHtml) {
      // Trusted content (project-owned JSON). Keep it optional.
      const wrap = document.createElement("div");
      wrap.innerHTML = reportHtml;
      reportEl.appendChild(wrap);
    } else {
      const paras = normalizeParagraphs(report);
      if (paras.length) {
        paras.forEach((p) => {
          const el = document.createElement("p");
          el.textContent = p;
          reportEl.appendChild(el);
        });
      } else {
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = "Noch kein Bericht hinterlegt. (Eintrag in data/fields.json ergänzen)";
        reportEl.appendChild(p);
      }
    }
  }

  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const btn = modal.querySelector(".modal__close");
  if (btn) btn.focus();
}

function closeFieldModal(modal) {
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function normalizeParagraphs(v) {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v.map((x) => safeText(x)).filter(Boolean);
  }
  const s = safeText(v);
  if (!s) return [];

  // Split by blank lines -> paragraphs.
  return s
    .split(/\n\s*\n/g)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function pickFirst(obj, keys) {
  if (!obj || !keys) return "";
  for (const k of keys) {
    const v = obj[k];
    const s = safeText(v);
    if (s) return s;
  }
  return "";
}

function buildLocalHint(err) {
  const msg = (err && err.message) ? err.message : "";

  // Common issue: opening html via file:// blocks fetch() in many browsers.
  return (
    "Konnte JSON nicht laden" + (msg ? ": " + msg : ".") +
    " Tipp: Öffne die Seite über einen lokalen Server (z. B. VSCode Live Server oder 'python -m http.server')."
  );
}
