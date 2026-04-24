import BubbleField from "./BubbleField";

export default function BubbleDashboard({
  categories,
  shops,
  selectedCategory,
  selectedShopId,
  onSelectShop,
  onSelect,
  labels,
  locale,
}) {
  const categoryCounts = categories.map((category) => category.count);
  const maxCategoryCount = Math.max(...categoryCounts, 1);
  const minCategoryCount = Math.min(...categoryCounts, maxCategoryCount);

  const categoryBubbles = categories.map((category) => ({
    id: category.key,
    label: category.key,
    count: category.count,
    size: scaleBubbleSize(category.count, minCategoryCount, maxCategoryCount, 132, 292),
  }));
  const reviewCounts = shops.map((shop) => shop.reviews);
  const maxReviewCount = Math.max(...reviewCounts, 1);
  const minReviewCount = Math.min(...reviewCounts, maxReviewCount);

  const shopBubbles = selectedCategory
    ? shops.map((shop) => ({
        id: shop.id,
        label: shop.name,
        meta:
          `${labels.locationPrefix} ${shop.location} · ` +
          `${new Intl.NumberFormat(locale).format(shop.reviews)} ${labels.reviewsSuffix}`,
        size: scaleBubbleSize(shop.reviews, minReviewCount, maxReviewCount, 112, 244),
      }))
    : [];

  return (
    <>
      <div className="sectionHeading bubbleModeHeader">
        <div>
          <h2>{selectedCategory ? labels.shopBubbleTitle : labels.bubbleTitle}</h2>
          <p>{selectedCategory ? labels.shopBubbleHint : labels.bubbleDescription}</p>
        </div>
        {selectedCategory ? (
          <button type="button" className="backButton" onClick={() => onSelect("")}>
            {labels.allCategories}
          </button>
        ) : (
          <span className="sectionHint">{labels.bubbleHint}</span>
        )}
      </div>

      <BubbleField
        items={selectedCategory ? shopBubbles : categoryBubbles}
        activeId={selectedCategory ? selectedShopId : selectedCategory}
        onSelect={selectedCategory ? onSelectShop : onSelect}
        labels={labels}
        emptyLabel={selectedCategory ? labels.detailsEmpty : labels.chooseCategory}
        locale={locale}
        variant={selectedCategory ? "shop" : "category"}
      />
    </>
  );
}

function scaleBubbleSize(value, minValue, maxValue, minSize, maxSize) {
  if (maxValue === minValue) {
    return (minSize + maxSize) / 2;
  }

  const normalized = (value - minValue) / (maxValue - minValue);
  const eased = Math.pow(normalized, 0.72);

  return Math.round(minSize + eased * (maxSize - minSize));
}
