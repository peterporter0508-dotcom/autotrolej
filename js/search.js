function setupSearch() {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        suggestions.innerHTML = "";

        if (!query) {
            suggestions.style.display = "none";
            return;
        }

        const items = [];

        Object.entries(linije).forEach(([key, line]) => {
            const text = `${line.brojLinije} ${line.naziv} ${line.smjerNaziv}`.toLowerCase();
            if (text.includes(query)) {
                items.push({ type: "line", key, label: `🚌 Linija ${line.brojLinije} | ${line.naziv}` });
            }
        });

        Object.values(stanice).forEach(station => {
            if (station.naziv && station.naziv.toLowerCase().includes(query)) {
                items.push({ type: "station", id: station.id, label: `🚏 ${station.naziv}` });
            }
        });

        if (items.length === 0) {
            suggestions.style.display = "none";
            return;
        }

        suggestions.style.display = "block";

        items.slice(0, 10).forEach(item => {
            const div = document.createElement("div");
            div.className = "suggestion";
            div.textContent = item.label;

            div.onclick = () => {
                suggestions.style.display = "none";
                searchInput.value = item.label;

                if (item.type === "line") {
                    selectedLine = linije[item.key].brojLinije;
                    lineFilter.value = selectedLine;
                    localStorage.setItem("lastLine", selectedLine);
                    updateVisibleBuses();
                    showSchedule(item.key);
                } else {
                    const station = stanice[item.id];
                    map.setView([station.gpsY, station.gpsX], 16);
                    showStationBoard(item.id);
                }
            };

            suggestions.appendChild(div);
        });
    });
}
