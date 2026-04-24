import { categoryMap } from "../data/categoryMap";

export function normalizeShopRecord(row, labels) {
  const type = row.type || "other";
  const categoryKey = categoryMap[type] || "other_shops";
  const category = labels.categories[categoryKey] || labels.categories.other_shops;
  const name = row.title || labels.unnamedShop;
  const area = row.city || row.street || labels.countryName;
  const latitude = row.lat ?? null;
  const longitude = row.lon ?? null;

  return {
    id: row.id,
    name,
    type,
    typeLabel: category,
    categoryKey,
    category,
    phone: row.phone || labels.noPhone,
    hasPhone: Boolean(row.phone),
    openingHours: row.opening_hours || labels.notAvailable,
    location: area,
    rating: createFakeRating(name),
    reviews: createFakeReviews(name),
    description: createDescription(name, category, area, labels),
    mapsUrl: createMapsUrl(latitude, longitude),
  };
}

function createDescription(name, category, area, labels) {
  return labels.descriptionTemplate
    .replace("{name}", name)
    .replace("{category}", category)
    .replace("{area}", area);
}

function createFakeRating(seed) {
  const value = seed.length % 20;
  return Number((3.2 + value / 10).toFixed(1));
}

function createFakeReviews(seed) {
  return 20 + seed.length * 7;
}

function createMapsUrl(latitude, longitude) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return "";
  }

  const destination = `${latitude},${longitude}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
