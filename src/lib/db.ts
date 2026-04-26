import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      pool = mysql.createPool({
        uri: databaseUrl,
        waitForConnections: true,
        connectionLimit: 5,
        maxIdle: 5,
        idleTimeout: 60000,
        enableKeepAlive: true,
        ssl: {
          minVersion: "TLSv1.2",
          rejectUnauthorized: false,
        },
      });
    } else {
      const useSsl = process.env.DB_SSL === "true";
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 5,
        maxIdle: 5,
        idleTimeout: 60000,
        enableKeepAlive: true,
        ...(useSsl && {
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: false,
          },
        }),
      });
    }
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
  connection?: mysql.Connection | mysql.Pool
): Promise<T[]> {
  const conn = connection || getPool();
  const [rows] = await conn.query(sql, params);
  return rows as T[];
}

export async function execute(
  sql: string,
  params: unknown[] = [],
  connection?: mysql.Connection | mysql.Pool
) {
  const conn = connection || getPool();
  const [result] = await conn.execute(sql, params as mysql.ExecuteValues[]);
  return result as mysql.ResultSetHeader;
}

export async function getConnection() {
  return getPool().getConnection();
}

export function getPagination(page?: string | number, limit?: string | number) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
}

export default getPool;
