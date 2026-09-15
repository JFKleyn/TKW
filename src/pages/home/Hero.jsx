import { Link } from "react-router-dom";
import Hero from "../../assets/images/J & A-99.webp";
import "./Hero.css";

export function HeroSection() {
  return (
    <section
      className="hero"
      style={{
        backgroundImage: `
          linear-gradient(
            rgba(20, 16, 12, 0.32),
            rgba(20, 16, 12, 0.32)
          ),
          url(${Hero})
        `,
      }}
    >
      <div className="hero-content">

        <p className="hero-eyebrow">
          AMBER & JOHAN
        </p>

        <h1 className="hero-title">
          The Kleyn Wedding
        </h1>

        <div className="hero-divider"></div>

        <p className="hero-date">
          ENGAGEMENT PARTY <span>·</span> 10 OCTOBER 2026
        </p>

        <div className="hero-buttons">

          <Link
            to="/rsvp"
            className="hero-primary"
          >
            ENGAGEMENT PARTY RSVP
          </Link>

          <Link
            to="/gift-registry"
            className="hero-secondary"
          >
            GIFT REGISTRY
          </Link>

        </div>

      </div>
    </section>
  );
}