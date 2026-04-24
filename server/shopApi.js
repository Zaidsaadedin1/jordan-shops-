import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { categoryMap } from "../src/data/categoryMap.js";

const dbPath = fileURLToPath(new URL("../data/shops.sqlite", import.meta.url));
const db = new DatabaseSync(dbPath, { readonly: true });

const categoryToTypes = Object.entries(categoryMap).reduce((acc, [type, categoryKey]) => {
  if (!acc[categoryKey]) acc[categoryKey] = [];
  acc[categoryKey].push(type);
  return acc;
}, {});

categoryToTypes.other_shops ||= ["other"];

const shopByIdStatement = db.prepare(`
  SELECT id, title, type, phone, opening_hours, city, street, lat, lon
  FROM shops
  WHERE id = ?
`);

export function shopApiPlugin() {
  return {
    name: "shop-api",
    configureServer(server) {
      server.middlewares.use(handleShopApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleShopApi);
    },
  };
}

function handleShopApi(req, res, next) {
  const url = new URL(req.url, "http://localhost");

  if (!url.pathname.startsWith("/api/shops")) {
    next();
    return;
  }

  try {
    if (url.pathname === "/api/shops/categories") {
      const city = normalizeFilterValue(url.searchParams.get("city"));
      writeJson(res, {
        categories: getCategories(city),
      });
      return;
    }

    if (url.pathname === "/api/shops/cities") {
      writeJson(res, {
        cities: getCities(),
      });
      return;
    }

    if (url.pathname === "/api/shops/by-category") {
      const category = url.searchParams.get("category");
      const city = normalizeFilterValue(url.searchParams.get("city"));
      const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
      const limit = Math.max(1, Number.parseInt(url.searchParams.get("limit") || "10", 10) || 10);

      if (!category) {
        writeJson(res, { error: "Missing category parameter" }, 400);
        return;
      }

      writeJson(res, getShopsByCategory(category, page, limit, city));
      return;
    }

    if (url.pathname === "/api/shops/detail") {
      const id = url.searchParams.get("id");

      if (!id) {
        writeJson(res, { error: "Missing id parameter" }, 400);
        return;
      }

      const item = shopByIdStatement.get(id);

      if (!item) {
        writeJson(res, { error: "Shop not found" }, 404);
        return;
      }

      writeJson(res, { item });
      return;
    }

    writeJson(res, { error: "Not found" }, 404);
  } catch (error) {
    writeJson(
      res,
      { error: error instanceof Error ? error.message : "Unknown server error" },
      500,
    );
  }
}

function getCities() {
  const statement = db.prepare(`
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

function getCategories(city) {
  const statement = city
    ? db.prepare(`
        SELECT type, COUNT(*) AS count
        FROM shops
        WHERE city = ?
        GROUP BY type
      `)
    : db.prepare(`
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

function getShopsByCategory(categoryKey, page, limit, city) {
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
  const countStatement = db.prepare(`
    SELECT COUNT(*) AS total
    FROM shops
    WHERE type IN (${placeholders})${cityClause}
  `);
  const statement = db.prepare(`
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

function normalizeFilterValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed;
}

function writeJson(res, payload, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}
