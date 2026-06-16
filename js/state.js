let linije = {};
let stanice = {};
let buses = {};
let autoRefresh = true;
let showStations = false;
let selectedLine = localStorage.getItem("lastLine") || "all";
let followedBusId = null;

let userLat = null;
let userLng = null;
let userMarker = null;
let userAccuracy = null;
let radiusCircle = null;

let currentUser = null;
let cloudPrefs = {
    theme_preference: localStorage.getItem("theme") || "dark",
    favorite_lines: [],
    favorite_stations: []
};

const stationCluster = L ? L.markerClusterGroup() : null;

const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const lastUpdateEl = document.getElementById("lastUpdate");
const locStatus = document.getElementById("locStatus");
const lineFilter = document.getElementById("lineFilter");
const sidebar = document.getElementById("sidebar");
const sidebarContent = document.getElementById("sidebarContent");
const suggestions = document.getElementById("suggestions");
const searchInput = document.getElementById("searchInput");
const userBadge = document.getElementById("userBadge");
