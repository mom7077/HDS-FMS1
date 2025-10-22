(function () {
  const ratingColors = {
    high: "#2a9d8f",
    medium: "#f4a261",
    low: "#e76f51"
  };

  let mapInstance = null;
  let markersLayer = null;
  const markerIndex = new Map();

  function getRatingColor(rating) {
    if (rating === null || rating === undefined) return ratingColors.medium;
    if (rating >= 4.5) return ratingColors.high;
    if (rating >= 4.0) return ratingColors.medium;
    return ratingColors.low;
  }

  function initMap(containerId) {
    if (mapInstance) return mapInstance;
    mapInstance = L.map(containerId, {
      zoomControl: false,
      scrollWheelZoom: true,
      attributionControl: false
    }).setView([51.509865, -0.118092], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18
    }).addTo(mapInstance);

    L.control
      .zoom({
        position: "topright"
      })
      .addTo(mapInstance);

    markersLayer = L.layerGroup().addTo(mapInstance);
    return mapInstance;
  }

  function clearMarkers() {
    markerIndex.clear();
    if (markersLayer) {
      markersLayer.clearLayers();
    }
  }

  function renderMarkers(gps) {
    if (!mapInstance) throw new Error("Map is not initialised.");
    clearMarkers();

    const utils = window.Utils || {};

    gps.forEach((gp) => {
      const color = getRatingColor(gp.rating);
      const baseRadius = 7;
      const registerInfluence = gp.register ? Math.min(13, Math.sqrt(gp.register) / 10) : 0;
      const radius = baseRadius + registerInfluence;

      const marker = L.circleMarker([gp.coordinates.lat, gp.coordinates.lng], {
        radius,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.22
      }).addTo(markersLayer);

      const achievementText =
        gp.achievementPercent !== null && gp.achievementPercent !== undefined
          ? (utils.formatPercent ? utils.formatPercent(gp.achievementPercent, 1) : `${gp.achievementPercent.toFixed(1)}%`)
          : "—";
      const prevalenceText =
        gp.prevalencePercent !== null && gp.prevalencePercent !== undefined
          ? (utils.formatPercent ? utils.formatPercent(gp.prevalencePercent, 2) : `${gp.prevalencePercent.toFixed(2)}%`)
          : "—";
      const interventionText =
        gp.interventionPercent !== null && gp.interventionPercent !== undefined
          ? (utils.formatPercent ? utils.formatPercent(gp.interventionPercent, 1) : `${gp.interventionPercent.toFixed(1)}%`)
          : "—";
      const registerText =
        gp.register !== null && gp.register !== undefined
          ? (utils.formatInteger ? utils.formatInteger(gp.register) : String(gp.register))
          : "—";

      const phoneLink = gp.phone ? gp.phone.replace(/\s+/g, "") : "";

      const popupHtml = `
        <div class="popup-card">
          <h3>${gp.name}</h3>
          <p>${gp.postcode || "Postcode unavailable"}</p>
          <p><strong>Achievement:</strong> ${achievementText} · <strong>Prevalence:</strong> ${prevalenceText}</p>
          <p><strong>Register:</strong> ${registerText} · <strong>Intervention:</strong> ${interventionText}</p>
          <div class="popup-actions">
            ${phoneLink ? `<a href="tel:${phoneLink}">Call</a>` : ""}
            <a target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${gp.coordinates.lat},${gp.coordinates.lng}">
              Navigate
            </a>
          </div>
        </div>`;

      marker.bindPopup(popupHtml, { closeButton: true });

      markerIndex.set(gp.id, marker);
    });
  }
  function focusOnGp(gp) {
    if (!mapInstance) return;
    mapInstance.flyTo([gp.coordinates.lat, gp.coordinates.lng], 14, {
      duration: 1.2
    });
    const marker = markerIndex.get(gp.id);
    if (marker) {
      marker.openPopup();
    }
  }

  function flyToCoordinates(lat, lng, zoom = 12) {
    if (!mapInstance) return;
    mapInstance.flyTo([lat, lng], zoom, { duration: 1.2 });
  }

  window.MapView = {
    initMap,
    renderMarkers,
    focusOnGp,
    flyToCoordinates
  };
})();
