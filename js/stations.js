// Cache for station arrival results to avoid duplicate requests (TTL in ms)
const STATION_CACHE_TTL = 30 * 1000;
const stationCache = {}; // { [stationId]: { ts: number, data: object } }

function getCachedStation(id) {
    const e = stationCache[id];
    if (!e) return null;
    if (Date.now() - e.ts > STATION_CACHE_TTL) {
        delete stationCache[id];
        return null;
    }
    return e.data;
}

function setCachedStation(id, data) {
    try {
        stationCache[id] = { ts: Date.now(), data };
    } catch (e) {
        // ignore cache failures
    }
}

async function loadBaseData() {
    statusEl.textContent = "API";

    const [linesResponse, stationsResponse] = await Promise.all([
        fetch(API + "/linije").then(r => r.json()),
        fetch(API + "/stanice").then(r => r.json())
    ]);

    linije = linesResponse.res || {};
    stanice = stationsResponse.res || {};

    const uniqueLines = [...new Set(Object.values(linije).map(line => line.brojLinije).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b), "hr", { numeric: true }));

    lineFilter.innerHTML = `<option value="all">Sve linije</option>`;

    uniqueLines.forEach(line => {
        const option = document.createElement("option");
        option.value = line;
        option.textContent = "Linija " + line;
        if (line === selectedLine) option.selected = true;
        lineFilter.appendChild(option);
    });

    buildStationMarkers();
}

function buildStationMarkers() {
    stationCluster.clearLayers();

    Object.values(stanice).forEach(station => {
        const lat = Number(station.gpsY);
        const lng = Number(station.gpsX);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const marker = L.marker([lat, lng], { icon: stationIcon() });
        marker.bindPopup(stationPopupHtml(station, null, false));
        marker.on("popupopen", () => refreshStationPopup(marker, station));
        stationCluster.addLayer(marker);
    });

    if (stationCluster && typeof stationCluster.on === "function" && !stationCluster._clusterClickAttached) {
        stationCluster._clusterClickAttached = true;
        stationCluster.on("clusterclick", event => {
            const bounds = event.layer.getBounds();
            if (bounds && map && typeof map.fitBounds === "function") {
                map.fitBounds(bounds, { padding: [40, 40] });
            }
        });
    }

    const totalStations = Object.keys(stanice).length;
    const renderedMarkers = stationCluster ? stationCluster.getLayers().length : 0;
    console.log("Stations loaded:", totalStations, "Rendered station markers:", renderedMarkers);
}

function stationPopupHtml(station, arrivals, loading) {
    const lat = Number(station.gpsY);
    const lng = Number(station.gpsX);
    const distMeters = distanceFromMe(lat, lng);
    const distText = distMeters === null ? "" : `<div class="station-meta">Udaljenost: ${formatDistance(distMeters)}</div>`;
    const stationId = escapeHtml(station.id);

    let arrivalHtml;
    if (loading) {
        arrivalHtml = `<div class="small">Učitavanje dolazaka...</div>`;
    } else if (!arrivals || arrivals.length === 0) {
        arrivalHtml = `<div class="small">Nema dolazaka.</div>`;
    } else {
        arrivalHtml = arrivals.map(item => {
            const line = linije[item.uniqueLinijaId];
            const lineNumber = line ? line.brojLinije : item.linijaId;
            const routeName = line ? line.naziv : item.uniqueLinijaId;
            const mins = Math.max(0, Math.round((new Date(item.polazak) - new Date()) / 60000));

            return `
                <div class="boardRow">
                    <b style="color:${lineColor(lineNumber)}">${escapeHtml(lineNumber)}</b>
                    <span>${escapeHtml(routeName)}</span>
                    <b class="${mins <= 4 ? "bad" : "ok"}">${formatTime(item.polazak)}</b>
                </div>`;
        }).join("");
    }

    return `
        <div class="station-popup">
            <div class="station-header"><strong>${escapeHtml(station.naziv)}</strong></div>
            <div class="station-sub small">${escapeHtml(station.smjer || "")}</div>
            <div class="station-meta">ID: ${stationId}</div>
            <div class="station-meta">Coords: ${escapeHtml(lat.toFixed(6))}, ${escapeHtml(lng.toFixed(6))}</div>
            ${distText}
            <div class="station-arrivals">
                <h3>Planirani polasci</h3>
                ${arrivalHtml}
                <p class="small">Prikazana vremena su prema voznom redu. Stvarna kašnjenja nisu dostupna u javnom API-ju.</p>
            </div>
            <div class="station-actions">
                <button onclick="showStationBoard('${stationId}')">🗺️ Vozni red stanice</button>
                <button class="green" onclick="toggleFavorite('station','${stationId}','${escapeHtml(station.naziv)}')">★ Spremi stanicu</button>
                <button onclick="centerOnStation('${stationId}')">📍 Center</button>
                <button onclick="shareStation('${stationId}')">📤 Podijeli</button>
            </div>
        </div>
    `;
}

