// Mobile UI: FAB toggle for expanded panel
document.addEventListener('DOMContentLoaded', function () {
    const fab = document.createElement('button');
    fab.id = 'mobileFab';
    fab.className = 'mobile-fab';
    fab.setAttribute('aria-expanded', 'false');
    fab.innerText = '\u2630'; // ☰
    document.body.appendChild(fab);

    const panel = document.querySelector('.panel');
    if (!panel) return;

    function togglePanel() {
        const expanded = panel.classList.toggle('mobile-expanded');
        fab.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        // keep focus visible
        if (expanded) panel.scrollTop = 0;
    }

    fab.addEventListener('click', function (e) {
        e.stopPropagation();
        togglePanel();
    });

    // Close when tapping outside the panel
    document.addEventListener('click', function (e) {
        if (!panel.classList.contains('mobile-expanded')) return;
        if (panel.contains(e.target) || fab.contains(e.target)) return;
        panel.classList.remove('mobile-expanded');
        fab.setAttribute('aria-expanded', 'false');
    });
});
