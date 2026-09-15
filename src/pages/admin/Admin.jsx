import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import "./Admin.css";

const Admin = () => {
  const navigate = useNavigate();

  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndLoadRsvps = async () => {
      // Require a fresh admin login for this browser session
      const adminLoggedIn = sessionStorage.getItem("adminLoggedIn");

      if (adminLoggedIn !== "true") {
        navigate("/login");
        return;
      }

      // Make sure there is still a valid Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        sessionStorage.removeItem("adminLoggedIn");
        navigate("/login");
        return;
      }

      // Load RSVPs
      const { data, error } = await supabase
        .from("rsvps")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) {
        console.error("Error loading RSVPs:", error);
        setLoading(false);
        return;
      }

      setRsvps(data || []);
      setLoading(false);
    };

    checkUserAndLoadRsvps();
  }, [navigate]);

  const handleLogout = async () => {
    // Remove our temporary admin login
    sessionStorage.removeItem("adminLoggedIn");

    // Sign out of Supabase
    await supabase.auth.signOut();

    navigate("/login");
  };

  // Separate attending and declined guests
  const attendingGuests = rsvps.filter((rsvp) => rsvp.attending === true);

  const declinedGuests = rsvps.filter((rsvp) => rsvp.attending === false);

  // Dashboard totals
  const totalResponses = rsvps.length;
  const attending = attendingGuests.length;
  const declined = declinedGuests.length;

  // Format Supabase timestamp
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
          <h1>RSVP Dashboard</h1>
        </div>

        <button type="button" className="admin-logout" onClick={handleLogout}>
          LOG OUT
        </button>
      </header>

      {/* DASHBOARD TOTALS */}
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

      {/* ATTENDING GUESTS */}
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

      {/* DECLINED GUESTS */}
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
    </main>
  );
};

export default Admin;
