async function init() {
    try {
        await checkUser();
        await loadBaseData();
        setupSearch();
        setupUI();

        // Ensure a basemap is active for anonymous users after UI is ready.
        if (typeof setLayer === 'function' && typeof cloudPrefs !== 'undefined') {
            setLayer(cloudPrefs.theme_preference);
        }

        if (selectedLine !== "all") {
            lineFilter.value = selectedLine;
        }

        connectWs();

        if (location.hash.startsWith("#bus=")) {
            followedBusId = decodeURIComponent(location.hash.replace("#bus=", ""));
        }
    } catch (error) {
        statusEl.innerHTML = "<span class='bad'>Greška</span>";
        console.error(error);
    }
}

init();
