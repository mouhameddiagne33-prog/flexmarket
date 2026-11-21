const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const WA = (num, msg = "") => `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ADMINS = CONFIG.admins.filter(x => x.actif !== false);

/* Catalogue publié sur le site */
async function getProduits() {
  try {
    const r = await fetch(`data/produits.json?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) throw new Error();
    return await r.json();
  } catch { return CONFIG.produitsInitiaux; }
}

/* Menu hamburger */
const burger = $("#burger"), menu = $("#menu");
if (burger && menu) {
  burger.onclick = () => {
    const ouvert = menu.classList.toggle("open");
    burger.classList.toggle("open", ouvert);
    burger.setAttribute("aria-expanded", ouvert);
  };
}

/* Lien actif dans le menu */
const page = location.pathname.split("/").pop() || "index.html";
$$("#menu a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === page));

/* Admins (accueil et page vendre) */
$$("[data-admins]").forEach(el => el.innerHTML = ADMINS.map(a => `
  <article class="card admin reveal">
    <div class="avatar">${esc(a.nom.charAt(0))}</div>
    <h3>${esc(a.nom)}</h3>
    <p>📍 ${esc(a.lieu)}</p>
    <p>📱 ${esc("+" + a.whatsapp.replace(/^221/, "221 "))}</p>
    <div class="row">
      <a class="btn small ghost" href="tel:+${a.whatsapp}">📞 Appeler</a>
      <a class="btn small wa" target="_blank" rel="noopener"
         href="${WA(a.whatsapp, "Bonjour, je veux vendre un compte Flexity.")}">WhatsApp</a>
    </div>
  </article>`).join(""));

/* Formulaire vente */
const selAdmin = $("#selAdmin");
if (selAdmin) {
  selAdmin.innerHTML = ADMINS.map((a, i) => `<option value="${i}">${esc(a.nom)} — ${esc(a.lieu)}</option>`).join("");
  $("#formVente").onsubmit = e => {
    e.preventDefault();
    const a = ADMINS[selAdmin.value];
    const msg = `Bonjour ${a.nom}, je veux vendre un compte Flexity.\n` +
      `Titre : ${$("#vTitre").value}\nPrix souhaité : ${$("#vPrix").value} ${CONFIG.devise}\n` +
      `Description : ${$("#vDesc").value || "-"}`;
    window.open(WA(a.whatsapp, msg), "_blank", "noopener");
  };
}

/* Bouton commander (page commandes) */
const btnCom = $("#btnCommander");
if (btnCom) btnCom.href = WA(CONFIG.whatsappPrincipal, "Bonjour, je veux commander un compte Flexity.");

/* Catalogue */
let cache = null;
let filtre = "tous";
$$(".filters button").forEach(b => b.onclick = () => {
  filtre = b.dataset.f;
  $$(".filters button").forEach(x => x.classList.toggle("on", x === b));
  rendreCatalogue();
});

function majStats(liste) {
  const el = $("#statDispo");
  if (el) el.textContent = liste.filter(x => !x.vendu).length;
}

async function rendreCatalogue() {
  const grille = $("#grille");
  cache = cache || await getProduits();
  majStats(cache);
  if (!grille) return;
  const liste = cache.filter(x => filtre === "tous" || (filtre === "dispo" ? !x.vendu : x.vendu));
  grille.innerHTML = liste.length ? liste.map(x => {
    const media = !x.media ? '<div class="ph">FX</div>'
      : /\.(mp4|webm|mov)$/i.test(x.media)
        ? `<video src="${esc(x.media)}" muted loop playsinline autoplay></video>`
        : `<img src="${esc(x.media)}" alt="">`;
    return `
    <article class="card produit reveal ${x.vendu ? "is-sold" : ""}">
      <div class="media">${media}${x.vendu ? '<span class="sold">SOLD OUT</span>' : ""}</div>
      <h3>${esc(x.titre)}</h3>
      <p class="desc">${esc(x.description)}</p>
      <div class="row">
        <b class="prix">${esc(x.prix)} ${CONFIG.devise}</b>
        ${x.vendu ? '<span class="btn small ghost">Vendu</span>' :
          `<a class="btn small primary" target="_blank" rel="noopener"
             href="${WA(CONFIG.whatsappPrincipal, `Bonjour, je veux commander : ${x.titre} (${x.prix} ${CONFIG.devise})`)}">Commander</a>`}
      </div>
    </article>`;
  }).join("") : '<p class="small">Aucun compte dans cette catégorie.</p>';
  observer();
}

/* Animations d'apparition */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
}, { threshold: .12 });
function observer() { $$(".reveal:not(.in)").forEach(el => io.observe(el)); }

$$(".annee").forEach(el => el.textContent = new Date().getFullYear());

rendreCatalogue();
observer();
