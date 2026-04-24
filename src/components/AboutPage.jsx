import creatorPortrait from "../assets/creator-portrait.png";

export default function AboutPage({ labels }) {
  return (
    <section className="aboutPage">
      <div className="aboutHero panel">
        <div className="aboutPortraitWrap">
          <img className="aboutPortrait" src={creatorPortrait} alt={labels.aboutImageAlt} />
        </div>
        <div className="aboutHeroCopy">
          <span className="eyebrow">{labels.aboutEyebrow}</span>
          <h1>{labels.aboutTitle}</h1>
          <p>{labels.aboutDescription}</p>
        </div>
      </div>

      <div className="aboutGrid">
        <article className="aboutCard panel">
          <span className="panelLabel">{labels.aboutProfileTitle}</span>
          <h2>{labels.aboutProfileHeading}</h2>
          <p>{labels.aboutProfileBody}</p>
        </article>

        <article className="aboutCard panel">
          <span className="panelLabel">{labels.aboutExperienceTitle}</span>
          <h2>{labels.aboutExperienceHeading}</h2>
          <p>{labels.aboutExperienceBody}</p>
        </article>

        <article className="aboutCard panel wide">
          <span className="panelLabel">{labels.aboutLeadershipTitle}</span>
          <h2>{labels.aboutLeadershipHeading}</h2>
          <p>{labels.aboutLeadershipBody}</p>
        </article>

        <article className="aboutCard panel wide">
          <span className="panelLabel">{labels.aboutFocusTitle}</span>
          <h2>{labels.aboutFocusHeading}</h2>
          <p>{labels.aboutFocusBody}</p>
        </article>
      </div>
    </section>
  );
}
