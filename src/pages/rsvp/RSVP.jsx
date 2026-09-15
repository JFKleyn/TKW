import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import "./RSVP.css";

const RSVP = () => {
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    attending: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("rsvps").insert([
      {
        first_name: formData.firstName.trim(),
        surname: formData.surname.trim(),
        attending: formData.attending === "yes",
      },
    ]);

    if (error) {
      console.error("Error submitting RSVP:", error);
      alert(
        "Something went wrong while submitting your RSVP. Please try again.",
      );
      return;
    }

    setSubmitted(true);
  };

  return (
    <main className="rsvp-page">
      <Link to="/" className="rsvp-back">
        ← BACK
      </Link>

      <section className="rsvp-container">
        {!submitted ? (
          <>
            <header className="rsvp-header">
              <p className="rsvp-eyebrow">AMBER & JOHAN</p>

              <h1>Engagement Party</h1>

              <div className="rsvp-divider"></div>

              <p className="rsvp-date">10 OCTOBER 2026</p>

              <p className="rsvp-intro">
                We would love to celebrate this special occasion with you.
                Please let us know if you'll be joining us.
              </p>
            </header>

            <form className="rsvp-form" onSubmit={handleSubmit}>
              <div className="rsvp-field">
                <label htmlFor="firstName">FIRST NAME</label>

                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="rsvp-field">
                <label htmlFor="surname">SURNAME</label>

                <input
                  type="text"
                  id="surname"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                />
              </div>

              <fieldset className="rsvp-attendance">
                <legend>WILL YOU BE ATTENDING?</legend>

                <label className="rsvp-option">
                  <input
                    type="radio"
                    name="attending"
                    value="yes"
                    checked={formData.attending === "yes"}
                    onChange={handleChange}
                    required
                  />
                  <span>Joyfully accepts</span>
                </label>

                <label className="rsvp-option">
                  <input
                    type="radio"
                    name="attending"
                    value="no"
                    checked={formData.attending === "no"}
                    onChange={handleChange}
                  />
                  <span>Regretfully declines</span>
                </label>
              </fieldset>

              <button type="submit" className="rsvp-submit">
                SUBMIT RSVP
              </button>
            </form>
          </>
        ) : (
          <div className="rsvp-success">
            <p className="rsvp-eyebrow">THE KLEYN WEDDING</p>

            <h1>RSVP Received</h1>

            <div className="rsvp-divider"></div>

            <p>
              Thank you, {formData.firstName}. Your response has been received.
              We appreciate you letting us know.
            </p>

            <Link to="/gift-registry" className="registry-button">
              GIFT REGISTRY
            </Link>

            <Link to="/" className="success-home">
              RETURN HOME
            </Link>
          </div>
        )}
      </section>
    </main>
  );
};

export default RSVP;
