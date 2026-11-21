const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MAX_VIDEO_SEC = 120;
const PRODUITS = "data/produits.json";

let admin = JSON.parse(sessionStorage.getItem("fm_admin") || "null");
let produits = [];
let edition = null;

function msg(sel, texte, ok) {
  const m = $(sel);
  m.hidden = false;
  m.classList.toggle("ok", !!ok);
  m.textContent = texte;
}

/* Durée d'une vidéo (max 2 minutes) */
function dureeVideo(file) {
  return new Promise(res => {
    const u = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(u); res(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(u); res(NaN); };
    v.src = u;
  });
}

/* Connexion : code personnel + token GitHub */
$("#formLogin").onsubmit = async e => {
  e.preventDefault();
  const erreur = $("#erreur");
  const a = CONFIG.admins.find(x => x.code === $("#code").value.trim() && x.actif !== false);
  if (!a) { erreur.textContent = "Code incorrect ou admin bloqué."; erreur.hidden = false; return; }
  const token = $("#token").value.trim();
  try {
    await GH.verifier(token);
  } catch (err) {
    erreur.textContent = err.message; erreur.hidden = false; return;
  }
  sessionStorage.setItem("fm_token", token);
  sessionStorage.setItem("fm_admin", JSON.stringify(a));
  admin = a;
  $("#code").value = ""; $("#token").value = ""; erreur.hidden = true;
  montrer();
};
$("#btnSortir").onclick = () => {
  sessionStorage.removeItem("fm_admin");
  sessionStorage.removeItem("fm_token");
  admin = null; edition = null;
  montrer();
};

async function montrer() {
  $("#login").hidden = !!admin;
  $("#espace").hidden = !admin;
  $("#btnSortir").hidden = !admin;
  if (!admin) return;
  $("#qui").textContent = `${admin.nom} (${admin.lieu})`;
  try {
    produits = (await GH.lire(PRODUITS)) || [];
    rendreListe();
  } catch (err) {
    msg("#msgListe", "Impossible de charger le catalogue : " + err.message, false);
  }
  rendreGestion();
}

/* Ajout d'un compte : média + catalogue publiés sur le site */
$("#formAjout").onsubmit = async e => {
  e.preventDefault();
  const f = $("#fichier").files[0];
  if (!f) return;
  if (f.type.startsWith("video/")) {
    const d = await dureeVideo(f);
    if (isNaN(d)) return msg("#msg", "Impossible de lire cette vidéo.", false);
    if (d > MAX_VIDEO_SEC) return msg("#msg", `Vidéo trop longue (${Math.round(d)} s). Maximum : 2 minutes.`, false);
  }
  const titre = $("#titre").value.trim();
  msg("#msg", "Publication sur le site en cours…", true);
  try {
    const id = "p" + Date.now();
    const ext = f.name.split(".").pop().toLowerCase();
    const media = `media/${id}.${ext}`;
    await GH.ecrireFichier(media, f, `Média : ${titre}`);
    produits.push({
      id, titre, prix: Number($("#prix").value),
      description: $("#desc").value.trim(), vendu: false, media, ajoutePar: admin.nom
    });
    await GH.ecrire(PRODUITS, JSON.stringify(produits, null, 2), `Ajout : ${titre}`);
    e.target.reset();
    msg("#msg", "Compte publié sur le site ✔ (visible dans 1 à 2 minutes)", true);
    rendreListe();
  } catch (err) {
    msg("#msg", "Erreur : " + err.message, false);
  }
};

