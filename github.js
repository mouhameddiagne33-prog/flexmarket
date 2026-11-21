/* Publication directe sur le site via l'API GitHub (utilise le token de l'admin). */
const GH = (() => {
  const api = "https://api.github.com";
  const repo = () => `${CONFIG.github.owner}/${CONFIG.github.repo}`;
  const branch = () => CONFIG.github.branch || "main";
  const token = () => sessionStorage.getItem("fm_token") || "";
  const entete = t => ({ Accept: "application/vnd.github+json", Authorization: `Bearer ${t}`, "X-GitHub-Api-Version": "2022-11-28" });
  const url = path => `${api}/repos/${repo()}/contents/${path}`;

  async function erreur(r) {
    try { return (await r.json()).message || `erreur ${r.status}`; }
    catch { return `erreur ${r.status}`; }
  }
  function encoder(texte) {
    const bytes = new TextEncoder().encode(texte);
    let bin = ""; bytes.forEach(b => bin += String.fromCharCode(b));
    return btoa(bin);
  }
  function fichierB64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = () => rej(new Error("lecture du fichier impossible"));
      r.readAsDataURL(file);
    });
  }
  async function sha(path) {
    const r = await fetch(`${url(path)}?ref=${branch()}`, { headers: entete(token()) });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(await erreur(r));
    return (await r.json()).sha;
  }
  async function ecrireB64(path, contenuB64, message) {
    const body = { message, content: contenuB64, branch: branch() };
    const s = await sha(path);
    if (s) body.sha = s;
    const r = await fetch(url(path), {
      method: "PUT",
      headers: { ...entete(token()), "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(await erreur(r));
  }

  return {
    /* Vérifie le token et l'accès au dépôt */
    async verifier(t) {
      const r = await fetch(`${api}/repos/${repo()}`, { headers: entete(t) });
      if (r.status === 404) throw new Error("Dépôt introuvable : vérifie owner et repo dans config.js.");
      if (!r.ok) throw new Error("Token invalide ou sans accès au dépôt.");
    },
    /* Lit un fichier JSON du dépôt (toujours à jour) */
    async lire(path) {
      const r = await fetch(`${url(path)}?ref=${branch()}`, { headers: entete(token()) });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(await erreur(r));
      const j = await r.json();
      const bin = atob(j.content.replace(/\n/g, ""));
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    },
    ecrire(path, texte, message) { return ecrireB64(path, encoder(texte), message); },
    async ecrireFichier(path, file, message) { return ecrireB64(path, await fichierB64(file), message); },
    async supprimer(path, message) {
      const s = await sha(path);
      if (!s) return;
      const r = await fetch(url(path), {
        method: "DELETE",
        headers: { ...entete(token()), "Content-Type": "application/json" },
        body: JSON.stringify({ message, sha: s, branch: branch() })
      });
      if (!r.ok) throw new Error(await erreur(r));
    }
  };
})();
