import { getShopById } from "../../server/shopStore.js";

export default function handler(req, res) {
  const id = readQuery(req, "id");

  if (!id) {
    res.status(400).json({ error: "Missing id parameter" });
    return;
  }

  const item = getShopById(id);

  if (!item) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  res.status(200).json({ item });
}

function readQuery(req, key) {
  if (req.query && typeof req.query[key] !== "undefined") {
    return req.query[key];
  }

  const url = new URL(req.url, "http://localhost");
  return url.searchParams.get(key);
}
