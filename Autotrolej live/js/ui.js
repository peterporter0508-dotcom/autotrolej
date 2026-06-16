function closeSidebar() {
    sidebar.style.display = "none";
}

function openSidebar(html) {
    sidebar.style.display = "block";
    sidebarContent.innerHTML = html;
}

function setupUI() {
    document.addEventListener("click", event => {
        if (event.target !== searchInput) suggestions.style.display = "none";
    });

    document.getElementById("locBtn").onclick = () => {
        if (!navigator.geolocation) {
            alert("Preglednik ne podržava lokaciju.");
            return;
        }

        locStatus.textContent = "tražim";

        navigator.geolocation.watchPosition(position => {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;
            locStatus.textContent = "uključena";

            if (!userMarker) {
                userMarker = L.circleMarker([userLat, userLng], {
                    radius: 8,
                    color: "#fff",
                    fillColor: "#3b82f6",
                    fillOpacity: 1
                }).addTo(map).bindPopup("Moja lokacija");

                map.setView([userLat, userLng], 15);
            } else {
                userMarker.setLatLng([userLat, userLng]);
            }

            if (userAccuracy) map.removeLayer(userAccuracy);

            userAccuracy = L.circle([userLat, userLng], {
                radius: position.coords.accuracy || 30,
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: .10
            }).addTo(map);

            updateRadius();

            Object.values(buses).forEach(bus => {
                bus.marker.setPopupContent(popupHtml(bus.busId, bus.key, bus.lat, bus.lng));
            });

        }, () => {
            locStatus.textContent = "odbijena";
            alert("Lokacija nije uključena.");
        }, {
            enableHighAccuracy: true,
            maximumAge: 5000
        });
    };

    document.getElementById("radiusSelect").onchange = updateRadius;

    lineFilter.onchange = () => {
        selectedLine = lineFilter.value;
        localStorage.setItem("lastLine", selectedLine);
        updateVisibleBuses();
    };

    document.getElementById("scheduleBtn").onclick = () => {
        if (selectedLine === "all") {
            alert("Prvo odaberi liniju.");
            return;
        }

        const key = Object.keys(linije).find(id => linije[id].brojLinije === selectedLine);
        if (key) showSchedule(key);
    };

    document.getElementById("nearestBtn").onclick = () => {
        const station = nearestStation();
        if (!station) {
            alert("Prvo uključi lokaciju.");
            return;
        }

        map.setView([station.gpsY, station.gpsX], 16);
        showStationBoard(station.id);
    };

    document.getElementById("stationsBtn").onclick = () => {
        showStations = !showStations;

        if (showStations) {
            map.addLayer(stationCluster);
            document.getElementById("stationsBtn").textContent = "Sakrij stanice";
        } else {
            map.removeLayer(stationCluster);
            document.getElementById("stationsBtn").textContent = "Prikaži stanice";
        }
    };

    document.getElementById("autoBtn").onclick = () => {
        autoRefresh = !autoRefresh;
        document.getElementById("autoBtn").textContent = "Auto osvježavanje: " + (autoRefresh ? "uključeno" : "isključeno");
    };

    document.getElementById("searchBtn").onclick = () => {
        const first = suggestions.querySelector(".suggestion");
        if (first) first.click();
    };

    document.getElementById("favoritesBtn").onclick = () => {
        const favorites = getAllFavorites();
        let html = "<h2>Omiljeno</h2>";

        if (favorites.length === 0) {
            html += "<p class='small'>Nema favorita.</p>";
        }

        favorites.forEach(item => {
            html += `<button class="secondary" onclick="openFavorite('${escapeHtml(item.type)}','${escapeHtml(item.id)}')">★ ${escapeHtml(item.name)}</button>`;
        });

        openSidebar(html);
    };

    document.getElementById("historyBtn").onclick = () => {
        const history = JSON.parse(localStorage.getItem("history") || "[]");
        let html = "<h2>Povijest</h2>";

        if (history.length === 0) {
            html += "<p class='small'>Nema povijesti.</p>";
        }

        history.forEach(item => {
            html += `<button class="secondary" onclick="openHistory('${escapeHtml(item.type)}','${escapeHtml(item.value)}')">${escapeHtml(item.label)}</button>`;
        });

        openSidebar(html);
    };

    function openHistory(type, value) {
        if (type === "line") showSchedule(value);
        if (type === "station") showStationBoard(value);
    }

    map.on("click", event => {
        let best = null;
        let bestDistance = Infinity;

        Object.values(stanice).forEach(station => {
            const lat = Number(station.gpsY);
            const lng = Number(station.gpsX);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            const d = distance(event.latlng.lat, event.latlng.lng, lat, lng);
            if (d < bestDistance) {
                best = station;
                bestDistance = d;
            }
        });

        if (best && bestDistance < 500) {
            showStationBoard(best.id);
        }
    });
}
