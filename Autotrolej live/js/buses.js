let wsGlobal = null;

function busIcon(line, idle) {
    return L.divIcon({
        className: "",
        html: `<div class="busIcon ${idle ? "idle" : ""}" style="background:${lineColor(line)}">${escapeHtml(line)}</div>`,
        iconSize: [54, 28]
    });
}

function popupHtml(busId, key, lat, lng) {
    const line = linije[key];
    const lineNumber = line ? line.brojLinije : key;
    const routeName = line ? line.naziv : "Nepoznata linija";

    const vehicleId = (buses[busId] && buses[busId].vehicleId) ? buses[busId].vehicleId : '';
    const distMeters = distanceFromMe(lat, lng);
    const distText = distMeters === null ? '' : `<div class="small">Udaljenost: ${formatDistance(distMeters)}</div>`;
    const lastUpdate = nowText();

    return `
        <div class="bus-popup">
          <div class="bus-header">
            <div class="bus-line">Linija <strong>${escapeHtml(lineNumber)}</strong></div>
            <div class="bus-meta small">Bus ID: ${escapeHtml(busId)}</div>
          </div>
          <div class="bus-sub small">${escapeHtml(routeName)}</div>
          <div class="bus-info">
            <div>Vehicle ID: ${escapeHtml(vehicleId) || '&mdash;'}</div>
            <div>Last update: ${escapeHtml(lastUpdate)}</div>
            <div>Coords: ${escapeHtml(lat.toFixed(6))}, ${escapeHtml(lng.toFixed(6))}</div>
            ${distText}
          </div>
          <div class="bus-actions">
            <button onclick="centerOnBus('${escapeHtml(busId)}')">📍 Center on bus</button>
            <button onclick="toggleFavorite('line','${escapeHtml(lineNumber)}','Linija ${escapeHtml(lineNumber)}')">⭐ Save line</button>
            <button onclick="shareBus('${escapeHtml(busId)}')">📤 Share bus</button>
          </div>
        </div>
    `;
}

function centerOnBus(busId) {
    const bus = buses[busId];
    if (!bus) return;
    if (map && typeof map.setView === 'function') {
        map.setView([bus.lat, bus.lng], 16);
    }
    try { bus.marker.openPopup(); } catch (e) {}
}

function updateVisibleBuses() {
    let visible = 0;

    Object.values(buses).forEach(bus => {
        const shouldShow = selectedLine === "all" || bus.lineNumber === selectedLine;

        const markerOnMap = map && typeof map.hasLayer === 'function' && map.hasLayer(bus.marker);

        if (shouldShow) {
            if (!markerOnMap) bus.marker.addTo(map);
            visible++;
        } else {
            if (markerOnMap) map.removeLayer(bus.marker);
        }
    });

    countEl.textContent = visible;
}

function connectWs() {
    statusEl.textContent = "Spajanje";

    // Ensure only one active WebSocket exists
    try {
        if (wsGlobal && (wsGlobal.readyState === WebSocket.OPEN || wsGlobal.readyState === WebSocket.CONNECTING)) {
            console.log("WebSocket already active, skipping connect.");
            return;
        }

        wsGlobal = new WebSocket(WS_URL);
    } catch (error) {
        statusEl.innerHTML = "<span class='bad'>WS greška</span>";
        console.error(error);
        wsGlobal = null;
        return;
    }

    wsGlobal.onopen = () => {
        statusEl.innerHTML = "<span class='ok'>Spojeno</span>";
    };

    wsGlobal.onclose = () => {
        statusEl.innerHTML = "<span class='bad'>Prekinuto</span>";
        // clear global reference so reconnect can create a fresh socket
        wsGlobal = null;
        setTimeout(connectWs, 4000);
    };

    wsGlobal.onerror = error => {
        statusEl.innerHTML = "<span class='bad'>Greška</span>";
        console.error("WebSocket error", error);
    };

    wsGlobal.onmessage = event => {
        if (!autoRefresh) return;

        const rows = String(event.data || "").split("\n");

        rows.forEach(row => {
            if (!row.trim()) return;

            const p = row.split(";");
            if (p.length < 6) return;

            const busId = p[0];
            const lat = parseFloat(p[3]);
            const lng = parseFloat(p[4]);
            const key = p[5];

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            const lineNumber = linije[key]?.brojLinije || key;

            let idle = false;
            if (buses[busId]) {
                idle = buses[busId].lat === lat && buses[busId].lng === lng;
            }

            if (!buses[busId]) {
                const marker = L.marker([lat, lng], {
                    icon: busIcon(lineNumber, idle)
                }).bindPopup(popupHtml(busId, key, lat, lng));

                buses[busId] = { marker, busId, key, lineNumber, lat, lng };
            } else {
                const bus = buses[busId];
                bus.marker.setLatLng([lat, lng]);
                bus.marker.setIcon(busIcon(lineNumber, idle));
                bus.marker.setPopupContent(popupHtml(busId, key, lat, lng));

                bus.key = key;
                bus.lineNumber = lineNumber;
                bus.lat = lat;
                bus.lng = lng;
            }

            if (followedBusId === busId) {
                map.panTo([lat, lng], { animate: true });
            }
        });

        lastUpdateEl.textContent = nowText();
        updateVisibleBuses();
    };
}

function followBus(busId) {
    followedBusId = followedBusId === busId ? null : busId;
    const bus = buses[busId];

    if (bus) {
        map.setView([bus.lat, bus.lng], 16);
        bus.marker.openPopup();
    }
}

function shareBus(busId) {
    const url = location.href.split("#")[0] + "#bus=" + encodeURIComponent(busId);

    navigator.clipboard.writeText(url)
        .then(() => alert("Link za autobus je kopiran."))
        .catch(() => prompt("Kopiraj link:", url));
}
