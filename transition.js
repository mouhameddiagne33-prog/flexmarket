/* Transition animée entre les pages du site (rideau aux couleurs de la marque) */
(function () {
  const body = document.body;

  // Ouverture : le rideau se lève à l'arrivée sur la page
  function ouvrir() {
    body.classList.remove("page-out");
    requestAnimationFrame(() => setTimeout(() => body.classList.add("ready"), 60));
  }
  ouvrir();
  window.addEventListener("pageshow", e => { if (e.persisted) ouvrir(); });

  // Fermeture : le rideau descend avant de charger la page suivante
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const h = a.getAttribute("href");
    if (!h || h.startsWith("#") || h.startsWith("tel:") || h.startsWith("http") || a.target === "_blank") return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    body.classList.remove("ready");
    body.classList.add("page-out");
    setTimeout(() => { location.href = h; }, 550);
  });
})();
