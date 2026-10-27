# UpBack

Backend Express/Node.js destiné à remplacer le backend .NET existant
(`api.universellepeinture.com`), **sans changer la base MySQL**.

## État actuel

| Pièce | État |
|---|---|
| Serveur Express, routing, CORS, JSON body parsing | ✅ fonctionnel |
| Pool MySQL (`mysql2`) | ✅ fonctionnel (branché sur `.env`) |
| JWT d'accès, claim de rôle identique au frontend | ✅ fonctionnel |
| Vérification des mots de passe ASP.NET Identity (format V3, PBKDF2) | ✅ implémenté — tous les hash de `AspNetUsers` sont en V3 (SHA256/SHA512) |
| `POST /api/User/login`, `POST /api/User/refresh` | ✅ branchés sur `AspNetUsers` / `AspNetUserRoles` / `RefreshTokens` — à tester avec un vrai compte |
| `GET/POST /api/Peintres` (nouvelle table `Peintres`, voir `sql/001_create_peintres.sql`) | ✅ fonctionnel — n'existe que sur UpBack |
| `POST /api/Stock/update` garde l'historique de chaque comptage (nouvelle table `StockVisites`, voir `sql/003_create_stock_visites.sql`) ; `GET /api/Accueil` s'en sert pour la liste « Ventes lentes » | ✅ fonctionnel — sans la table, la visite est enregistrée sans historique |
| Stock, Clients, Historique, Facture, Command, Commerces, Statistique | ✅ toutes les routes utilisées par UpFront, logique reprise du backend .NET |
| PDF (commandes, factures, recette, récap) | ✅ générés avec `pdfmake`, même mise en page que les PDF QuestPDF du .NET |

## Différences volontaires avec le backend .NET

Le comportement métier du .NET est conservé, sauf ses failles et bugs :

- **Toutes les routes exigent un token.** Les routes .NET sans protection
  ne sont pas reprises : `DELETE` qui vidaient des tables entières
  (stocks, factures, historiques, recettes, portefeuilles, produits),
  `ChangePasswordWithoutCurrent`, `Register`, `GetAllUsers`,
  `DeleteCommercial`, `UpdatePhoneNumber`, `deleteClient`.
- **Erreurs** : les messages techniques (SQL, exceptions) ne sont plus
  renvoyés au client, seulement journalisés.
- **Transactions** : chaque opération (facture, stock, recette...)
  s'enregistre entièrement ou pas du tout, avec verrouillage des lignes
  du client pour éviter les écrasements simultanés.
- **Produit inconnu** : refusé (400) au lieu d'être ignoré en silence.
- **Recette en double** le même jour : refusée (409) au lieu de répondre
  « succès » sans rien enregistrer.
- **Modifier stock** : le montant à payer est recalculé
  (`balance − valeur du stock`) au lieu de s'additionner à chaque visite.
- **Facture** : les lignes d'historique sont datées de la facture (le .NET
  les datait du 01/01/0001) et le montant à payer suit la balance.
- **Commande** : le poids total utilise le poids du produit (le .NET
  multipliait par un poids jamais envoyé, donc toujours 0).
- **Inscription client** : la société et les coordonnées GPS envoyées par
  UpFront (`nomSociete`, `coordonneesGPS`) sont enregistrées.
- **PDF recette et récap** : limités aux clients du commercial demandé
  (le .NET mélangeait ceux de tous les commerciaux).
- **Statistiques** : pourcentages calculés à partir du stock réel ;
  couverture « Mauritanie » = zones / 30, plafonnée à 100 % (le .NET
  utilisait une valeur interne sans rapport).
- **Token d'accès** : 30 minutes, comme le .NET.

## Démarrer en local

```bash
npm install
cp .env.example .env   # puis renseigner DB_* et JWT_ACCESS_SECRET
npm run dev
```

`GET /health` répond `{"status":"ok"}` une fois le serveur lancé.

## Compatibilité frontend

Les routes sont montées sous `/api/<Resource>` avec la même casse que
l'API .NET (`/api/User/login`, `/api/Stock/Produits`, ...) — `UpFront`
n'a besoin d'aucune modification pour pointer vers ce backend, à
condition de garder le même claim de rôle JWT (voir
`src/utils/jwt.js` → `ROLE_CLAIM`).

**Bascule sans coupure** : UpBack utilise la même clé, le même Issuer et
la même Audience JWT que le backend .NET (section `"JWT"` de son
`appsettings.json`, recopiée dans `.env`). Les tokens émis par l'un sont
donc acceptés par l'autre, et les refresh tokens sont partagés via la
table `RefreshTokens` — les utilisateurs n'ont pas à se reconnecter.
