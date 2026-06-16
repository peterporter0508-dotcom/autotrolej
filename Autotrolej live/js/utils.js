function cap(s) {
    return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatTime(value) {
    if (!value) return "";
    return new Date(value).toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" });
}

function nowText() {
    return new Date().toLocaleTimeString("hr-HR");
}

function distance(a, b, c, d) {
    return map.distance([a, b], [c, d]);
}

function distanceFromMe(lat, lng) {
    if (userLat === null || userLng === null) return null;
    return distance(userLat, userLng, lat, lng);
}

function formatDistance(meters) {
    return meters < 1000 ? Math.round(meters) + " m" : (meters / 1000).toFixed(1) + " km";
}

function lineColor(line) {
    const n = String(line || "").replace(".", "");

    if (["1","1A","1B","2","2A","3","3A"].includes(n)) return "#3b82f6";
    if (["4","4A","5","5A","6","7","7A","8"].includes(n)) return "#10b981";
    if (["10","10A","11","12","12A","13","14","15"].includes(n)) return "#a855f7";
    if (["18","18A","18B","19","20","21","22","23","23A"].includes(n)) return "#f97316";
    if (["25","26","27","29","29A","30","32","32A","34","35","36","37"].includes(n)) return "#ef4444";
    return "#64748b";
}
