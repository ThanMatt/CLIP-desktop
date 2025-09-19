import sqlite3 from "sqlite3";
import { app } from "electron";
import path from "node:path";

export interface ContentLog {
  id: number;
  timestamp: string;
  type: "sent" | "received" | "declined";
  deviceName: string;
  content: string;
  contentType: "text" | "file";
  status: "success" | "failed" | "declined";
  fileSize?: number;
  fileName?: string;
}

export interface LogsFilter {
  type?: "sent" | "received" | "declined";
  deviceName?: string;
  contentType?: "text" | "file";
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export class LogsService {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(app.getPath("userData"), "logs.db");
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Error opening database:", err);
          reject(err);
          return;
        }

        // Create logs table if it doesn't exist
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS content_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          type TEXT NOT NULL CHECK (type IN ('sent', 'received', 'declined')),
          deviceName TEXT NOT NULL,
          content TEXT NOT NULL,
          contentType TEXT NOT NULL CHECK (contentType IN ('text', 'file')),
          status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'declined')),
          fileSize INTEGER,
          fileName TEXT
        )
      `;

      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error("Error creating table:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async logContent(
    type: "sent" | "received" | "declined",
    deviceName: string,
    content: string,
    contentType: "text" | "file",
    status: "success" | "failed" | "declined",
    fileSize?: number,
    fileName?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const insertSQL = `
        INSERT INTO content_logs (type, deviceName, content, contentType, status, fileSize, fileName)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        insertSQL,
        [type, deviceName, content, contentType, status, fileSize, fileName],
        function (err) {
          if (err) {
            console.error("Error inserting log:", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getLogs(filter: LogsFilter = {}): Promise<ContentLog[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      let sql = "SELECT * FROM content_logs WHERE 1=1";
      const params: any[] = [];

      // Apply filters
      if (filter.type) {
        sql += " AND type = ?";
        params.push(filter.type);
      }

      if (filter.deviceName) {
        sql += " AND deviceName LIKE ?";
        params.push(`%${filter.deviceName}%`);
      }

      if (filter.contentType) {
        sql += " AND contentType = ?";
        params.push(filter.contentType);
      }

      if (filter.dateFrom) {
        sql += " AND timestamp >= ?";
        params.push(filter.dateFrom);
      }

      if (filter.dateTo) {
        sql += " AND timestamp <= ?";
        params.push(filter.dateTo);
      }

      // Order by most recent first
      sql += " ORDER BY timestamp DESC";

      // Apply pagination
      if (filter.limit) {
        sql += " LIMIT ?";
        params.push(filter.limit);

        if (filter.offset) {
          sql += " OFFSET ?";
          params.push(filter.offset);
        }
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error("Error fetching logs:", err);
          reject(err);
        } else {
          resolve(rows as ContentLog[]);
        }
      });
    });
  }

  async getLogsCount(filter: LogsFilter = {}): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      let sql = "SELECT COUNT(*) as count FROM content_logs WHERE 1=1";
      const params: any[] = [];

      // Apply same filters as getLogs
      if (filter.type) {
        sql += " AND type = ?";
        params.push(filter.type);
      }

      if (filter.deviceName) {
        sql += " AND deviceName LIKE ?";
        params.push(`%${filter.deviceName}%`);
      }

      if (filter.contentType) {
        sql += " AND contentType = ?";
        params.push(filter.contentType);
      }

      if (filter.dateFrom) {
        sql += " AND timestamp >= ?";
        params.push(filter.dateFrom);
      }

      if (filter.dateTo) {
        sql += " AND timestamp <= ?";
        params.push(filter.dateTo);
      }

      this.db.get(sql, params, (err, row: any) => {
        if (err) {
          console.error("Error counting logs:", err);
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  async clearLogs(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.run("DELETE FROM content_logs", (err) => {
        if (err) {
          console.error("Error clearing logs:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error("Error closing database:", err);
          }
          this.db = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}