/* Liste : marquer vendu, supprimer (publié directement) */
function rendreListe() {
  $("#liste").innerHTML = produits.length ? produits.map(x => `
    <article class="card">
      <h3>${esc(x.titre)}</h3>
      <p class="small">${esc(x.prix)} ${CONFIG.devise} · ${x.vendu ? "<b style='color:var(--c)'>VENDU</b>" : "<span class='ok'>Disponible</span>"}</p>
      <div class="row">
        <button class="btn small ghost" data-act="vendu" data-id="${esc(x.id)}">${x.vendu ? "Remettre dispo" : "Marquer vendu"}</button>
        <button class="btn small ghost danger" data-act="suppr" data-id="${esc(x.id)}">Supprimer</button>
      </div>
    </article>`).join("") : '<p class="small">Aucun compte pour le moment.</p>';
}
$("#liste").onclick = async e => {
  const b = e.target.closest("button[data-act]");
  if (!b) return;
  const i = produits.findIndex(x => x.id === b.dataset.id);
  if (i < 0) return;
  const p = produits[i];
  try {
    if (b.dataset.act === "vendu") {
      p.vendu = !p.vendu;
      await GH.ecrire(PRODUITS, JSON.stringify(produits, null, 2), `Statut : ${p.titre}`);
    }
    if (b.dataset.act === "suppr") {
      if (!confirm("Supprimer ce compte du site ?")) return;
      if (p.media) await GH.supprimer(p.media, `Suppression média : ${p.titre}`);
      produits.splice(i, 1);
      await GH.ecrire(PRODUITS, JSON.stringify(produits, null, 2), `Suppression : ${p.titre}`);
    }
    rendreListe();
    msg("#msgListe", "Modifié sur le site ✔ (visible dans 1 à 2 minutes)", true);
  } catch (err) {
    msg("#msgListe", "Erreur : " + err.message, false);
  }
};

/* Gestion des admins (super admin uniquement) */
function rendreGestion() {
  const g = $("#gestion");
  g.hidden = !(admin && admin.superAdmin);
  if (g.hidden) return;
  if (!edition) edition = JSON.parse(JSON.stringify(CONFIG.admins));
  $("#listeAdmins").innerHTML = edition.map((a, i) => `
    <div class="card adm-line">
      <input data-i="${i}" data-k="nom" value="${esc(a.nom)}" placeholder="Nom">
      <input data-i="${i}" data-k="lieu" value="${esc(a.lieu)}" placeholder="Lieu">
      <input data-i="${i}" data-k="whatsapp" value="${esc(a.whatsapp)}" placeholder="221XXXXXXXXX">
      <input data-i="${i}" data-k="code" value="${esc(a.code)}" placeholder="Code">
      <label class="chk"><input type="checkbox" data-i="${i}" data-k="actif" ${a.actif !== false ? "checked" : ""} style="width:auto"> Actif</label>
      ${a.superAdmin ? '<span class="small">Super admin</span>' :
        `<button class="btn small ghost danger" type="button" data-del="${i}">Supprimer</button>`}
    </div>`).join("");
}
$("#listeAdmins").addEventListener("change", e => {
  const t = e.target, i = Number(t.dataset.i), k = t.dataset.k;
  if (!k || !edition[i]) return;
  edition[i][k] = t.type === "checkbox" ? t.checked : t.value.trim();
});
$("#listeAdmins").addEventListener("click", e => {
  const b = e.target.closest("[data-del]");
  if (!b) return;
  const i = Number(b.dataset.del);
  if (!confirm(`Supprimer ${edition[i].nom} de la liste ?`)) return;
  edition.splice(i, 1);
  rendreGestion();
});
$("#ajouterAdmin").onclick = () => {
  edition.push({ nom: "Nouvel admin", lieu: "", whatsapp: "221", code: "", actif: true });
  rendreGestion();
};
$("#exporterConfig").onclick = async () => {
  if (edition.some(a => !a.nom || !a.whatsapp || !a.code))
    return msg("#msgGestion", "Chaque admin doit avoir un nom, un numéro et un code.", false);
  const codes = edition.map(a => a.code);
  if (new Set(codes).size !== codes.length)
    return msg("#msgGestion", "Deux admins ont le même code. Les codes doivent être différents.", false);
  if (edition.some(a => !/^221\d{9}$/.test(a.whatsapp)))
    return msg("#msgGestion", "Numéro invalide : format attendu 221 suivi de 9 chiffres (ex. 221767587977).", false);

  const data = { ...CONFIG, admins: edition };
  const txt = `/*\n  CONFIGURATION — mise à jour depuis admin.html.\n*/\nconst CONFIG = ${JSON.stringify(data, null, 2)};\n`;
  msg("#msgGestion", "Publication en cours…", true);
  try {
    await GH.ecrire("config.js", txt, "Gestion des admins");
    msg("#msgGestion", "Publié sur le site ✔ (visible dans 1 à 2 minutes)", true);
  } catch (err) {
    msg("#msgGestion", "Erreur : " + err.message, false);
  }
};

montrer();
