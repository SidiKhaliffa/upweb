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
| Toutes les autres routes (Stock, Command, Clients, Historique, Facture, Commerces, Statistique) | 🚧 stubs `501 Not Implemented` — routing + auth corrects, logique DB à écrire |

## Pourquoi des stubs plutôt que du code "au hasard"

Deviner les noms de tables/colonnes pour 13 endpoints sans voir le schéma
réel aurait créé une fausse impression d'avancement, avec un risque élevé
de tout réécrire une fois la vraie base consultée. Les stubs gardent le
bon contrat d'API (mêmes chemins, mêmes méthodes, même auth) pendant qu'on
attend l'accès au schéma ou au code .NET.

## Ce qu'il faut pour débloquer la suite

1. **Logique métier des routes restantes** — le schéma MySQL est
   maintenant connu (connexion via `.env`), mais le comportement exact
   de chaque endpoint .NET reste à reproduire.
2. **Lib PDF utilisée côté .NET** (iTextSharp, QuestPDF, Rotativa...) pour
   les 4 endpoints de génération de PDF (`Command/GenerateCommandPdf`,
   `Facture/GenerateFacturePdf`, `Commerces/GenerateRecettePdf`,
   `Commerces/GenerateRecapPdf`).

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
