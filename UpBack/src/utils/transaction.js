import pool from "../config/db.js";

// Runs fn(conn) inside a transaction: every write of a business operation
// (facture + portefeuille + produits + historique...) lands together or
// not at all.
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
