# Flex Market SN

Site front-end (HTML, CSS, JavaScript), sans backend.

## Fichiers
- `index.html` : accueil (logo, description, admins)
- `catalogue.html` : catalogue des comptes (filtres, grille)
- `commandes.html` : commande directe sur WhatsApp
- `vendre.html` : vendre un compte (admins, formulaire WhatsApp)
- `transition.js` : animation de transition entre les pages (rideau coloré)
- `admin.html` : espace admin (connexion par code personnel, ajout de comptes, vidéos max 2 min)
- `style.css` : design et animations
- `app.js` : logique du site public
- `admin.js` : logique de l'espace admin
- `config.js` : **à modifier** (nom des admins, lieux, numéros WhatsApp, codes)
- `assets/logo.jpg` : logo (remplace-le par ton logo PNG/SVG si tu veux)

## Mise en ligne
1. Modifie `config.js` (admins, numéros, codes).
2. Mets tous les fichiers sur GitHub Pages (ou tout hébergeur statique).

## Limites d'un site sans backend
- Les codes admin sont visibles dans `config.js` : ne les partage qu'avec les admins.
- Les comptes et médias sont enregistrés dans le navigateur de l'admin : ils ne sont pas partagés entre appareils ni visibles des visiteurs.
- Pour une vraie gestion partagée (plusieurs admins, visiteurs qui voient les mises à jour), il faut ajouter une base de données (par ex. Supabase).

## Publication directe (token GitHub)
- `github.js` publie sur le dépôt via l'API GitHub.
- À la connexion admin, colle un **token GitHub** (fine-grained, accès « Contents: Read and write » sur ce seul dépôt).
- Le catalogue est dans `data/produits.json`, les médias dans `media/`, les admins dans `config.js`.
- Renseigne `github.owner` (ton pseudo GitHub) dans `config.js`.
- Le site doit être hébergé (GitHub Pages) : il ne fonctionne pas en ouvrant le fichier directement.
- Le token donne accès en écriture au dépôt : ne le partage jamais.
