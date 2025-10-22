document.addEventListener("DOMContentLoaded", () => {
  const { samplePostcodes, patientSummary, weatherToday, gpLocations, demoProfile } =
    window.DASHBOARD_DATA;
  const activityChart = echarts.init(document.getElementById("activity-chart"));

  const filterForm = document.getElementById("filter-form");
  const postcodeInput = document.getElementById("postcode-input");
  const distanceSelect = document.getElementById("distance-select");
  const ratingSelect = document.getElementById("rating-select");
  const resetBtn = document.getElementById("reset-btn");
  const hintEl = document.querySelector(".filter-hint");

  const kpiGpCount = document.getElementById("kpi-gp-count");
  const kpiAvgRating = document.getElementById("kpi-avg-rating");
  const kpiReminder = document.getElementById("kpi-reminder");

  const gpListEl = document.getElementById("gp-list");
  const scrollToMapBtn = document.getElementById("scroll-to-map");

  const summaryRangeEl = document.getElementById("summary-range");
  const activityTitleEl = document.getElementById("activity-title");
  const topPracticeEl = document.getElementById("top-practice");
  const averageInterventionEl = document.getElementById("average-intervention");
  const averageReviewEl = document.getElementById("average-review");

  const weatherIconEl = document.getElementById("weather-icon");
  const weatherSummaryEl = document.getElementById("weather-summary");
  const weatherMetaEl = document.getElementById("weather-meta");
  const weatherAdviceEl = document.getElementById("weather-advice");

  const patientAliasEl = document.getElementById("patient-alias");
  const userNameEl = document.getElementById("user-name");
  const userTaglineEl = document.getElementById("user-tagline");
  const userAvatarEl = document.getElementById("user-avatar");
  const currentDateEl = document.getElementById("current-date");
  const baseHintText =
    "提示：支持真实 NHS GP Postcode 查询，例如 EC1A 1BB / SW1A 0AA / M1 1AE。";

  const samplePostcodesByKey = normaliseSamplePostcodes(samplePostcodes);
  const postcodeIndex = buildPostcodeIndex(gpLocations);

  const fallbackCentre = { lat: 51.509865, lng: -0.118092 };
  const defaultKey = Utils.normalisePostcode(patientSummary.homePostcode);
  const defaultArea =
    samplePostcodesByKey[defaultKey] ||
    createAreaFromPractices(postcodeIndex.get(defaultKey), patientSummary.homePostcode) ||
    Object.values(samplePostcodesByKey)[0];
  let currentCentre = defaultArea?.coordinates || fallbackCentre;
  let currentAreaLabel = defaultArea?.label || "英国默认视图";

  MapView.initMap("map-container");

  initUserProfile();
  initHeader();
  initPatientSummary();
  initWeatherCard();
  initActivityChart();
  updateView();

  filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const rawPostcode = Utils.normalisePostcode(postcodeInput.value);
    const sampleMatch = samplePostcodesByKey[rawPostcode];
    if (sampleMatch) {
      currentCentre = sampleMatch.coordinates;
      currentAreaLabel = sampleMatch.label;
      postcodeInput.value = formatPostcode(rawPostcode);
      MapView.flyToCoordinates(currentCentre.lat, currentCentre.lng);
    } else if (rawPostcode) {
      const postcodePractices = postcodeIndex.get(rawPostcode);
      if (postcodePractices && postcodePractices.length) {
        const area = createAreaFromPractices(postcodePractices, rawPostcode);
        currentCentre = area.coordinates;
        currentAreaLabel = area.label;
        postcodeInput.value = area.displayPostcode;
        MapView.flyToCoordinates(currentCentre.lat, currentCentre.lng);
      } else {
        currentAreaLabel = `未找到 ${formatPostcode(rawPostcode)} 对应的 GP 数据`;
      }
    } else {
      currentCentre = defaultArea?.coordinates || fallbackCentre;
      currentAreaLabel = defaultArea?.label || "英国默认视图";
      postcodeInput.value = formatPostcode(defaultKey);
    }
    updateView();
  });

  resetBtn.addEventListener("click", () => {
    postcodeInput.value = formatPostcode(defaultKey);
    distanceSelect.value = "10";
    ratingSelect.value = "0";
    currentCentre = defaultArea?.coordinates || fallbackCentre;
    currentAreaLabel = defaultArea?.label || "英国默认视图";
    MapView.flyToCoordinates(currentCentre.lat, currentCentre.lng, 11);
    updateView();
  });

  scrollToMapBtn.addEventListener("click", () => {
    document.getElementById("map-container").scrollIntoView({ behavior: "smooth" });
  });

  window.addEventListener("resize", () => {
    activityChart.resize();
  });

  function updateView() {
    const distanceLimit = Number(distanceSelect.value);
    const minRating = Number(ratingSelect.value);

    const withinDistance = gpLocations
      .map((gp) => {
        const distanceKm = Utils.haversineDistance(
          currentCentre.lat,
          currentCentre.lng,
          gp.coordinates.lat,
          gp.coordinates.lng
        );
        return { ...gp, distanceKm };
      })
      .filter((gp) => gp.distanceKm <= distanceLimit)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const filtered = withinDistance.filter((gp) => (gp.rating ?? 0) >= minRating);

    const listForDisplay = filtered.length ? filtered.slice(0, 3) : withinDistance.slice(0, 3);
    const mapTargets = (filtered.length ? filtered : withinDistance).slice(0, 300);

    MapView.renderMarkers(mapTargets);

    updateKpis(filtered, withinDistance);
    renderGpList(listForDisplay, filtered.length, withinDistance.length);
    updateHintText(filtered.length, withinDistance.length);
  }

  function updateKpis(filteredGps, withinDistance) {
    const source = filteredGps.length ? filteredGps : withinDistance;
    kpiGpCount.textContent = source.length;

    const ratings = source.map((gp) => gp.rating).filter((value) => value !== null && value !== undefined);
    const avgRating = ratings.length ? Utils.calculateAverage(ratings) : null;
    kpiAvgRating.textContent = avgRating !== null ? Utils.formatRating(avgRating) : "—";

    const intervention = patientSummary.averages?.interventionPercent;
    kpiReminder.textContent = intervention ? Utils.formatPercent(intervention) : "—";
  }

  function renderGpList(gps, filteredCount, distanceCount) {
    gpListEl.innerHTML = "";
    if (!gps.length) {
      const emptyState = document.createElement("li");
      emptyState.className = "gp-item";
      emptyState.innerHTML =
        "<strong>No results in range.</strong><p>Try widening distance or lowering rating threshold.</p>";
      gpListEl.appendChild(emptyState);
      return;
    }

    gps.forEach((gp, index) => {
      const item = document.createElement("li");
      item.className = "gp-item";
      item.dataset.gpId = gp.id;
      const phoneNumber = gp.phone ? gp.phone.replace(/\s+/g, "") : "";
      const achievementText =
        gp.achievementPercent !== null && gp.achievementPercent !== undefined
          ? Utils.formatPercent(gp.achievementPercent, 1)
          : "—";
      const prevalenceText =
        gp.prevalencePercent !== null && gp.prevalencePercent !== undefined
          ? Utils.formatPercent(gp.prevalencePercent, 2)
          : "—";
      const registerText =
        gp.register !== null && gp.register !== undefined ? Utils.formatInteger(gp.register) : "—";

      const tagSnippets = [`<span class="tag">${gp.postcode || "N/A"}</span>`];
      if (gp.interventionPercent !== null && gp.interventionPercent !== undefined) {
        tagSnippets.push(
          `<span class="tag">Intervention ${Utils.formatPercent(gp.interventionPercent, 1)}</span>`
        );
      }
      if (gp.reviewPercent !== null && gp.reviewPercent !== undefined) {
        tagSnippets.push(`<span class="tag">Review ${Utils.formatPercent(gp.reviewPercent, 1)}</span>`);
      }
      if (gp.pcaRate !== null && gp.pcaRate !== undefined) {
        tagSnippets.push(`<span class="tag">PCA ${gp.pcaRate.toFixed(2)}</span>`);
      }
      const tagsHtml = tagSnippets.join("");

      item.innerHTML = `
        <div class="gp-title">
          <span>${index + 1}. ${gp.name}</span>
          <span>${achievementText}</span>
        </div>
        <div class="gp-meta">
          <span>${Utils.formatKm(gp.distanceKm)}</span>
          <span>Prevalence ${prevalenceText}</span>
          <span>Register ${registerText}</span>
        </div>
        <div class="gp-tags">
          ${tagsHtml}
        </div>
        <div class="gp-actions">
          ${phoneNumber ? `<a class="call" href="tel:${phoneNumber}">Call</a>` : ""}
          <a class="navigate" target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${gp.coordinates.lat},${gp.coordinates.lng}">Navigate</a>
        </div>
      `;
      item.addEventListener("click", (evt) => {
        if (evt.target.tagName.toLowerCase() === "a") return;
        MapView.focusOnGp(gp);
      });
      gpListEl.appendChild(item);
    });

    const totalMatches = filteredCount || distanceCount;
    if (totalMatches > gps.length) {
      const moreInfo = document.createElement("li");
      moreInfo.className = "gp-item";
      moreInfo.innerHTML = `<span>${totalMatches} practices match filters. Zoom or use the map to view all.</span>`;
      gpListEl.appendChild(moreInfo);
    }
  }
  function initHeader() {
    const now = new Date();
    currentDateEl.textContent = now.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    postcodeInput.value = formatPostcode(defaultKey);
    if (patientAliasEl) {
      patientAliasEl.textContent = patientSummary.alias || "COPD Cohort";
    }
  }

  function initPatientSummary() {
    summaryRangeEl.textContent = patientSummary.alias || "";
    if (patientSummary.summaryLabel) {
      activityTitleEl.textContent = patientSummary.summaryLabel;
    }

    const topPractice = patientSummary.topPractice || {};
    const topParts = [];
    if (topPractice.name) topParts.push(topPractice.name);
    if (topPractice.achievementPercent !== null && topPractice.achievementPercent !== undefined) {
      topParts.push(`${Utils.formatPercent(topPractice.achievementPercent, 1)} achievement`);
    }
    if (topPractice.prevalencePercent !== null && topPractice.prevalencePercent !== undefined) {
      topParts.push(`${Utils.formatPercent(topPractice.prevalencePercent, 2)} prevalence`);
    }
    if (topPractice.register !== null && topPractice.register !== undefined) {
      topParts.push(`${Utils.formatInteger(topPractice.register)} register`);
    }
    topPracticeEl.textContent = topParts.length ? topParts.join(" · ") : "—";

    const avgIntervention = patientSummary.averages?.interventionPercent;
    averageInterventionEl.textContent =
      avgIntervention !== null && avgIntervention !== undefined
        ? Utils.formatPercent(avgIntervention, 1)
        : "—";

    const avgReview = patientSummary.averages?.reviewPercent;
    averageReviewEl.textContent =
      avgReview !== null && avgReview !== undefined ? Utils.formatPercent(avgReview, 1) : "—";
  }
  function initWeatherCard() {
    weatherIconEl.textContent = weatherToday.icon;
    weatherSummaryEl.textContent = `${weatherToday.temperatureC}°C · ${weatherToday.condition}`;
    weatherMetaEl.textContent = `Humidity ${weatherToday.humidity}% · AQI ${weatherToday.aqi}`;
    weatherAdviceEl.textContent = weatherToday.advice;
  }

  function initActivityChart() {
    const labels =
      patientSummary.activityLabels && patientSummary.activityLabels.length
        ? patientSummary.activityLabels
        : (patientSummary.activityDates || []).map((d) =>
            new Date(d).toLocaleDateString("en-GB", { weekday: "short" })
          );
    const values = patientSummary.activity || [];

    activityChart.setOption({
      animation: true,
      grid: { top: 10, left: 0, right: 0, bottom: 0, containLabel: false },
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => Utils.formatPercent(value, 1)
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: "#74808d", fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#74808d",
          formatter: (val) => Utils.formatPercent(val, 0)
        },
        splitLine: { show: false }
      },
      series: [
        {
          data: values,
          type: "line",
          smooth: true,
          symbolSize: 6,
          lineStyle: { color: "#2a9d8f", width: 3 },
          areaStyle: {
            opacity: 0.16,
            color: "#2a9d8f"
          },
          itemStyle: { color: "#2a9d8f" }
        }
      ]
    });
  }
  function updateHintText(filteredCount = 0, distanceCount = 0) {
    let detail = distanceCount
      ? `范围内 GP 数量：${distanceCount}（半径 ${distanceSelect.value} km）`
      : "所选半径内暂无匹配 GP。";
    if (distanceCount && filteredCount && filteredCount !== distanceCount) {
      detail += `；评分筛选后剩余 ${filteredCount} 家`;
    }
    hintEl.textContent = `${currentAreaLabel} ｜ ${detail} ｜ ${baseHintText}`;
  }

  function initUserProfile() {
    const profile = demoProfile || {};
    const name = profile.name || patientSummary.alias || "Demo User";
    if (userNameEl) {
      userNameEl.textContent = name;
    }

    const taglineBits = [];
    if (profile.age) taglineBits.push(`${profile.age} 岁`);
    if (profile.location) taglineBits.push(profile.location);
    if (profile.tagline) taglineBits.push(profile.tagline);
    const tagline = taglineBits.join(" · ") || "COPD dashboard demo user";
    if (userTaglineEl) {
      userTaglineEl.textContent = tagline;
    }

    const initials = profile.avatarInitials || computeInitials(name);
    if (userAvatarEl) {
      userAvatarEl.textContent = initials;
      userAvatarEl.setAttribute("aria-label", `${name} avatar`);
    }
  }

  function buildPostcodeIndex(list) {
    const map = new Map();
    list.forEach((gp) => {
      const key = Utils.normalisePostcode(gp.postcode);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(gp);
    });
    return map;
  }

  function createAreaFromPractices(practices = [], rawPostcode = "") {
    if (!practices || !practices.length) return null;
    const lat = Utils.calculateAverage(practices.map((gp) => gp.coordinates.lat));
    const lng = Utils.calculateAverage(practices.map((gp) => gp.coordinates.lng));
    const postcode = practices[0].postcode || formatPostcode(rawPostcode);
    const label = `${postcode} · ${practices.length} GP`;
    return {
      label,
      coordinates: { lat, lng },
      displayPostcode: postcode
    };
  }

  function formatPostcode(value) {
    if (!value) return "";
    const cleaned = Utils.normalisePostcode(value);
    if (cleaned.length <= 3) return cleaned;
    return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
  }
  function normaliseSamplePostcodes(samples) {
    return Object.entries(samples || {}).reduce((acc, [key, value]) => {
      acc[Utils.normalisePostcode(key)] = value;
      return acc;
    }, {});
  }

  function computeInitials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "DU";
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
});
