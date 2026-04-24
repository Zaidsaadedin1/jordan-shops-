export default function ShopCard({ shop, active, onClick, labels, locale }) {
    const formatter = new Intl.NumberFormat(locale);

    return (
        <button className={`shopCard ${active ? "activeCard" : ""}`} onClick={onClick}>
            <span className="shopCardType">{shop.category}</span>
            <h3>{shop.name}</h3>
            <p>{labels.locationPrefix} {shop.location}</p>
            <div className="rating">
                <span>★ {shop.rating}</span>
                <span>{formatter.format(shop.reviews)} {labels.reviewsSuffix}</span>
            </div>
        </button>
    );
}
