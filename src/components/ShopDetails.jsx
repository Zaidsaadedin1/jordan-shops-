export default function ShopDetails({ shop, labels, locale }) {
    const formatter = new Intl.NumberFormat(locale);

    if (!shop) {
        return (
            <aside className="details">
                <span className="panelLabel">{labels.detailsLead}</span>
                <h2>{labels.detailsTitle}</h2>
                <p>{labels.detailsEmpty}</p>
            </aside>
        );
    }

    return (
        <aside className="details">
            <span className="panelLabel">{labels.detailsLead}</span>
            <h2>{shop.name}</h2>
            <p>{shop.description}</p>

            <div className="detailActions">
                <button type="button" className="actionPill" disabled={!shop.hasPhone}>
                    {!shop.hasPhone ? labels.noPhone : labels.callAction}
                </button>
                <a
                    className={`actionPill secondaryAction ${shop.mapsUrl ? "" : "disabledAction"}`}
                    href={shop.mapsUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!shop.mapsUrl}
                    onClick={(event) => {
                        if (!shop.mapsUrl) {
                            event.preventDefault();
                        }
                    }}
                >
                    {labels.openInMaps}
                </a>
                <span className="actionMeta">{shop.category}</span>
            </div>

            <div className="infoGrid">
                <div className="infoItem">
                    <span>{labels.category}</span>
                    <strong>{shop.category}</strong>
                </div>
                <div className="infoItem">
                    <span>{labels.rating}</span>
                    <strong>★ {shop.rating}</strong>
                </div>
                <div className="infoItem">
                    <span>{labels.reviews}</span>
                    <strong>{formatter.format(shop.reviews)}</strong>
                </div>
                <div className="infoItem">
                    <span>{labels.type}</span>
                    <strong>{shop.typeLabel || shop.type}</strong>
                </div>
                <div className="infoItem">
                    <span>{labels.phone}</span>
                    <strong>{shop.phone}</strong>
                </div>
                <div className="infoItem">
                    <span>{labels.hours}</span>
                    <strong>{shop.openingHours}</strong>
                </div>
                <div className="infoItem full">
                    <span>{labels.location}</span>
                    <strong>{shop.location}</strong>
                </div>
            </div>
        </aside>
    );
}
