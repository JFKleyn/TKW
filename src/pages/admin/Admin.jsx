import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import "./Admin.css";

const Admin = () => {
  const navigate = useNavigate();

  const [rsvps, setRsvps] = useState([]);
  const [registryItems, setRegistryItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [restoringGiftId, setRestoringGiftId] = useState(null);
  const [deletingGiftId, setDeletingGiftId] = useState(null);
  const [registryError, setRegistryError] = useState("");

  // Add Gift
  const [showAddGift, setShowAddGift] = useState(false);
  const [addingGift, setAddingGift] = useState(false);
  const [addGiftError, setAddGiftError] = useState("");
  const [editingGift, setEditingGift] = useState(null);

  const [giftForm, setGiftForm] = useState({
    name: "",
    description: "",
    store: "",
    productUrl: "",
    price: "",
    image: null,
  });

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      const adminLoggedIn = sessionStorage.getItem("adminLoggedIn");

      if (adminLoggedIn !== "true") {
        navigate("/login");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        sessionStorage.removeItem("adminLoggedIn");
        navigate("/login");
        return;
      }

      // Load RSVPs
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (rsvpError) {
        console.error("Error loading RSVPs:", rsvpError);
        setLoading(false);
        return;
      }

      // Load Gift Registry
      const { data: registryData, error: registryLoadError } = await supabase
        .from("registry_items")
        .select("*")
        .order("created_at", { ascending: true });

      if (registryLoadError) {
        console.error("Error loading registry:", registryLoadError);
        setRegistryError("The gift registry could not be loaded.");
      }

      setRsvps(rsvpData || []);
      setRegistryItems(registryData || []);

      setLoading(false);
    };

    checkUserAndLoadData();
  }, [navigate]);

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = async () => {
    sessionStorage.removeItem("adminLoggedIn");

    await supabase.auth.signOut();

    navigate("/login");
  };

  // =========================================
  // ADD GIFT MODAL
  // =========================================

  const openAddGift = () => {
    setGiftForm({
      name: "",
      description: "",
      store: "",
      productUrl: "",
      price: "",
      image: null,
    });

    setAddGiftError("");
    setShowAddGift(true);
  };

  const closeAddGift = () => {
    if (addingGift) return;

    setShowAddGift(false);
    setAddGiftError("");
  };

  const handleGiftFormChange = (e) => {
    const { name, value } = e.target;

    setGiftForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleGiftImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setGiftForm((current) => ({
        ...current,
        image: null,
      }));
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setAddGiftError("Please choose a JPG, PNG or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAddGiftError("The image must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setAddGiftError("");

    setGiftForm((current) => ({
      ...current,
      image: file,
    }));
  };

  // =========================================
  // OPEN EDIT GIFT
  // =========================================

  const openEditGift = (gift) => {
    setEditingGift(gift);

    setGiftForm({
      name: gift.name || "",
      description: gift.description || "",
      store: gift.store || "",
      productUrl: gift.product_url || "",
      price:
        gift.price !== null && gift.price !== undefined
          ? gift.price.toString()
          : "",
      image: null,
    });

    setAddGiftError("");
    setShowAddGift(true);
  };

  const handleAddGift = async (e) => {
    e.preventDefault();

    setAddingGift(true);
    setAddGiftError("");

    let uploadedImagePath = null;
    let newImageUrl = null;

    try {
      // =====================================
      // UPLOAD NEW IMAGE IF SELECTED
      // =====================================

      if (giftForm.image) {
        const fileExtension = giftForm.image.name.split(".").pop();

        const fileName = `${crypto.randomUUID()}.${fileExtension}`;

        uploadedImagePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("registry-images")
          .upload(fileName, giftForm.image, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("registry-images")
          .getPublicUrl(fileName);

        newImageUrl = publicUrlData.publicUrl;
      }

      const price =
        giftForm.price.trim() === "" ? null : Number(giftForm.price);

      // =====================================
      // EDIT EXISTING GIFT
      // =====================================

      if (editingGift) {
        const updatedGiftData = {
          name: giftForm.name.trim(),
          description: giftForm.description.trim() || null,
          store: giftForm.store.trim(),
          product_url: giftForm.productUrl.trim(),
          price,
        };

        // Only replace image if a new one was selected
        if (giftForm.image) {
          updatedGiftData.image_url = newImageUrl;
          updatedGiftData.image_path = uploadedImagePath;
        }

        const { data: updatedGift, error: updateError } = await supabase
          .from("registry_items")
          .update(updatedGiftData)
          .eq("id", editingGift.id)
          .select()
          .single();

        if (updateError) {
          // Clean up newly uploaded image if DB update fails
          if (uploadedImagePath) {
            await supabase.storage
              .from("registry-images")
              .remove([uploadedImagePath]);
          }

          throw updateError;
        }

        // Delete OLD image only after DB update succeeds
        if (
          giftForm.image &&
          editingGift.image_path &&
          editingGift.image_path !== uploadedImagePath
        ) {
          const { error: oldImageDeleteError } = await supabase.storage
            .from("registry-images")
            .remove([editingGift.image_path]);

          if (oldImageDeleteError) {
            console.error(
              "Gift updated, but old image cleanup failed:",
              oldImageDeleteError,
            );
          }
        }

        setRegistryItems((currentItems) =>
          currentItems.map((gift) =>
            gift.id === editingGift.id ? updatedGift : gift,
          ),
        );
      }

      // =====================================
      // ADD NEW GIFT
      // =====================================
      else {
        const { data: newGift, error: insertError } = await supabase
          .from("registry_items")
          .insert([
            {
              name: giftForm.name.trim(),
              description: giftForm.description.trim() || null,
              store: giftForm.store.trim(),
              product_url: giftForm.productUrl.trim(),
              price,
              image_url: newImageUrl,
              image_path: uploadedImagePath,
            },
          ])
          .select()
          .single();

        if (insertError) {
          if (uploadedImagePath) {
            await supabase.storage
              .from("registry-images")
              .remove([uploadedImagePath]);
          }

          throw insertError;
        }

        setRegistryItems((currentItems) => [...currentItems, newGift]);
      }

      // =====================================
      // RESET
      // =====================================

      setGiftForm({
        name: "",
        description: "",
        store: "",
        productUrl: "",
        price: "",
        image: null,
      });

      setEditingGift(null);
      setShowAddGift(false);
    } catch (error) {
      console.error("Error saving gift:", error);

      setAddGiftError(
        editingGift
          ? "Something went wrong while updating the gift. Please try again."
          : "Something went wrong while adding the gift. Please try again.",
      );
    } finally {
      setAddingGift(false);
    }
  };

  // =========================================
  // DELETE GIFT
  // =========================================

  const handleDeleteGift = async (gift) => {
    const confirmed = window.confirm(
      `Permanently delete "${gift.name}" from the gift registry?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingGiftId(gift.id);
    setRegistryError("");

    // Delete database record first
    const { error: deleteError } = await supabase
      .from("registry_items")
      .delete()
      .eq("id", gift.id);

    if (deleteError) {
      console.error("Error deleting gift:", deleteError);

      setRegistryError("Something went wrong while deleting the gift.");

      setDeletingGiftId(null);
      return;
    }

    // Delete image from Storage if we know its path
    if (gift.image_path) {
      const { error: imageDeleteError } = await supabase.storage
        .from("registry-images")
        .remove([gift.image_path]);

      if (imageDeleteError) {
        console.error(
          "Gift deleted, but image cleanup failed:",
          imageDeleteError,
        );
      }
    }

    // Remove from dashboard immediately
    setRegistryItems((currentItems) =>
      currentItems.filter((item) => item.id !== gift.id),
    );

    setDeletingGiftId(null);
  };

  // =========================================
  // RESTORE GIFT
  // =========================================

  const handleRestoreGift = async (gift) => {
    const confirmed = window.confirm(
      `Restore "${gift.name}" to the available gift list?`,
    );

    if (!confirmed) {
      return;
    }

    setRestoringGiftId(gift.id);
    setRegistryError("");

    const { data, error } = await supabase.rpc("restore_registry_item", {
      gift_id: gift.id,
    });

    if (error) {
      console.error("Error restoring gift:", error);

      setRegistryError("Something went wrong while restoring the gift.");

      setRestoringGiftId(null);
      return;
    }

    if (data !== true) {
      setRegistryError("This gift could not be restored.");

      setRestoringGiftId(null);
      return;
    }

    setRegistryItems((currentItems) =>
      currentItems.map((item) =>
        item.id === gift.id
          ? {
              ...item,
              purchased: false,
              purchased_by: null,
              purchased_at: null,
            }
          : item,
      ),
    );

    setRestoringGiftId(null);
  };

  // =========================================
  // RSVP DATA
  // =========================================

  const attendingGuests = rsvps.filter((rsvp) => rsvp.attending === true);

  const declinedGuests = rsvps.filter((rsvp) => rsvp.attending === false);

  const totalResponses = rsvps.length;
  const attending = attendingGuests.length;
  const declined = declinedGuests.length;

  // =========================================
  // REGISTRY DATA
  // =========================================

  const availableGifts = registryItems.filter(
    (gift) => gift.purchased === false,
  );

  const purchasedGifts = registryItems.filter(
    (gift) => gift.purchased === true,
  );

  const totalGifts = registryItems.length;
  const totalAvailableGifts = availableGifts.length;
  const totalPurchasedGifts = purchasedGifts.length;

  // =========================================
  // FORMATTING
  // =========================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "—";
    }

    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(price);
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <main className="admin-page">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      {/* HEADER */}

      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">THE KLEYN WEDDING</p>

          <h1>Admin Dashboard</h1>
        </div>

        <button type="button" className="admin-logout" onClick={handleLogout}>
          LOG OUT
        </button>
      </header>

      {/* =====================================
          RSVP DASHBOARD
      ====================================== */}

      <section className="admin-dashboard-block">
        <div className="admin-dashboard-title">
          <p>ENGAGEMENT PARTY</p>
          <h2>RSVP Dashboard</h2>
        </div>

        <section className="admin-stats">
          <div className="admin-stat">
            <span>TOTAL RESPONSES</span>
            <strong>{totalResponses}</strong>
          </div>

          <div className="admin-stat">
            <span>ATTENDING</span>
            <strong>{attending}</strong>
          </div>

          <div className="admin-stat">
            <span>DECLINED</span>
            <strong>{declined}</strong>
          </div>
        </section>

        {/* ATTENDING */}

        <section className="admin-guest-section">
          <div className="admin-section-heading">
            <div>
              <p>ENGAGEMENT PARTY</p>
              <h2>Attending</h2>
            </div>

            <span>
              {attending} {attending === 1 ? "guest" : "guests"}
            </span>
          </div>

          {attendingGuests.length === 0 ? (
            <p className="admin-empty">No guests have accepted yet.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>GUEST</th>
                    <th>RSVP</th>
                    <th>SUBMITTED</th>
                  </tr>
                </thead>

                <tbody>
                  {attendingGuests.map((rsvp) => (
                    <tr key={rsvp.id}>
                      <td>
                        {rsvp.first_name} {rsvp.surname}
                      </td>

                      <td>
                        <span className="status-attending">Attending</span>
                      </td>

                      <td>{formatDate(rsvp.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* DECLINED */}

        <section className="admin-guest-section declined-section">
          <div className="admin-section-heading">
            <div>
              <p>ENGAGEMENT PARTY</p>
              <h2>Declined</h2>
            </div>

            <span>
              {declined} {declined === 1 ? "guest" : "guests"}
            </span>
          </div>

          {declinedGuests.length === 0 ? (
            <p className="admin-empty">No guests have declined.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>GUEST</th>
                    <th>RSVP</th>
                    <th>SUBMITTED</th>
                  </tr>
                </thead>

                <tbody>
                  {declinedGuests.map((rsvp) => (
                    <tr key={rsvp.id}>
                      <td>
                        {rsvp.first_name} {rsvp.surname}
                      </td>

                      <td>
                        <span className="status-declined">Declined</span>
                      </td>

                      <td>{formatDate(rsvp.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {/* =====================================
          GIFT REGISTRY
      ====================================== */}

      <section className="admin-registry-section">
        <div className="admin-registry-header">
          <div className="admin-dashboard-title">
            <p>AMBER & JOHAN</p>
            <h2>Gift Registry</h2>
          </div>

          <button
            type="button"
            className="admin-add-gift"
            onClick={openAddGift}
          >
            + ADD GIFT
          </button>
        </div>

        {/* REGISTRY TOTALS */}

        <section className="admin-stats">
          <div className="admin-stat">
            <span>TOTAL GIFTS</span>
            <strong>{totalGifts}</strong>
          </div>

          <div className="admin-stat">
            <span>AVAILABLE</span>
            <strong>{totalAvailableGifts}</strong>
          </div>

          <div className="admin-stat">
            <span>PURCHASED</span>
            <strong>{totalPurchasedGifts}</strong>
          </div>
        </section>

        {registryError && (
          <p className="admin-registry-error">{registryError}</p>
        )}

        {/* AVAILABLE GIFTS */}

        <section className="admin-guest-section">
          <div className="admin-section-heading">
            <div>
              <p>GIFT REGISTRY</p>
              <h2>Available</h2>
            </div>

            <span>
              {totalAvailableGifts}{" "}
              {totalAvailableGifts === 1 ? "gift" : "gifts"}
            </span>
          </div>

          {availableGifts.length === 0 ? (
            <p className="admin-empty">No gifts are currently available.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>GIFT</th>
                    <th>STORE</th>
                    <th>PRICE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {availableGifts.map((gift) => (
                    <tr key={gift.id}>
                      <td>{gift.name}</td>

                      <td>{gift.store}</td>

                      <td>{formatPrice(gift.price)}</td>

                      <td>
                        <span className="status-attending">Available</span>
                      </td>
                      <td>
                        <div className="admin-gift-actions">
                          <button
                            type="button"
                            className="admin-edit"
                            onClick={() => openEditGift(gift)}
                          >
                            EDIT
                          </button>

                          <button
                            type="button"
                            className="admin-delete"
                            onClick={() => handleDeleteGift(gift)}
                            disabled={deletingGiftId === gift.id}
                          >
                            {deletingGiftId === gift.id
                              ? "DELETING..."
                              : "DELETE"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* PURCHASED GIFTS */}

        <section className="admin-guest-section declined-section">
          <div className="admin-section-heading">
            <div>
              <p>GIFT REGISTRY</p>
              <h2>Purchased</h2>
            </div>

            <span>
              {totalPurchasedGifts}{" "}
              {totalPurchasedGifts === 1 ? "gift" : "gifts"}
            </span>
          </div>

          {purchasedGifts.length === 0 ? (
            <p className="admin-empty">No gifts have been purchased yet.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table admin-registry-table">
                <thead>
                  <tr>
                    <th>GIFT</th>
                    <th>PURCHASED BY</th>
                    <th>PURCHASED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {purchasedGifts.map((gift) => (
                    <tr key={gift.id}>
                      <td>{gift.name}</td>

                      <td>{gift.purchased_by || "—"}</td>

                      <td>{formatDate(gift.purchased_at)}</td>

                      <td>
                        <div className="admin-gift-actions">
                          <button
                            type="button"
                            className="admin-restore"
                            onClick={() => handleRestoreGift(gift)}
                            disabled={restoringGiftId === gift.id}
                          >
                            {restoringGiftId === gift.id
                              ? "RESTORING..."
                              : "RESTORE"}
                          </button>

                          <button
                            type="button"
                            className="admin-edit"
                            onClick={() => openEditGift(gift)}
                          >
                            EDIT
                          </button>

                          <button
                            type="button"
                            className="admin-delete"
                            onClick={() => handleDeleteGift(gift)}
                            disabled={deletingGiftId === gift.id}
                          >
                            {deletingGiftId === gift.id
                              ? "DELETING..."
                              : "DELETE"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {/* =====================================
          ADD GIFT MODAL
      ====================================== */}

      {showAddGift && (
        <div className="admin-gift-modal-overlay" onMouseDown={closeAddGift}>
          <div
            className="admin-gift-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="admin-gift-modal-close"
              onClick={closeAddGift}
              disabled={addingGift}
              aria-label="Close"
            >
              ×
            </button>

            <div className="admin-gift-modal-header">
              <p>GIFT REGISTRY</p>

              <h2>{editingGift ? "Edit Gift" : "Add Gift"}</h2>

              <div className="admin-gift-modal-divider"></div>
            </div>

            <form className="admin-gift-form" onSubmit={handleAddGift}>
              <div className="admin-gift-field">
                <label htmlFor="giftName">GIFT NAME *</label>

                <input
                  type="text"
                  id="giftName"
                  name="name"
                  value={giftForm.name}
                  onChange={handleGiftFormChange}
                  required
                />
              </div>

              <div className="admin-gift-field">
                <label htmlFor="giftDescription">DESCRIPTION</label>

                <textarea
                  id="giftDescription"
                  name="description"
                  value={giftForm.description}
                  onChange={handleGiftFormChange}
                  rows="3"
                />
              </div>

              <div className="admin-gift-form-row">
                <div className="admin-gift-field">
                  <label htmlFor="giftStore">STORE *</label>

                  <input
                    type="text"
                    id="giftStore"
                    name="store"
                    value={giftForm.store}
                    onChange={handleGiftFormChange}
                    required
                  />
                </div>

                <div className="admin-gift-field">
                  <label htmlFor="giftPrice">PRICE</label>

                  <input
                    type="number"
                    id="giftPrice"
                    name="price"
                    value={giftForm.price}
                    onChange={handleGiftFormChange}
                    min="0"
                    step="0.01"
                    placeholder="1999.00"
                  />
                </div>
              </div>

              <div className="admin-gift-field">
                <label htmlFor="giftUrl">PRODUCT LINK *</label>

                <input
                  type="url"
                  id="giftUrl"
                  name="productUrl"
                  value={giftForm.productUrl}
                  onChange={handleGiftFormChange}
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="admin-gift-field">
                <label htmlFor="giftImage">PRODUCT IMAGE</label>

                <input
                  type="file"
                  id="giftImage"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleGiftImageChange}
                  className="admin-gift-file-input"
                />

                <span className="admin-gift-file-help">
                  JPG, PNG or WebP · Maximum 5 MB
                </span>
              </div>

              {giftForm.image && (
                <p className="admin-selected-image">
                  Selected: {giftForm.image.name}
                </p>
              )}

              {addGiftError && (
                <p className="admin-gift-error">{addGiftError}</p>
              )}

              <button
                type="submit"
                className="admin-gift-submit"
                disabled={addingGift}
              >
                {addingGift
                  ? editingGift
                    ? "SAVING..."
                    : "ADDING GIFT..."
                  : editingGift
                    ? "SAVE CHANGES"
                    : "ADD GIFT"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Admin;
