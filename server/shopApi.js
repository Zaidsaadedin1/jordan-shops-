import {
  getCategories,
  getCities,
  getShopById,
  getShopsByCategory,
  normalizeFilterValue,
} from "./shopStore.js";

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

      const item = getShopById(id);

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

function writeJson(res, payload, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}
