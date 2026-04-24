import BubbleField from "./BubbleField";

export default function CategoryTab({
  category,
  shops,
  selectedShop,
  onSelectShop,
  labels,
  locale,
}) {
  const formatter = new Intl.NumberFormat(locale);
  const shopBubbles = shops.map((shop, index) => ({
    id: shop.id,
    label: shop.name,
    meta: `★ ${shop.rating} · ${formatter.format(shop.reviews)}`,
    size: Math.min(210, 108 + shop.reviews / 5 + (index % 3) * 10),
  }));

  if (!category) {
    return <section className="tabPanel emptyPanel">{labels.chooseCategory}</section>;
  }

  return (
    <section className="tabPanel">
      <div className="panelHeading">
        <div>
          <span className="panelLabel">{labels.selectedLabel}</span>
          <h2>{labels.categories[category] || category}</h2>
          <p>{labels.shopBubbleHint}</p>
        </div>
        <p className="panelCount">
          {formatter.format(shops.length)} {labels.shopsFound}
        </p>
      </div>

      <BubbleField
        items={shopBubbles}
        activeId={selectedShop?.id}
        onSelect={(shopId) => onSelectShop(shops.find((shop) => shop.id === shopId))}
        labels={labels}
        emptyLabel={labels.detailsEmpty}
        locale={locale}
        variant="shop"
      />
    </section>
  );
}