function refreshStationPopup(marker, station) {
    if (marker.arrivalsLoading || marker.arrivalsLoaded) return;

    // Try cache first
    const cached = getCachedStation(station.id);
    if (cached) {
        const arrivals = (cached.polazakList || [])
            .filter(item => new Date(item.polazak) >= new Date())
            .sort((a, b) => new Date(a.polazak) - new Date(b.polazak))
            .slice(0, 5);

        marker.arrivalsLoaded = true;
        marker.arrivals = arrivals;
        try { marker.setPopupContent(stationPopupHtml(station, arrivals, false)); } catch (e) {}
        return;
    }

    marker.arrivalsLoading = true;
    marker.setPopupContent(stationPopupHtml(station, null, true));

    fetch(API + "/polasciStanica?stanicaId=" + encodeURIComponent(station.id))
        .then(r => r.json())
        .then(data => {
            const stationData = data.res || {};
            // Cache full station response
            setCachedStation(station.id, stationData);

            const arrivals = (stationData.polazakList || [])
                .filter(item => new Date(item.polazak) >= new Date())
                .sort((a, b) => new Date(a.polazak) - new Date(b.polazak))
                .slice(0, 5);

            marker.arrivalsLoaded = true;
            marker.arrivals = arrivals;

            if (marker.getPopup && marker.getPopup() && marker.getPopup().isOpen()) {
                marker.setPopupContent(stationPopupHtml(station, arrivals, false));
            }
        })
        .catch(error => {
            console.error(error);
            if (marker.getPopup && marker.getPopup() && marker.getPopup().isOpen()) {
                marker.setPopupContent(`
                    <div class="station-popup">
                        <div class="station-header"><strong>${escapeHtml(station.naziv)}</strong></div>
                        <div class="small">Greška pri učitavanju dolazaka.</div>
                        <button onclick="showStationBoard('${escapeHtml(station.id)}')">🗺️ Vozni red stanice</button>
                    </div>
                `);
            }
        })
        .finally(() => {
            marker.arrivalsLoading = false;
        });
}

function centerOnStation(stationId) {
    const station = stanice[stationId];
    if (!station) return;
    map.setView([Number(station.gpsY), Number(station.gpsX)], 16);
}

function shareStation(stationId) {
    const url = location.href.split("#")[0] + "#station=" + encodeURIComponent(stationId);

    navigator.clipboard.writeText(url)
        .then(() => alert("Link za stanicu je kopiran."))
        .catch(() => prompt("Kopiraj link:", url));
}

function showStationBoard(stationId) {
    openSidebar("<h2>Učitavanje stanice...</h2>");

    // Try cache first
    const cached = getCachedStation(stationId);
    if (cached) {
        renderStationBoard(cached);
        return;
    }

    fetch(API + "/polasciStanica?stanicaId=" + encodeURIComponent(stationId))
        .then(r => r.json())
        .then(data => {
            const station = data.res;

            if (!station) {
                openSidebar("<h2>Nema podataka.</h2>");
                return;
            }

            // cache full station response
            setCachedStation(stationId, station);

            renderStationBoard(station);
        })
        .catch(error => {
            console.error(error);
            openSidebar("<h2>Greška pri učitavanju stanice.</h2>");
        });
}

function renderStationBoard(station) {
    saveHistory("station", station.id, station.naziv);

    const now = new Date();
    const list = (station.polazakList || [])
        .filter(item => new Date(item.polazak) >= now)
        .sort((a, b) => new Date(a.polazak) - new Date(b.polazak))
        .slice(0, 28);

    let html = `
        <h2>${escapeHtml(station.naziv)}</h2>
        <p class="small">${escapeHtml(station.smjer || "")}</p>
        <button class="green" onclick="toggleFavorite('station','${station.id}','${escapeHtml(station.naziv)}')">★ Spremi stanicu</button>
        <h3>Vozni red stanice</h3>
    `;

    if (list.length === 0) {
        html += `<p class="small">Nema dolazaka.</p>`;
    }

    list.forEach(item => {
        const line = linije[item.uniqueLinijaId];
        const lineNumber = line ? line.brojLinije : item.linijaId;
        const mins = Math.max(0, Math.round((new Date(item.polazak) - now) / 60000));

        html += `
            <div class="boardRow">
                <b style="color:${lineColor(lineNumber)}">${escapeHtml(lineNumber)}</b>
                <span>${escapeHtml(line ? line.naziv : item.uniqueLinijaId)}</span>
                <b class="${mins <= 4 ? "bad" : "ok"}">${mins} min</b>
            </div>
        `;
    });

    html += `<p class="small">Prikazana vremena su prema voznom redu. Stvarna kašnjenja nisu dostupna u javnom API-ju.</p>`;
    openSidebar(html);
}

function nearestStation() {
    if (userLat === null || userLng === null) return null;

    let best = null;
    let bestDistance = Infinity;

    Object.values(stanice).forEach(station => {
        const lat = Number(station.gpsY);
        const lng = Number(station.gpsX);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const d = distance(userLat, userLng, lat, lng);
        if (d < bestDistance) {
            best = station;
            bestDistance = d;
        }
    });

    return best;
}
