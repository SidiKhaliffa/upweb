import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // Routers and NAT silently drop idle TCP connections, and the next query
  // on one fails with ECONNRESET. Close idle connections after 60s (keeping
  // 2), and send TCP keep-alives every 10s so the kept ones stay open.
  maxIdle: 2,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Amounts are decimal(65,30): read them as numbers, not strings.
  decimalNumbers: true,
  // The .NET backend stores DATETIME columns in UTC.
  timezone: "Z",
});

export default pool;
