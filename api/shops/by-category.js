import { getShopsByCategory, normalizeFilterValue } from "../../server/shopStore.js";

export default function handler(req, res) {
  const category = readQuery(req, "category");
  const city = normalizeFilterValue(readQuery(req, "city"));
  const page = Math.max(1, Number.parseInt(readQuery(req, "page") || "1", 10) || 1);
  const limit = Math.max(1, Number.parseInt(readQuery(req, "limit") || "10", 10) || 10);

  if (!category) {
    res.status(400).json({ error: "Missing category parameter" });
    return;
  }

  res.status(200).json(getShopsByCategory(category, page, limit, city));
}

function readQuery(req, key) {
  if (req.query && typeof req.query[key] !== "undefined") {
    return req.query[key];
  }

  const url = new URL(req.url, "http://localhost");
  return url.searchParams.get(key);
}
