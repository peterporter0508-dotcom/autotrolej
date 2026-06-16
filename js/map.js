const map = L.map("map", { zoomControl: false }).setView([45.3271, 14.4422], 12);
L.control.zoom({ position: "bottomright" }).addTo(map);

const layers = {
    dark: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }),
    light: L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }),
    sat: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 })
};

function setLayer(name) {
    Object.values(layers).forEach(layer => map.removeLayer(layer));
    layers[name].addTo(map);

    document.querySelectorAll(".layers button").forEach(button => button.classList.remove("active"));
    const active = document.getElementById("layer" + cap(name));
    if (active) active.classList.add("active");

    localStorage.setItem("theme", name);
    cloudPrefs.theme_preference = name;
    if (typeof saveCloudPrefs === 'function') {
        saveCloudPrefs();
    }
}

function stationIcon() {
    return L.divIcon({
        className: "",
        html: `<div class="stationDot"></div>`,
        iconSize: [14, 14]
    });
}

function updateRadius() {
    if (userLat === null || userLng === null) return;

    const radius = Number(document.getElementById("radiusSelect").value);

    if (radiusCircle) map.removeLayer(radiusCircle);

    radiusCircle = L.circle([userLat, userLng], {
        radius,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: .08
    }).addTo(map);
}

// Ensure a default basemap is active on startup for anonymous users.
// Use the stored preference when available; fall back to 'dark'.
if (typeof cloudPrefs !== 'undefined' && cloudPrefs.theme_preference) {
    setLayer(cloudPrefs.theme_preference);
} else {
    setLayer('dark');
}
