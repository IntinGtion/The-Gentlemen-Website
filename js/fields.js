(function () {
  const fields = Array.isArray(window.vulcanoFields) ? window.vulcanoFields : [];

  const mapElement = document.getElementById("map");
  const listElement = document.getElementById("fields-list");
  const countElement = document.getElementById("fields-count");

  const modal = document.getElementById("field-modal");
  const modalTitle = document.getElementById("field-modal-title");
  const modalStatus = document.getElementById("field-modal-status");
  const modalLocation = document.getElementById("field-modal-location");
  const modalDescription = document.getElementById("field-modal-description");
  const modalMeta = document.getElementById("field-modal-meta");
  const modalActions = document.getElementById("field-modal-actions");
  const modalMedia = document.getElementById("field-modal-media");

  if (!mapElement || !fields.length || typeof L === "undefined") {
    return;
  }

  const map = L.map("map", {
    scrollWheelZoom: false
  }).setView([50.6, 7.3], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap-Mitwirkende"
  }).addTo(map);

  const markers = new Map();
  const bounds = L.latLngBounds();

  const defaultIcon = L.divIcon({
    className: "custom-pin",
    html: '<span class="custom-pin__dot"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  function createMetaRow(label, value) {
    if (!value) return "";
    return `
      <div class="field-meta-row">
        <dt>${label}</dt>
        <dd>${value}</dd>
      </div>
    `;
  }

  function openFieldModal(field) {
    if (!field || !modal) return;

    modalTitle.textContent = field.name || "";
    modalStatus.textContent = field.status || "";
    modalLocation.textContent = [field.city, field.country].filter(Boolean).join(", ");
    modalDescription.textContent = field.description || "";

    modalMeta.innerHTML = [
      createMetaRow("Besuche", field.visits),
      createMetaRow("Terrain", field.terrain),
      createMetaRow("Eindruck", field.rating),
      createMetaRow("Notiz", field.notes)
    ].join("");

    modalActions.innerHTML = "";
    if (field.website) {
      const link = document.createElement("a");
      link.href = field.website;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "button button--primary";
      link.textContent = "Zur Feldseite";
      modalActions.appendChild(link);
    }

    modalMedia.innerHTML = "";
    if (field.image) {
      const img = document.createElement("img");
      img.src = field.image;
      img.alt = field.name;
      img.loading = "eager";
      img.decoding = "async";
      modalMedia.appendChild(img);
    }

    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeFieldModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function focusField(field) {
    const marker = markers.get(field.id);
    if (!marker) return;

    map.flyTo([field.lat, field.lng], 8, {
      duration: 0.8
    });

    marker.openPopup();
    openFieldModal(field);
  }

  fields.forEach((field) => {
    if (typeof field.lat !== "number" || typeof field.lng !== "number") {
      return;
    }

    const marker = L.marker([field.lat, field.lng], { icon: defaultIcon }).addTo(map);

    marker.bindPopup(`
      <div class="map-popup">
        <strong>${field.name}</strong><br>
        <span>${[field.city, field.country].filter(Boolean).join(", ")}</span><br>
        <button class="map-popup__button" type="button" data-field-id="${field.id}">
          Details ansehen
        </button>
      </div>
    `);

    markers.set(field.id, marker);
    bounds.extend([field.lat, field.lng]);

    if (listElement) {
      const card = document.createElement("article");
      card.className = "field-card";
      card.innerHTML = `
        <div class="field-card__content">
          <p class="field-card__status">${field.status || ""}</p>
          <h3>${field.name}</h3>
          <p class="field-card__location">${[field.city, field.country].filter(Boolean).join(", ")}</p>
          <p class="field-card__text">${field.description || ""}</p>
        </div>
        <div class="field-card__footer">
          <span>${field.visits || 0} Besuche</span>
          <button type="button" class="field-card__button">Ansehen</button>
        </div>
      `;
      card.querySelector(".field-card__button").addEventListener("click", () => {
        focusField(field);
      });
      listElement.appendChild(card);
    }
  });

  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.2));
  }

  if (countElement) {
    countElement.textContent = `${fields.length} Felder eingetragen`;
  }

  const memberIcon = L.divIcon({
    className: "member-pin",
    html: '<span class="member-pin__dot"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  const members = Array.isArray(window.memberLocations) ? window.memberLocations : [];
  const membersByCity = new Map();
  members.forEach((m) => {
    if (typeof m.lat !== "number" || typeof m.lng !== "number") return;
    const key = m.city;
    if (!membersByCity.has(key)) membersByCity.set(key, { lat: m.lat, lng: m.lng, city: m.city, members: [] });
    membersByCity.get(key).members.push(m);
  });

  membersByCity.forEach(({ lat, lng, city, members: group }) => {
    const names = group.map(m => m.spielertag ? `${m.name} · ${m.spielertag}` : m.name).join("<br>");
    L.marker([lat, lng], { icon: memberIcon })
      .addTo(map)
      .bindPopup(`<div class="map-popup"><strong>${city}</strong><br>${names}</div>`);
  });

  const legend = L.control({ position: "bottomleft" });
  legend.onAdd = () => {
    const div = L.DomUtil.create("div", "map-legend");
    div.innerHTML = `
      <div class="map-legend__item"><span class="map-legend__dot map-legend__dot--field"></span> Spielfeld</div>
      <div class="map-legend__item"><span class="map-legend__dot map-legend__dot--member"></span> Mitglied (Heimatstadt)</div>
    `;
    return div;
  };
  legend.addTo(map);

  document.addEventListener("click", (event) => {
    const detailsButton = event.target.closest("[data-field-id]");
    if (detailsButton) {
      const fieldId = detailsButton.getAttribute("data-field-id");
      const field = fields.find((item) => item.id === fieldId);
      if (field) {
        openFieldModal(field);
      }
    }

    if (event.target.matches("[data-close-modal]")) {
      closeFieldModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && !modal.hidden) {
      closeFieldModal();
    }
  });
})();