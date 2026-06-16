function saveHistory(type, value, label) {
    let history = JSON.parse(localStorage.getItem("history") || "[]");
    history = history.filter(item => String(item.value) !== String(value));
    history.unshift({ type, value, label });
    history = history.slice(0, 10);
    localStorage.setItem("history", JSON.stringify(history));
}

function localFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function saveLocalFavorites(favorites) {
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

function getAllFavorites() {
    if (!currentUser) return localFavorites();

    return [
        ...(cloudPrefs.favorite_lines || []).map(item => ({ type: "line", id: item.id, name: item.name })),
        ...(cloudPrefs.favorite_stations || []).map(item => ({ type: "station", id: item.id, name: item.name }))
    ];
}

function toggleFavorite(type, id, name) {
    if (currentUser) {
        const key = type === "line" ? "favorite_lines" : "favorite_stations";
        let arr = cloudPrefs[key] || [];

        if (arr.some(item => String(item.id) === String(id))) {
            arr = arr.filter(item => String(item.id) !== String(id));
        } else {
            const customName = prompt("Naziv favorita:", name) || name;
            arr.push({ id, name: customName });
        }

        cloudPrefs[key] = arr;
        saveCloudPrefs();
        return;
    }

    let favorites = localFavorites();

    if (favorites.some(item => item.type === type && String(item.id) === String(id))) {
        favorites = favorites.filter(item => !(item.type === type && String(item.id) === String(id)));
    } else {
        const customName = prompt("Naziv favorita:", name) || name;
        favorites.push({ type, id, name: customName });
    }

    saveLocalFavorites(favorites);
}

function openFavorite(type, id) {
    if (type === "station") {
        const station = stanice[id];
        if (station) map.setView([station.gpsY, station.gpsX], 16);
        showStationBoard(id);
    }

    if (type === "line") {
        selectedLine = id;
        lineFilter.value = id;
        localStorage.setItem("lastLine", id);
        updateVisibleBuses();

        const key = Object.keys(linije).find(k => linije[k].brojLinije === id);
        if (key) showSchedule(key);
    }
}
