export async function fetchCities() {
  const response = await fetch("/api/shops/cities", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load cities: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data?.cities) ? data.cities : [];
}

export async function fetchShopCategories(city = "") {
  const url = new URL("/api/shops/categories", window.location.origin);

  if (city) {
    url.searchParams.set("city", city);
  }

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load shop categories: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data?.categories) ? data.categories : [];
}

export async function fetchShopsByCategory(category, page = 1, limit = 10, city = "") {
  const url = new URL("/api/shops/by-category", window.location.origin);
  url.searchParams.set("category", category);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (city) {
    url.searchParams.set("city", city);
  }

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load shops for ${category}: ${response.status}`);
  }

  const data = await response.json();
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: Number.isFinite(data?.page) ? data.page : page,
    limit: Number.isFinite(data?.limit) ? data.limit : limit,
    total: Number.isFinite(data?.total) ? data.total : 0,
    totalPages: Number.isFinite(data?.totalPages) ? data.totalPages : 0,
  };
}
