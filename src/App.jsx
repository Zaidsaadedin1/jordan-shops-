import { useEffect, useMemo, useState } from "react";
import { fetchCities, fetchShopCategories, fetchShopsByCategory } from "./api/shops";
import { normalizeShopRecord } from "./utils/shops";
import BubbleDashboard from "./components/BubbleDashboard";
import ShopDetails from "./components/ShopDetails";
import AboutPage from "./components/AboutPage";
import { localeOrder, locales } from "./data/locales";
import logoMark from "./assets/logo-mark.svg";
import creatorPortrait from "./assets/creator-portrait.png";
import "./App.css";

const localeBadges = {
  en: "EN",
  ar: "AR",
  fr: "FR",
  es: "ES",
  tr: "TR",
};

export default function App() {
  const pageSize = 10;
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shopRows, setShopRows] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [shopsPage, setShopsPage] = useState(1);
  const [shopsTotal, setShopsTotal] = useState(0);
  const [shopsTotalPages, setShopsTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState("en");
  const [page, setPage] = useState("home");
  const t = locales[locale];

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);

      try {
        const [cityItems, categoryItems] = await Promise.all([
          fetchCities(),
          fetchShopCategories(""),
        ]);
        setCities(cityItems);
        setCategories(categoryItems);
        setSelectedCategory("");
        setSelectedShopId(null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadCategoriesForCity() {
      try {
        setCategories(await fetchShopCategories(selectedCity));
        setSelectedCategory("");
        setSelectedShopId(null);
        setShopsPage(1);
      } catch (error) {
        console.error(error);
      }
    }

    loadCategoriesForCity();
  }, [selectedCity]);

  useEffect(() => {
    async function loadCategoryShops() {
      if (!selectedCategory) {
        setShopRows([]);
        setSelectedShopId(null);
        setShopsPage(1);
        setShopsTotal(0);
        setShopsTotalPages(0);
        return;
      }

      setShopRows([]);
      setSelectedShopId(null);

      try {
        const result = await fetchShopsByCategory(selectedCategory, shopsPage, pageSize, selectedCity);
        setShopRows(result.items);
        setShopsPage(result.page);
        setShopsTotal(result.total);
        setShopsTotalPages(result.totalPages);
      } catch (error) {
        console.error(error);
      }
    }

    loadCategoryShops();
  }, [selectedCategory, shopsPage, selectedCity]);

  const shops = useMemo(
    () => shopRows.map((row) => normalizeShopRecord(row, t)).filter((shop) => shop.name !== t.unnamedShop),
    [shopRows, t],
  );

  const selectedShop = useMemo(
    () => shops.find((shop) => shop.id === selectedShopId) || null,
    [shops, selectedShopId],
  );
  const categoriesCount = categories.length;
  const totalShops = categories.reduce((sum, category) => sum + category.count, 0);
  const selectedLabel =
    (selectedCategory && t.categories[selectedCategory]) || t.allCategories;

  function handleSelectCategory(category) {
    setSelectedCategory(category);
    setSelectedShopId(null);
    setShopsPage(1);
  }

  function navigateHome(sectionId = "overview") {
    setPage("home");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  if (loading) {
    return (
      <main className="page loadingPage" dir={t.dir}>
        {t.loading}
      </main>
    );
  }

  return (
    <main className="page" dir={t.dir}>
      <nav className="topNav">
        <button
          type="button"
          className="brandMark brandButton"
          onClick={() => navigateHome("overview")}
        >
          <img className="brandLogo" src={logoMark} alt="" aria-hidden="true" />
          {t.brand}
        </button>

        <div className="navLinks">
          <button
            type="button"
            className={page === "home" ? "navLink activeNavLink" : "navLink"}
            onClick={() => navigateHome("overview")}
          >
            {t.navOverview}
          </button>
          <button type="button" className="navLink" onClick={() => navigateHome("categories")}>
            {t.navCategories}
          </button>
          <button type="button" className="navLink" onClick={() => navigateHome("details")}>
            {t.navDetails}
          </button>
          <button
            type="button"
            className={page === "about" ? "navLink activeNavLink" : "navLink"}
            onClick={() => setPage("about")}
          >
            {t.navAbout}
          </button>
        </div>

        <div className="navControls">
          <label className="localePicker">
            <span className="localePickerLabel">{t.cityMenuLabel}</span>
            <div className="localeControl" aria-hidden="true">
              <span className="localeIcon">{t.cityBadge}</span>
              <div className="localeCopy">
                <strong>{selectedCity || t.allCities}</strong>
                <small>{t.cityFilterHint}</small>
              </div>
              <div className="localeMeta">
                <span className="localeCount">{cities.length}</span>
                <span className="localeChevron">▾</span>
              </div>
            </div>
            <select
              aria-label={t.cityMenuLabel}
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
            >
              <option value="">{t.allCities}</option>
              {cities.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name} ({city.count})
                </option>
              ))}
            </select>
          </label>

          <label className="localePicker">
            <span className="localePickerLabel">{t.languageMenuLabel}</span>
            <div className="localeControl" aria-hidden="true">
              <span className="localeIcon">{localeBadges[locale]}</span>
              <div className="localeCopy">
                <strong>{locales[locale].nativeLabel}</strong>
                <small>{locales[locale].label}</small>
              </div>
              <div className="localeMeta">
                <span className="localeCount">{localeOrder.length}</span>
                <span className="localeChevron">▾</span>
              </div>
            </div>
            <select
              aria-label={t.languageMenuLabel}
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
            >
              {localeOrder.map((code) => (
                <option key={code} value={code}>
                  {locales[code].nativeLabel} - {locales[code].label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </nav>

      {page === "about" ? (
        <AboutPage labels={t} />
      ) : (
        <>
          <section className="heroShell" id="overview">
            <header className="hero">
              <span className="eyebrow">{t.heroEyebrow}</span>
              <h1>{t.heroTitle}</h1>
              <p>{t.heroDescription}</p>

              <div className="heroActions">
                <button
                  type="button"
                  className="heroButton primary"
                  onClick={() => navigateHome("categories")}
                >
                  {t.heroPrimary}
                </button>
                <button
                  type="button"
                  className="heroButton secondary"
                  onClick={() => navigateHome("details")}
                >
                  {t.heroSecondary}
                </button>
              </div>
            </header>

            <aside className="heroStats">
              <div className="statCard">
                <span>{t.statsCategories}</span>
                <strong>{categoriesCount}</strong>
              </div>
              <div className="statCard">
                <span>{t.statsShops}</span>
                <strong>{totalShops}</strong>
              </div>
              <div className="statCard accent">
                <span>{t.statsSelected}</span>
                <strong>{selectedLabel}</strong>
              </div>
              <div className="statCard">
                <span>{t.statsCity}</span>
                <strong>{selectedCity || t.allCities}</strong>
              </div>
            </aside>
          </section>

          <section className="bubbleSection panel" id="categories">
            <BubbleDashboard
              categories={categories}
              shops={shops}
              selectedCategory={selectedCategory}
              selectedShopId={selectedShopId}
              onSelectShop={setSelectedShopId}
              onSelect={handleSelectCategory}
              labels={t}
              locale={locale}
            />
            {selectedCategory ? (
              <div className="paginationBar">
                <button
                  type="button"
                  className="pageButton"
                  onClick={() => setShopsPage((current) => Math.max(1, current - 1))}
                  disabled={shopsPage <= 1}
                >
                  {t.paginationPrevious}
                </button>
                <span className="pageStatus">
                  {t.paginationStatus
                    .replace("{page}", String(shopsPage))
                    .replace("{pages}", String(Math.max(shopsTotalPages, 1)))
                    .replace("{count}", String(shopsTotal))}
                </span>
                <button
                  type="button"
                  className="pageButton"
                  onClick={() =>
                    setShopsPage((current) => Math.min(Math.max(shopsTotalPages, 1), current + 1))
                  }
                  disabled={shopsPage >= shopsTotalPages}
                >
                  {t.paginationNext}
                </button>
              </div>
            ) : null}
          </section>

          <div className="content">
            <div id="details">
              <ShopDetails shop={selectedShop} labels={t} locale={locale} />
            </div>
          </div>
        </>
      )}

      <footer className="siteFooter">
        <div className="footerBrand">
          <img className="footerPortrait" src={creatorPortrait} alt={t.aboutImageAlt} />
          <div className="footerBrandCopy">
            <strong>{t.footerCredit}</strong>
            <span>{t.brand}</span>
          </div>
        </div>
        <p>{t.footerSummary}</p>
        <div className="footerMeta">
          <button type="button" className="footerAboutLink" onClick={() => setPage("about")}>
            {t.footerAboutLink}
          </button>
        </div>
      </footer>
    </main>
  );
}
