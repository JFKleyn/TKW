import { Link } from "react-router";
import Hero from "../../assets/images/J & A-99.webp"
import './Hero.css'

export function HeroSection(){
  return(
    <>
    <div className="hero" style={{ backgroundImage: `
      linear-gradient(
        rgba(0, 0, 0, 0.3),
        rgba(0, 0, 0, 0.3)
      ),
      url(${Hero})
    `,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat" }}>
      <div className="hero-header">
        <h1 className="hero-line">
          THE KLEYN WEDDING
        </h1>
        <div className="hero-buttons">
            <Link to="/rsvp">
              <button>ENGAGEMENT PARTY RSVP</button>
            </Link>
            <Link to="/gift-registry">
              <button className="product-button">GIFT REGISTRY</button>
            </Link>
        </div>
      </div>
    </div>
    </>
  )
}