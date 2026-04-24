import { getCategories, normalizeFilterValue } from "../../server/shopStore.js";

export default function handler(req, res) {
  const city = normalizeFilterValue(readQuery(req, "city"));

  res.status(200).json({
    categories: getCategories(city),
  });
}

function readQuery(req, key) {
  if (req.query && typeof req.query[key] !== "undefined") {
    return req.query[key];
  }

  const url = new URL(req.url, "http://localhost");
  return url.searchParams.get(key);
}
