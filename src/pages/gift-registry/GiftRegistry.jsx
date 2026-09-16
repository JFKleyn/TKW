import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import "./GiftRegistry.css";

const GiftRegistry = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedGift, setSelectedGift] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");

  useEffect(() => {
    const loadGifts = async () => {
      const { data, error } = await supabase
        .from("registry_items")
        .select("*")
        .order("purchased", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading registry:", error);
        setErrorMessage("We couldn't load the gift registry.");
        setLoading(false);
        return;
      }

      setGifts(data || []);
      setLoading(false);
    };

    loadGifts();
  }, []);

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return null;
    }

    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(price);
  };

  const openPurchaseModal = (gift) => {
    setSelectedGift(gift);
    setGuestName("");
    setConfirmationError("");
  };

  const closePurchaseModal = () => {
    if (confirming) return;

    setSelectedGift(null);
    setGuestName("");
    setConfirmationError("");
  };

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();

    const trimmedName = guestName.trim();

    if (trimmedName.length < 2) {
      setConfirmationError("Please enter your name.");
      return;
    }

    setConfirming(true);
    setConfirmationError("");

    const { data, error } = await supabase.rpc(
      "mark_registry_item_purchased",
      {
        gift_id: selectedGift.id,
        guest_name: trimmedName,
      }
    );

    if (error) {
      console.error("Error confirming gift purchase:", error);
      setConfirmationError(
        "Something went wrong. Please try again."
      );
      setConfirming(false);
      return;
    }

    if (data !== true) {
      setConfirmationError(
        "This gift has already been marked as purchased."
      );

      setGifts((currentGifts) =>
        currentGifts.map((gift) =>
          gift.id === selectedGift.id
            ? { ...gift, purchased: true }
            : gift
        )
      );

      setConfirming(false);
      return;
    }

    setGifts((currentGifts) =>
      currentGifts.map((gift) =>
        gift.id === selectedGift.id
          ? {
              ...gift,
              purchased: true,
              purchased_by: trimmedName,
              purchased_at: new Date().toISOString(),
            }
          : gift
      )
    );

    setConfirming(false);
    setSelectedGift(null);
    setGuestName("");
  };

  return (
    <main className="registry-page">

      <Link to="/" className="registry-back">
        ← BACK
      </Link>

      <header className="registry-header">

        <p className="registry-eyebrow">
          AMBER & JOHAN
        </p>

        <h1>Gift Registry</h1>

        <div className="registry-divider"></div>

        <p className="registry-intro">
          Your presence at our celebration is more than enough,
          but for those who have asked, we've put together a few
          things we'd love for our home.
        </p>

      </header>

      {loading && (
        <p className="registry-message">
          Loading registry...
        </p>
      )}

      {errorMessage && (
        <p className="registry-message registry-error">
          {errorMessage}
        </p>
      )}

      {!loading && !errorMessage && (
        <section className="registry-grid">

          {gifts.map((gift) => (
            <article
              className={`gift-card ${
                gift.purchased ? "gift-purchased" : ""
              }`}
              key={gift.id}
            >

              <div className="gift-image">

                {gift.image_url ? (
                  <img
                    src={gift.image_url}
                    alt={gift.name}
                  />
                ) : (
                  <div className="gift-image-placeholder">
                    <span>THE KLEYN WEDDING</span>
                  </div>
                )}

                {gift.purchased && (
                  <div className="gift-purchased-overlay">
                    <span>✓ PURCHASED</span>
                  </div>
                )}

              </div>

              <div className="gift-content">

                <p className="gift-store">
                  {gift.store}
                </p>

                <h2>{gift.name}</h2>

                {gift.description && (
                  <p className="gift-description">
                    {gift.description}
                  </p>
                )}

                {gift.price && (
                  <p className="gift-price">
                    {formatPrice(gift.price)}
                  </p>
                )}

                {!gift.purchased ? (
                  <div className="gift-actions">

                    <a
                      href={gift.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gift-view"
                    >
                      VIEW GIFT
                    </a>

                    <button
                      type="button"
                      className="gift-confirm"
                      onClick={() => openPurchaseModal(gift)}
                    >
                      I'VE PURCHASED THIS
                    </button>

                  </div>
                ) : (
                  <div className="gift-purchased-status">
                    ✓ PURCHASED
                  </div>
                )}

              </div>

            </article>
          ))}

        </section>
      )}


      {/* PURCHASE CONFIRMATION MODAL */}

      {selectedGift && (
        <div
          className="purchase-modal-overlay"
          onMouseDown={closePurchaseModal}
        >

          <div
            className="purchase-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >

            <button
              type="button"
              className="purchase-modal-close"
              onClick={closePurchaseModal}
              disabled={confirming}
              aria-label="Close"
            >
              ×
            </button>

            <p className="purchase-modal-eyebrow">
              GIFT REGISTRY
            </p>

            <h2>Thank You</h2>

            <div className="purchase-modal-divider"></div>

            <p className="purchase-modal-gift">
              {selectedGift.name}
            </p>

            <p className="purchase-modal-text">
              Please only mark this gift as purchased once
              you've completed your order. This helps us avoid
              another guest purchasing the same gift. We so appreciate your generosity and kindness in blessing us with this gift - THANK YOU!
            </p>

            <form
              className="purchase-modal-form"
              onSubmit={handleConfirmPurchase}
            >

              <div className="purchase-modal-field">

                <label htmlFor="guestName">
                  YOUR NAME
                </label>

                <input
                  type="text"
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                  required
                />

              </div>

              {confirmationError && (
                <p className="purchase-modal-error">
                  {confirmationError}
                </p>
              )}

              <button
                type="submit"
                className="purchase-modal-confirm"
                disabled={confirming}
              >
                {confirming
                  ? "CONFIRMING..."
                  : "CONFIRM PURCHASE"}
              </button>

            </form>

          </div>

        </div>
      )}

    </main>
  );
};

export default GiftRegistry;