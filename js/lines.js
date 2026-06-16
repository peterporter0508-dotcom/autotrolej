function showSchedule(uniqueId) {
    if (!uniqueId || uniqueId === "all") {
        alert("Odaberi liniju.");
        return;
    }

    openSidebar("<h2>Učitavanje voznog reda...</h2>");

    fetch(API + "/polasciLinija?uniqueLinijaId=" + encodeURIComponent(uniqueId))
        .then(r => r.json())
        .then(data => {
            const line = data.res;

            if (!line || !line.polazakList || line.polazakList.length === 0) {
                openSidebar("<h2>Nema voznog reda.</h2>");
                return;
            }

            saveHistory("line", uniqueId, "Linija " + line.brojLinije);

            const tripsById = {};
            line.polazakList.forEach(item => {
                if (!tripsById[item.voznjaId]) tripsById[item.voznjaId] = [];
                tripsById[item.voznjaId].push(item);
            });

            const trips = Object.values(tripsById)
                .map(trip => trip.sort((a, b) => new Date(a.polazak) - new Date(b.polazak)))
                .sort((a, b) => new Date(a[0].polazak) - new Date(b[0].polazak));

            const now = new Date();
            const upcoming = trips.filter(trip => new Date(trip[0].polazak) >= now).slice(0, 7);

            let html = `
                <h2>Linija ${escapeHtml(line.brojLinije)}</h2>
                <p class="small">${escapeHtml(line.naziv || "")}</p>
                <button class="green" onclick="toggleFavorite('line','${escapeHtml(line.brojLinije)}','Linija ${escapeHtml(line.brojLinije)}')">★ Spremi liniju</button>
                <h3>Smjerovi i varijante</h3>
            `;

            Object.entries(linije)
                .filter(([key, l]) => l.brojLinije === line.brojLinije)
                .forEach(([key, l]) => {
                    html += `<button class="secondary" onclick="showSchedule('${escapeHtml(key)}')">${escapeHtml(l.smjerNaziv || "")} | ${escapeHtml(l.naziv || "")}</button>`;
                });

            html += `<h3>Sljedeći polasci</h3>`;

            if (upcoming.length === 0) {
                html += `<p class="small">Nema više polazaka danas.</p>`;
            }

            upcoming.forEach(trip => {
                html += `<div class="trip"><b>Polazak: ${formatTime(trip[0].polazak)}</b>`;

                trip.forEach(item => {
                    const station = stanice[item.stanicaId];
                    const stationName = station ? station.naziv : "Stanica " + item.stanicaId;

                    html += `
                        <div class="stationRow">
                            <span>${escapeHtml(stationName)}</span>
                            <b>${formatTime(item.polazak)}</b>
                        </div>
                    `;
                });

                html += `</div>`;
            });

            openSidebar(html);
        })
        .catch(error => {
            console.error(error);
            openSidebar("<h2>Greška pri učitavanju voznog reda.</h2>");
        });
}
