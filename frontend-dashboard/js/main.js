document.addEventListener("DOMContentLoaded", () => {
  const {
    samplePostcodes,
    patientSummary,
    weatherToday,
    gpLocations,
    demoProfile,
    weatherLookup: rawWeatherLookup = {},
  } = window.DASHBOARD_DATA;
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

  const headerWeatherTempEl = document.getElementById("header-weather-temp");
  const headerWeatherConditionEl = document.getElementById("header-weather-condition");
  const userNameEl = document.getElementById("user-name");
  const userTaglineEl = document.getElementById("user-tagline");
  const userAvatarEl = document.getElementById("user-avatar");
  const currentDateEl = document.getElementById("current-date");
  const baseHintText =
    "Tip: Enter any NHS GP postcode, e.g. EC1A 1BB / SW1A 0AA / M1 1AE.";

  const weatherLookup = normaliseWeatherLookup(rawWeatherLookup);

  const defaultKey = Utils.normalisePostcode(patientSummary.homePostcode);
  const samplePostcodesByKey = normaliseSamplePostcodes(samplePostcodes);
  const fallbackCentre = { lat: 51.509865, lng: -0.118092 };
  const postcodeIndex = buildPostcodeIndex(gpLocations);
  const defaultArea =
    samplePostcodesByKey[defaultKey] ||
    createAreaFromPractices(postcodeIndex.get(defaultKey), patientSummary.homePostcode) ||
    Object.values(samplePostcodesByKey)[0];
  let currentCentre = defaultArea?.coordinates || fallbackCentre;
  let currentAreaLabel = defaultArea?.label || "英国默认视图";
  const defaultWeather = resolveWeatherForPostcode(defaultKey);
  let currentWeather = defaultWeather || weatherToday || null;

  MapView.initMap("map-container");

  initUserProfile();
  initHeader();
  initPatientSummary();
  renderWeather(currentWeather);
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
      currentWeather = resolveWeatherForPostcode(rawPostcode);
    } else if (rawPostcode) {
      const postcodePractices = postcodeIndex.get(rawPostcode);
      if (postcodePractices && postcodePractices.length) {
        const area = createAreaFromPractices(postcodePractices, rawPostcode);
        currentCentre = area.coordinates;
        currentAreaLabel = area.label;
        postcodeInput.value = area.displayPostcode;
        MapView.flyToCoordinates(currentCentre.lat, currentCentre.lng);
        currentWeather = resolveWeatherForPostcode(rawPostcode);
      } else {
        currentAreaLabel = `未找到 ${formatPostcode(rawPostcode)} 对应的 GP 数据`;
        currentCentre = defaultArea?.coordinates || fallbackCentre;
        currentWeather = resolveWeatherForPostcode(rawPostcode);
      }
    } else {
      currentCentre = defaultArea?.coordinates || fallbackCentre;
      currentAreaLabel = defaultArea?.label || "英国默认视图";
      postcodeInput.value = formatPostcode(defaultKey);
      currentWeather = resolveWeatherForPostcode(defaultKey);
    }
    renderWeather(currentWeather || weatherToday);
    updateView();
  });

  resetBtn.addEventListener("click", () => {
    postcodeInput.value = formatPostcode(defaultKey);
    distanceSelect.value = "10";
    ratingSelect.value = "0";
    currentCentre = defaultArea?.coordinates || fallbackCentre;
    currentAreaLabel = defaultArea?.label || "英国默认视图";
    MapView.flyToCoordinates(currentCentre.lat, currentCentre.lng, 11);
    currentWeather = resolveWeatherForPostcode(defaultKey);
    renderWeather(currentWeather || weatherToday);
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
    const summarySource = filtered.length ? filtered : withinDistance;
    updatePatientSummarySection(summarySource, currentAreaLabel);
    renderWeather(currentWeather || weatherToday);
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
    if (headerWeatherTempEl) {
      const temp = weatherToday?.temperatureC;
      headerWeatherTempEl.textContent = Number.isFinite(temp) ? `${temp}°C` : "—";
    }
    if (headerWeatherConditionEl) {
      headerWeatherConditionEl.textContent = weatherToday?.condition || "Weather data unavailable";
    }
  }

  function initPatientSummary() {
    summaryRangeEl.textContent = patientSummary.alias || "";
    if (patientSummary.summaryLabel) {
      activityTitleEl.textContent = patientSummary.summaryLabel;
    }

    topPracticeEl.textContent = formatTopPracticeDisplay(patientSummary.topPractice);

    const avgIntervention = patientSummary.averages?.interventionPercent;
    averageInterventionEl.textContent =
      avgIntervention !== null && avgIntervention !== undefined
        ? Utils.formatPercent(avgIntervention, 1)
        : "—";

    const avgReview = patientSummary.averages?.reviewPercent;
    averageReviewEl.textContent =
      avgReview !== null && avgReview !== undefined ? Utils.formatPercent(avgReview, 1) : "—";
  }

  function renderWeather(weather, { isLoading = false } = {}) {
    const tempValue =
      weather && Number.isFinite(weather.temperatureC) ? Math.round(weather.temperatureC) : null;
    const conditionText = formatCondition(weather?.condition);

    if (headerWeatherTempEl) {
      headerWeatherTempEl.textContent = isLoading
        ? "…"
        : tempValue !== null
          ? `${tempValue}°C`
          : "—";
    }

    if (headerWeatherConditionEl) {
      headerWeatherConditionEl.textContent = isLoading
        ? "Fetching weather…"
        : conditionText || "Weather unavailable";
    }

    if (weatherIconEl) {
      weatherIconEl.textContent = selectWeatherIcon(weather, conditionText);
    }

    if (weatherSummaryEl) {
      const summaryParts = [];
      if (tempValue !== null) summaryParts.push(`${tempValue}°C`);
      if (conditionText) summaryParts.push(conditionText);
      weatherSummaryEl.textContent = summaryParts.length ? summaryParts.join(" · ") : "—";
    }

    if (weatherMetaEl) {
      weatherMetaEl.textContent = buildWeatherMeta(weather);
    }

    if (weatherAdviceEl) {
      const advice = weather?.advice || buildWeatherAdvice(weather, tempValue);
      weatherAdviceEl.textContent = isLoading ? "Updating weather…please wait." : advice;
    }
  }

  function initActivityChart() {
    const labels = getDefaultActivityLabels();
    updateActivityChart(labels, patientSummary.activity || []);
  }

  function updateActivityChart(labels, values) {
    const defaultLabels = getDefaultActivityLabels();
    const safeLabels = labels && labels.length ? labels : defaultLabels;
    const safeValues = values && values.length ? values : patientSummary.activity || [];

    const displayLabels = safeLabels.map((label) => {
      if (!label) return "";
      return label.length > 18 ? `${label.slice(0, 15)}…` : label;
    });

    activityChart.setOption({
      animation: true,
      grid: { top: 10, left: 0, right: 0, bottom: 0, containLabel: false },
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => Utils.formatPercent(value, 1)
      },
      xAxis: {
        type: "category",
        data: displayLabels,
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
          data: safeValues,
          type: "line",
          smooth: true,
          symbolSize: 6,
          lineStyle: { color: "#4e61d3", width: 3 },
          areaStyle: {
            opacity: 0.16,
            color: "#4e61d3"
          },
          itemStyle: { color: "#4e61d3" }
        }
      ]
    });
  }

  function getDefaultActivityLabels() {
    if (patientSummary.activityLabels && patientSummary.activityLabels.length) {
      return patientSummary.activityLabels;
    }
    return (patientSummary.activityDates || []).map((d) =>
      new Date(d).toLocaleDateString("en-GB", { weekday: "short" })
    );
  }

  function formatCondition(condition) {
    if (!condition) return "";
    return condition
      .toString()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function selectWeatherIcon(weather, conditionText) {
    if (weather?.icon && /^[0-9]{2}[dn]?$/.test(weather.icon)) {
      const key = weather.icon.slice(0, 2);
      const lookup = {
        "01": "☀️",
        "02": "🌤️",
        "03": "⛅",
        "04": "☁️",
        "09": "🌧️",
        "10": "🌦️",
        "11": "⛈️",
        "13": "❄️",
        "50": "🌫️"
      };
      return lookup[key] || "🌤️";
    }

    if (weather?.icon && weather.icon.trim()) {
      return weather.icon.trim();
    }

    if (conditionText) {
      const lowered = conditionText.toLowerCase();
      if (lowered.includes("storm") || lowered.includes("thunder")) return "⛈️";
      if (lowered.includes("rain") || lowered.includes("shower")) return "🌧️";
      if (lowered.includes("snow")) return "❄️";
      if (lowered.includes("fog") || lowered.includes("mist") || lowered.includes("haze"))
        return "🌫️";
      if (lowered.includes("cloud")) return "☁️";
      if (lowered.includes("sun") || lowered.includes("clear")) return "☀️";
    }

    return "🌤️";
  }

  function buildWeatherMeta(weather) {
    if (!weather) return "Weather data unavailable.";
    const detail = [];
    if (Number.isFinite(weather.humidity)) {
      detail.push(`Humidity ${Math.round(weather.humidity)}%`);
    }
    if (Number.isFinite(weather.aqi)) {
      detail.push(`AQI ${Math.round(weather.aqi)}`);
    }
    if (weather?.fetchedAt instanceof Date && !Number.isNaN(weather.fetchedAt.getTime())) {
      detail.push(
        `Updated ${weather.fetchedAt.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit"
        })}`
      );
    }
    return detail.length ? detail.join(" · ") : "—";
  }

  function buildWeatherAdvice(weather, tempValue) {
    if (!weather) return "Weather data unavailable.";
    const advice = [];

    if (Number.isFinite(tempValue)) {
      if (tempValue <= 5) {
        advice.push("Cold air can trigger breathlessness — wrap up warmly outdoors.");
      } else if (tempValue >= 26) {
        advice.push("Hot weather — stay hydrated and avoid strenuous trips outside midday.");
      }
    }

    if (Number.isFinite(weather.aqi)) {
      if (weather.aqi > 100) {
        advice.push("Air quality is poor — limit prolonged outdoor activity today.");
      } else if (weather.aqi > 70) {
        advice.push("Moderate air quality — keep rescue inhaler close if you head out.");
      }
    }

    if (Number.isFinite(weather.humidity) && weather.humidity >= 80) {
      advice.push("High humidity — pace breathing exercises and move slowly outside.");
    }

    return advice.length ? advice.join(" ") : "Maintain your usual COPD routine today.";
  }

  function formatTopPracticeDisplay(practice = {}) {
    if (!practice || !practice.name) return "—";
    const parts = [practice.name];
    if (practice.achievementPercent !== null && practice.achievementPercent !== undefined) {
      parts.push(`${Utils.formatPercent(practice.achievementPercent, 1)} achievement`);
    }
    if (practice.prevalencePercent !== null && practice.prevalencePercent !== undefined) {
      parts.push(`${Utils.formatPercent(practice.prevalencePercent, 2)} prevalence`);
    }
    if (practice.register !== null && practice.register !== undefined) {
      parts.push(`${Utils.formatInteger(practice.register)} register`);
    }
    return parts.join(" · ");
  }

  function resolveWeatherForPostcode(postcode) {
    if (!postcode) return weatherLookup.DEFAULT || weatherToday || null;
    const cleaned = Utils.normalisePostcode(postcode);
    if (!cleaned) return weatherLookup.DEFAULT || weatherToday || null;

    const candidates = [];
    const maxPrefixLength = Math.min(cleaned.length, 4);
    for (let i = maxPrefixLength; i >= 2; i -= 1) {
      candidates.push(cleaned.slice(0, i));
    }

    for (const key of candidates) {
      const match = weatherLookup[key];
      if (match) return match;
    }

    return weatherLookup.DEFAULT || weatherToday || null;
  }

  function normaliseWeatherLookup(lookup) {
    const normalised = {};
    Object.entries(lookup || {}).forEach(([key, value]) => {
      if (value && typeof value === "object") {
        normalised[key.toUpperCase()] = value;
      }
    });
    return normalised;
  }
  function updateHintText(filteredCount = 0, distanceCount = 0) {
    let detail = distanceCount
      ? `GPs in range: ${distanceCount} (radius ${distanceSelect.value} km)`
      : "No matches within the selected radius.";
    if (distanceCount && filteredCount && filteredCount !== distanceCount) {
      detail += ` · After rating filter: ${filteredCount}`;
    }
    hintEl.textContent = `${currentAreaLabel} ｜ ${detail} ｜ ${baseHintText}`;
  }

  function updatePatientSummarySection(gpsList, areaLabel) {
    const candidates = (gpsList || []).filter(
      (gp) => gp && gp.achievementPercent !== null && gp.achievementPercent !== undefined
    );

    if (!candidates.length) {
      summaryRangeEl.textContent = areaLabel || patientSummary.alias || "";
      topPracticeEl.textContent = formatTopPracticeDisplay(patientSummary.topPractice);

      const fallbackIntervention = patientSummary.averages?.interventionPercent;
      averageInterventionEl.textContent =
        fallbackIntervention !== null && fallbackIntervention !== undefined
          ? Utils.formatPercent(fallbackIntervention, 1)
          : "—";

      const fallbackReview = patientSummary.averages?.reviewPercent;
      averageReviewEl.textContent =
        fallbackReview !== null && fallbackReview !== undefined
          ? Utils.formatPercent(fallbackReview, 1)
          : "—";

      updateActivityChart(getDefaultActivityLabels(), patientSummary.activity || []);
      return;
    }

    summaryRangeEl.textContent = areaLabel || patientSummary.alias || "";

    const interventionValues = candidates
      .map((gp) => gp.interventionPercent)
      .filter((value) => value !== null && value !== undefined);
    const reviewValues = candidates
      .map((gp) => gp.reviewPercent)
      .filter((value) => value !== null && value !== undefined);

    const avgIntervention = interventionValues.length
      ? Utils.calculateAverage(interventionValues)
      : null;
    const avgReview = reviewValues.length ? Utils.calculateAverage(reviewValues) : null;

    averageInterventionEl.textContent =
      avgIntervention !== null ? Utils.formatPercent(avgIntervention, 1) : "—";
    averageReviewEl.textContent = avgReview !== null ? Utils.formatPercent(avgReview, 1) : "—";

    const topPractice = candidates.reduce((best, gp) => {
      if (!best) return gp;
      const bestValue = best.achievementPercent ?? -Infinity;
      const currentValue = gp.achievementPercent ?? -Infinity;
      if (currentValue > bestValue) return gp;
      if (currentValue === bestValue && (gp.register ?? 0) > (best.register ?? 0)) return gp;
      return best;
    }, null);

    const formattedTopPractice = topPractice
      ? {
          name: topPractice.name,
          achievementPercent: topPractice.achievementPercent,
          prevalencePercent: topPractice.prevalencePercent,
          register: topPractice.register
        }
      : null;
    topPracticeEl.textContent = formatTopPracticeDisplay(formattedTopPractice);

    const activitySubset = candidates
      .slice()
      .sort((a, b) => (b.achievementPercent ?? 0) - (a.achievementPercent ?? 0))
      .slice(0, 7);
    const activityLabels = activitySubset.map((gp) => gp.name || gp.practiceCode || "GP");
    const activityValues = activitySubset.map((gp) =>
      gp.achievementPercent !== null && gp.achievementPercent !== undefined
        ? Number(gp.achievementPercent.toFixed(1))
        : 0
    );
    updateActivityChart(activityLabels, activityValues);
  }

  function initUserProfile() {
    const profile = demoProfile || {};
    const name = profile.name || patientSummary.alias || "Demo User";
    if (userNameEl) {
      userNameEl.textContent = name;
    }

    const taglineBits = [];
    if (profile.age) taglineBits.push(`Age ${profile.age}`);
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
