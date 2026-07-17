(function () {
  const list = document.getElementById("berichte-list");
  const modal = document.getElementById("bericht-modal");
  if (!list || !modal) return;

  const modalTyp    = document.getElementById("bericht-modal-typ");
  const modalDatum  = document.getElementById("bericht-modal-datum");
  const modalTitel  = document.getElementById("bericht-modal-titel");
  const modalFeld   = document.getElementById("bericht-modal-feld");
  const modalBody   = document.getElementById("bericht-modal-body");
  const modalBilder = document.getElementById("bericht-modal-bilder");

  function formatDatum(iso) {
    if (!iso) return "";
    return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", {
      day: "2-digit", month: "long", year: "numeric"
    });
  }

  function typLabel(typ) {
    return typ === "spieltag" ? "Spieltag" : typ === "feldbericht" ? "Feldbericht" : typ || "";
  }

  function openModal(post) {
    modalTyp.textContent   = typLabel(post.typ);
    modalDatum.textContent = formatDatum(post.datum);
    modalTitel.textContent = post.titel || "";
    modalFeld.textContent  = post.feld ? "Feld: " + post.feld : "";

    modalBody.innerHTML = (post.absaetze || []).map(function (p) {
      return p.trimStart().startsWith("<") ? p : "<p>" + p + "</p>";
    }).join("");

    modalBilder.innerHTML = "";
    (post.bilder || []).forEach(function (src) {
      var img = document.createElement("img");
      img.src = src;
      img.alt = post.titel || "";
      img.className = "bericht-modal__bild";
      modalBilder.appendChild(img);
    });

    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close-bericht]")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  fetch("data/berichte.json")
    .then(function (r) { return r.json(); })
    .then(function (posts) {
      list.innerHTML = "";

      if (!posts || !posts.length) {
        list.innerHTML = "<p class=\"muted\" style=\"padding:24px\">Noch keine Berichte vorhanden.</p>";
        return;
      }

      posts.sort(function (a, b) { return new Date(b.datum) - new Date(a.datum); });

      posts.forEach(function (post) {
        var card = document.createElement("article");
        card.className = "bericht-card";
        card.innerHTML =
          "<div class=\"bericht-card__meta\">" +
            "<span class=\"bericht-card__typ\">" + typLabel(post.typ) + "</span>" +
            "<span class=\"bericht-card__datum\">" + formatDatum(post.datum) + "</span>" +
          "</div>" +
          "<h2 class=\"bericht-card__titel\">" + (post.titel || "") + "</h2>" +
          (post.feld ? "<p class=\"bericht-card__feld muted\">" + post.feld + "</p>" : "") +
          "<p class=\"bericht-card__intro\">" + (post.intro || "") + "</p>" +
          "<button class=\"bericht-card__button\" type=\"button\">Bericht lesen</button>";

        card.querySelector(".bericht-card__button").addEventListener("click", function () {
          openModal(post);
        });
        list.appendChild(card);
      });
    })
    .catch(function () {
      list.innerHTML = "<p class=\"muted\" style=\"padding:24px\">Berichte konnten nicht geladen werden.</p>";
    });
})();
