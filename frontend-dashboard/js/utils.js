(function () {
  const KM_FACTOR = 6371;

  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const rLat1 = toRadians(lat1);
    const rLat2 = toRadians(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return KM_FACTOR * c;
  }

  function normalisePostcode(input) {
    return (input || "").replace(/\s+/g, "").toUpperCase();
  }

  function formatRating(value) {
    return value ? value.toFixed(1) : "—";
  }

  function formatKm(distance) {
    if (Number.isNaN(distance)) return "—";
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }

  function formatDateRange(dates) {
    if (!dates || !dates.length) return "";
    const first = new Date(dates[0]);
    const last = new Date(dates[dates.length - 1]);
    const opts = { day: "numeric", month: "short" };
    return `${first.toLocaleDateString("en-GB", opts)} – ${last.toLocaleDateString(
      "en-GB",
      opts
    )}`;
  }

  function formatLongDate(dateStr) {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function formatTime(timeStr) {
    if (!timeStr) return "";
    return timeStr.replace(/^(\d{2}):(\d{2})$/, "$1:$2");
  }

  function formatPercent(value, fractionDigits = 1) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return `${Number(value).toFixed(fractionDigits)}%`;
  }

  function formatInteger(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return Number(value).toLocaleString("en-GB");
  }

  function calculateAverage(numbers) {
    if (!numbers || !numbers.length) return 0;
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    return sum / numbers.length;
  }

  window.Utils = {
    haversineDistance,
    normalisePostcode,
    formatRating,
    formatKm,
    formatDateRange,
    formatLongDate,
    formatTime,
    formatPercent,
    formatInteger,
    calculateAverage
  };
})();
