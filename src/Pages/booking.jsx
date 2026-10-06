import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  const listing = location.state?.listing;

  const [userName, setUserName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const handleBooking = async (e) => {
    e.preventDefault();

    setError("");

    if (!userName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates.");
      return;
    }

    if (checkOut <= checkIn) {
      setError("Check-out date must be after check-in date.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login before booking.");
      return;
    }

    try {
      setLoading(true);

      console.log("BOOKING DATA:", {
  listingId: listing.title,
  title: listing.title,
  city: listing.city,
  image: listing.image,
  pricePerNight: listing.pricePerNight,
  guestName: userName,
  checkIn,
  checkOut,
});

      const response = await fetch(
        "http://localhost:5000/api/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            listingId: listing.title,
            title: listing.title,
            city: listing.city,
            image: listing.image,
            pricePerNight: listing.pricePerNight,
            guestName: userName,
            checkIn,
            checkOut,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create booking."
        );
      }

      // Booking successful
      navigate("/my-bookings");
    } catch (error) {
      console.error("Booking Error:", error);
      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // If user opens /booking directly without selecting a stay
  if (!listing) {
    return (
      <div className="booking-page">
        <div className="booking-card">
          <h2>No Stay Selected</h2>

          <p>
            Please select a stay before proceeding with
            booking.
          </p>

          <button
            className="confirm-booking-button"
            onClick={() => navigate("/")}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-card">

        {/* Selected Stay */}
        <div className="selected-stay">
          <img
            src={`/${listing.image}`}
            alt={listing.title}
          />

          <div>
            <h2>{listing.title}</h2>

            <p>{listing.city}</p>

            <strong>
              ₹
              {Number(
                listing.pricePerNight
              ).toLocaleString("en-IN")}{" "}
              / night
            </strong>
          </div>
        </div>

        <hr />

        {/* Booking Heading */}
        <h1>Book Your Stay</h1>

        <p className="booking-subtitle">
          Enter your details to reserve this stay.
        </p>

        {/* Booking Form */}
        <form onSubmit={handleBooking}>

          {/* Guest Name */}
          <div className="booking-field">
            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) =>
                setUserName(e.target.value)
              }
            />
          </div>

          {/* Dates */}
          <div className="booking-date-row">

            <div className="booking-field">
              <label>Check-in</label>

              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) =>
                  setCheckIn(e.target.value)
                }
              />
            </div>

            <div className="booking-field">
              <label>Check-out</label>

              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) =>
                  setCheckOut(e.target.value)
                }
              />
            </div>

          </div>

          {/* Error */}
          {error && (
            <p className="booking-error">
              {error}
            </p>
          )}

          {/* Confirm */}
          <button
            type="submit"
            className="confirm-booking-button"
            disabled={loading}
          >
            {loading
              ? "Confirming..."
              : "Confirm Booking"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Booking;