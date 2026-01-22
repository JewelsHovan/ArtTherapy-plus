/**
 * Database client for Azure SQL using tedious driver
 *
 * Provides a connection pool wrapper and query helper function.
 * Uses raw SQL queries for compatibility with the ported Cloudflare Worker code.
 * The schema.ts file provides TypeScript types for type safety.
 */

import { Connection, Request as TediousRequest, TYPES } from 'tedious';
import * as schema from './schema.js';
import { config } from '../config/index.js';

/**
 * Parse Azure SQL connection string into tedious config
 */
function parseConnectionString(connectionString: string) {
  // Format: mssql://user:password@server:port/database?options
  const url = new URL(connectionString);

  return {
    server: url.hostname,
    port: parseInt(url.port || '1433'),
    database: url.pathname.slice(1), // Remove leading /
    user: url.username,
    password: decodeURIComponent(url.password),
    options: {
      encrypt: url.searchParams.get('encrypt') !== 'false', // Default to true for Azure
      trustServerCertificate: url.searchParams.get('trustServerCertificate') === 'true',
    },
  };
}

/**
 * Connection pool wrapper for tedious
 *
 * Manages a single connection with automatic reconnection.
 * Provides a simple query interface for parameterized SQL.
 */
class TediousPool {
  private connectionConfig: ReturnType<typeof parseConnectionString>;
  private connection: Connection | null = null;
  private connecting = false;
  private queue: Array<{
    resolve: (conn: Connection) => void;
    reject: (err: Error) => void;
  }> = [];

  constructor(connectionString: string) {
    this.connectionConfig = parseConnectionString(connectionString);
  }

  /**
   * Get or create a database connection
   */
  async getConnection(): Promise<Connection> {
    if (this.connection) {
      return this.connection;
    }

    if (this.connecting) {
      return new Promise((resolve, reject) => {
        this.queue.push({ resolve, reject });
      });
    }

    this.connecting = true;

    return new Promise((resolve, reject) => {
      const connection = new Connection({
        server: this.connectionConfig.server,
        authentication: {
          type: 'default',
          options: {
            userName: this.connectionConfig.user,
            password: this.connectionConfig.password,
          },
        },
        options: {
          port: this.connectionConfig.port,
          database: this.connectionConfig.database,
          encrypt: this.connectionConfig.options.encrypt,
          trustServerCertificate: this.connectionConfig.options.trustServerCertificate,
        },
      });

      connection.on('connect', (err) => {
        this.connecting = false;
        if (err) {
          reject(err);
          this.queue.forEach((q) => q.reject(err));
          this.queue = [];
        } else {
          this.connection = connection;
          resolve(connection);
          this.queue.forEach((q) => q.resolve(connection));
          this.queue = [];
        }
      });

      connection.on('error', (err) => {
        console.error('Database connection error:', err);
        this.connection = null;
      });

      connection.on('end', () => {
        this.connection = null;
      });

      connection.connect();
    });
  }

  /**
   * Execute a parameterized SQL query
   *
   * Parameters are referenced as @p0, @p1, etc. in the SQL string.
   *
   * @param sql - SQL query with @p0, @p1, etc. parameter placeholders
   * @param params - Array of parameter values
   * @returns Array of result rows
   *
   * @example
   * ```typescript
   * const users = await pool.query<User>(
   *   'SELECT * FROM users WHERE email = @p0',
   *   ['user@example.com']
   * );
   * ```
   */
  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const connection = await this.getConnection();

    return new Promise((resolve, reject) => {
      const results: T[] = [];

      const request = new TediousRequest(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });

      // Add parameters with appropriate types
      params.forEach((param, index) => {
        if (typeof param === 'string') {
          request.addParameter(`p${index}`, TYPES.NVarChar, param);
        } else if (typeof param === 'number') {
          if (Number.isInteger(param)) {
            request.addParameter(`p${index}`, TYPES.Int, param);
          } else {
            request.addParameter(`p${index}`, TYPES.Float, param);
          }
        } else if (param instanceof Date) {
          request.addParameter(`p${index}`, TYPES.DateTime, param);
        } else if (param === null || param === undefined) {
          request.addParameter(`p${index}`, TYPES.NVarChar, null);
        } else {
          // For objects/arrays, stringify as JSON
          request.addParameter(`p${index}`, TYPES.NVarChar, JSON.stringify(param));
        }
      });

      request.on('row', (columns: Array<{ metadata: { colName: string }; value: unknown }>) => {
        const row: Record<string, unknown> = {};
        columns.forEach((column: { metadata: { colName: string }; value: unknown }) => {
          row[column.metadata.colName] = column.value;
        });
        results.push(row as T);
      });

      connection.execSql(request);
    });
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }
}

// Singleton database pool instance
let pool: TediousPool | null = null;

/**
 * Get the database pool instance
 * Lazily initializes the pool on first call
 */
export function getPool(): TediousPool {
  if (!pool) {
    pool = new TediousPool(config.database.url);
  }
  return pool;
}

/**
 * Execute a raw SQL query
 *
 * Convenience function that uses the singleton pool.
 *
 * @param sql - SQL query with @p0, @p1, etc. parameter placeholders
 * @param params - Array of parameter values
 * @returns Array of result rows
 */
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return getPool().query<T>(sql, params);
}

/**
 * Close the database connection
 *
 * Should be called during graceful shutdown.
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

// Export schema for type inference and potential Drizzle usage
export { schema };
export * from './schema.js';
