import { httpError } from "./httpError.js";

// Same rule as .NET (User.Identity.Name): the logged-in user's commercial
// is the Commerces row whose Nom equals the token's unique_name.
export async function getCurrentCommercial(conn, user) {
  const [rows] = await conn.query(
    "SELECT Id, Nom FROM Commerces WHERE Nom = ? LIMIT 1",
    [user?.unique_name ?? ""]
  );
  if (!rows.length) {
    throw httpError(403, "Aucun commercial n'est associé à ce compte.");
  }
  return rows[0];
}

// Locks the rows it returns: concurrent requests on the same client wait
// instead of overwriting each other's balance.
export async function getClientByCode(conn, code) {
  const [rows] = await conn.query(
    "SELECT * FROM Clients WHERE Code = ? FOR UPDATE",
    [code]
  );
  if (!rows.length) throw httpError(404, "Client introuvable.");
  return rows[0];
}

export async function getPortefeuilleByCode(conn, code, { required = true } = {}) {
  const [rows] = await conn.query(
    "SELECT * FROM portFeuilleClients WHERE Code = ? FOR UPDATE",
    [code]
  );
  if (!rows.length && required) {
    throw httpError(404, "Portefeuille client introuvable.");
  }
  return rows[0] ?? null;
}

export async function getProduitsByName(conn, names) {
  if (!names.length) return new Map();
  const [rows] = await conn.query(
    "SELECT * FROM Produits WHERE Name IN (?) FOR UPDATE",
    [names]
  );
  // Keyed in lower case: MySQL matched the names case-insensitively.
  return new Map(rows.map((p) => [p.Name.toLowerCase(), p]));
}

export function requireText(value, message) {
  const text = String(value ?? "").trim();
  if (!text) throw httpError(400, message);
  return text;
}

export function requireAmount(value, message) {
  const amount = Number(value);
  if (value === "" || value === null || !Number.isFinite(amount)) {
    throw httpError(400, message);
  }
  return amount;
}

// [{ NameProduit, Quantite }] -> validated list. Quantities must be whole
// numbers >= 0; the .NET API accepted anything and could save negatives.
export function parseProductLines(lines, field = "StockProduitdto") {
  if (!Array.isArray(lines)) {
    throw httpError(400, `Liste de produits manquante (${field}).`);
  }
  return lines.map((line) => {
    const name = requireText(line?.NameProduit, "Nom de produit manquant.");
    const quantity = Number(line?.Quantite);
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw httpError(400, `Quantité invalide pour ${name}.`);
    }
    return { name, quantity };
  });
}

// Recomputes the stored percentages of every product from its current
// stock. .NET only refreshed them on factures, so stock updates left them
// stale; Statistique computes them live anyway.
// Stock actuel = what is left on the clients' shelves, as counted at the
// last visit of each client. It is recomputed from StockProduits instead
// of being moved by +/- on each operation: that counter drifted and ended
// up above the stock fabriqué for some products.
export const STOCK_ACTUEL_SQL =
  "COALESCE((SELECT SUM(sp.Quantite) FROM StockProduits sp WHERE sp.ProduitId = p.Id), 0)";

export async function refreshProduitPercentages(conn) {
  await conn.query(`UPDATE Produits p SET p.StockActuel = ${STOCK_ACTUEL_SQL}`);
  await conn.query(
    `UPDATE Produits p
     CROSS JOIN (SELECT SUM(stock) AS total FROM Produits) t
     SET p.PourcentageProduit =
           IF(p.stock > 0, ROUND((p.stock - p.StockActuel) / p.stock * 100, 2), 0),
         p.PourcentageVente =
           IF(t.total > 0, ROUND((p.stock - p.StockActuel) / t.total * 100, 2), 0)`
  );
}

// Unknown product names are rejected: .NET skipped them silently, so the
// user was told "succès" while part of their entry was dropped.
export function findProduit(produits, name) {
  const produit = produits.get(name.toLowerCase());
  if (!produit) throw httpError(400, `Produit inconnu : ${name}.`);
  return produit;
}
