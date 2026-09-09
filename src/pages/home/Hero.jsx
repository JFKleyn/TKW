import { Link } from "react-router";
import Hero from "../../assets/images/J & A-10.webp"
import './Hero.css'

export function HeroSection(){
  return(
    <>
    <div className="hero" style={{ backgroundImage: `url(${Hero})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat" }}>
      <div className="hero-header">
        <h1 className="hero-line">
          THE KLEYN WEDDING
        </h1>
        <div className="hero-buttons">
            <Link to="/contact">
              <button>ENGAGEMENT PARTY RSVP</button>
            </Link>
            <Link to="/machine-listing">
              <button className="product-button">GIFT THINGY</button>
            </Link>
        </div>
      </div>
    </div>
    </>
  )
}