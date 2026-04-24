import { DatabaseSync } from "node:sqlite";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { categoryMap } from "../src/data/categoryMap.js";

const runtimeDbPath = resolve("/tmp", "shops.sqlite");
const sourceDbCandidates = [
  fileURLToPath(new URL("../data/shops.sqlite", import.meta.url)),
  resolve(globalThis.process?.cwd?.() || ".", "data", "shops.sqlite"),
  resolve(globalThis.process?.env?.LAMBDA_TASK_ROOT || "/var/task", "data", "shops.sqlite"),
  resolve("/var/task", "data", "shops.sqlite"),
];

let db;

const categoryToTypes = Object.entries(categoryMap).reduce((acc, [type, categoryKey]) => {
  if (!acc[categoryKey]) acc[categoryKey] = [];
  acc[categoryKey].push(type);
  return acc;
}, {});

categoryToTypes.other_shops ||= ["other"];

export function getCities() {
  const statement = getDb().prepare(`
    SELECT city, COUNT(*) AS count
    FROM shops
    WHERE city IS NOT NULL AND TRIM(city) != ''
    GROUP BY city
    ORDER BY city COLLATE NOCASE
  `);

  return statement.all().map((row) => ({
    name: row.city,
    count: row.count,
  }));
}

export function getCategories(city) {
  const statement = city
    ? getDb().prepare(`
        SELECT type, COUNT(*) AS count
        FROM shops
        WHERE city = ?
        GROUP BY type
      `)
    : getDb().prepare(`
        SELECT type, COUNT(*) AS count
        FROM shops
        GROUP BY type
      `);
  const grouped = new Map();

  for (const row of statement.all(...(city ? [city] : []))) {
    const categoryKey = categoryMap[row.type] || "other_shops";
    grouped.set(categoryKey, (grouped.get(categoryKey) || 0) + row.count);
  }

  return [...grouped.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function getShopsByCategory(categoryKey, page, limit, city) {
  const types = categoryToTypes[categoryKey];

  if (!types?.length) {
    return {
      items: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
    };
  }

  const placeholders = types.map(() => "?").join(", ");
  const cityClause = city ? " AND city = ?" : "";
  const countStatement = getDb().prepare(`
    SELECT COUNT(*) AS total
    FROM shops
    WHERE type IN (${placeholders})${cityClause}
  `);
  const statement = getDb().prepare(`
    SELECT id, title, type, phone, opening_hours, city, street, lat, lon
    FROM shops
    WHERE type IN (${placeholders})${cityClause}
    ORDER BY LOWER(title), id
    LIMIT ? OFFSET ?
  `);
  const params = city ? [...types, city] : [...types];
  const total = countStatement.get(...params).total;
  const totalPages = Math.ceil(total / limit);
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const offset = (safePage - 1) * limit;

  return {
    items: statement.all(...params, limit, offset),
    page: safePage,
    limit,
    total,
    totalPages,
  };
}

export function getShopById(id) {
  const statement = getDb().prepare(`
    SELECT id, title, type, phone, opening_hours, city, street, lat, lon
    FROM shops
    WHERE id = ?
  `);

  return statement.get(id) || null;
}

export function normalizeFilterValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function getDbDebugInfo() {
  return {
    cwd: globalThis.process?.cwd?.() || null,
    lambdaTaskRoot: globalThis.process?.env?.LAMBDA_TASK_ROOT || null,
    runtimeDbPath,
    runtimeDbExists: existsSync(runtimeDbPath),
    sourceDbCandidates: sourceDbCandidates.map((path) => ({
      path,
      exists: existsSync(path),
    })),
  };
}

function getDb() {
  if (!db) {
    const sourceDbPath = sourceDbCandidates.find((candidate) => existsSync(candidate));

    if (!sourceDbPath) {
      const checked = sourceDbCandidates.join(", ");
      throw new Error(`SQLite database file not found. Checked: ${checked}`);
    }

    if (!existsSync(runtimeDbPath)) {
      copyFileSync(sourceDbPath, runtimeDbPath);
    }

    db = new DatabaseSync(runtimeDbPath, { readonly: true });
  }

  return db;
}
