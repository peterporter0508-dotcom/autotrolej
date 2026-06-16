async function checkUser() {
    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        currentUser = data.session.user;
        userBadge.textContent = currentUser.email.split("@")[0];
        userBadge.classList.add("logged");
        await loadCloudPrefs();
    }
}

async function loadCloudPrefs() {
    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from("user_preferences")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

    if (error && error.code === "PGRST116") {
        await supabaseClient.from("user_preferences").insert({
            user_id: currentUser.id,
            theme_preference: cloudPrefs.theme_preference,
            favorite_lines: [],
            favorite_stations: []
        });
        return;
    }

    if (!data) return;

    cloudPrefs = {
        theme_preference: data.theme_preference || cloudPrefs.theme_preference,
        favorite_lines: data.favorite_lines || [],
        favorite_stations: data.favorite_stations || []
    };

    setLayer(cloudPrefs.theme_preference);
}

async function saveCloudPrefs() {
    if (!currentUser) return;

    await supabaseClient.from("user_preferences").upsert({
        user_id: currentUser.id,
        theme_preference: cloudPrefs.theme_preference,
        favorite_lines: cloudPrefs.favorite_lines || [],
        favorite_stations: cloudPrefs.favorite_stations || [],
        updated_at: new Date().toISOString()
    });
}

function openAuth() {
    if (currentUser) {
        if (confirm("Odjaviti se?")) {
            supabaseClient.auth.signOut().then(() => location.reload());
        }
        return;
    }

    document.getElementById("authOverlay").style.display = "flex";
}

let authMode = "login";

document.getElementById("authSwitch").onclick = () => {
    authMode = authMode === "login" ? "register" : "login";
    document.getElementById("authTitle").textContent = authMode === "login" ? "Prijava" : "Registracija";
    document.getElementById("authSubmit").textContent = authMode === "login" ? "Prijavi se" : "Registriraj se";
    document.getElementById("authSwitch").textContent = authMode === "login" ? "Nemam račun" : "Imam račun";
};

document.getElementById("authClose").onclick = () => {
    document.getElementById("authOverlay").style.display = "none";
};

document.getElementById("authSubmit").onclick = async () => {
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    if (!email || !password) {
        alert("Upiši e mail i lozinku.");
        return;
    }

    const result = authMode === "login"
        ? await supabaseClient.auth.signInWithPassword({ email, password })
        : await supabaseClient.auth.signUp({ email, password });

    if (result.error) {
        alert(result.error.message);
    } else {
        location.reload();
    }
};
