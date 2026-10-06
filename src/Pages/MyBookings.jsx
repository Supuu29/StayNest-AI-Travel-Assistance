import React, { useEffect, useState } from "react";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login to view your bookings.");
      setLoading(false);
      return;
    }

    try {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/bookings/my-bookings`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to fetch bookings."
        );
      }

      setBookings(data.bookings || []);
    } catch (error) {
      console.error("My Bookings Error:", error);
      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-bookings-page">
        <h1>My Bookings</h1>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-bookings-page">
        <h1>My Bookings</h1>
        <p className="my-bookings-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <h1>My Bookings</h1>

      <p className="my-bookings-subtitle">
        Here are all your current and past bookings.
      </p>

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <h2>No Bookings Yet</h2>
          <p>You haven't booked any stays yet.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div
              className="my-booking-card"
              key={booking._id}
            >
              {/* Stay Image */}
              <div className="my-booking-image">
                <img
                  src={`/${booking.stay.image}`}
                  alt={booking.stay.title}
                />
              </div>

              {/* Booking Details */}
              <div className="my-booking-details">
                <h2>{booking.stay.title}</h2>

                <p className="booking-location">
                  📍 {booking.stay.city}
                </p>

                <p className="booking-price">
                  ₹
                  {Number(
                    booking.stay.pricePerNight
                  ).toLocaleString("en-IN")}{" "}
                  / night
                </p>

                <div className="booking-info-grid">

                  {/* Guest */}
                  <div>
                    <span>Guest Name</span>
                    <strong>
                      {booking.guestName}
                    </strong>
                  </div>

                  {/* Check-in */}
                  <div>
                    <span>Check-in</span>
                    <strong>
                      {new Date(
                        booking.checkIn
                      ).toLocaleDateString("en-IN")}
                    </strong>
                  </div>

                  {/* Check-out */}
                  <div>
                    <span>Check-out</span>
                    <strong>
                      {new Date(
                        booking.checkOut
                      ).toLocaleDateString("en-IN")}
                    </strong>
                  </div>

                  {/* Booking Date */}
                  <div>
                    <span>Booked On</span>
                    <strong>
                      {new Date(
                        booking.createdAt
                      ).toLocaleDateString("en-IN")}
                    </strong>
                  </div>

                </div>

                <div className="booking-status">
                  Booking Confirmed
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;