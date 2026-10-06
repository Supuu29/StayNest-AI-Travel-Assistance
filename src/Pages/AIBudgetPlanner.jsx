import React, { useState } from "react";
import listings from "../api/listings.json";
import { useNavigate } from "react-router-dom";

function AIBudgetPlanner() {
  const [destination, setDestination] = useState("");
  const [travelers, setTravelers] = useState(1);
  const [days, setDays] = useState(1);
  const [budget, setBudget] = useState(10000);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  // Generate budget plan
  const handlePlanTrip = async () => {
    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }

    if (travelers < 1 || days < 1 || budget < 1) {
      setError("Please enter valid trip details.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/ai/budget-plan`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destination,
      travelers,
      days,
      budget,
    }),
  }
);

      const data = await response.json();

      console.log("Backend response:", data);

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to generate travel plan"
        );
      }

      setResult(data.plan);
    } catch (error) {
      console.error("Budget planner error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Find recommended stays
  const getRecommendedStays = () => {
    if (!result || !Array.isArray(listings)) {
      return [];
    }

    // Stay budget per night
    const maxPricePerNight =
      Number(result.Stay || 0) / Number(days || 1);

    const searchDestination =
      destination.trim().toLowerCase();

    return listings
      .filter((listing) => {
        const city = String(
          listing.city || ""
        ).toLowerCase();

        const price =
          Number(listing.pricePerNight) || 0;

        const destinationMatch =
          city.includes(searchDestination) ||
          searchDestination.includes(city);

        const priceMatch =
          price <= maxPricePerNight;

        return destinationMatch && priceMatch;
      })
      .sort(
        (a, b) =>
          Number(a.pricePerNight || 0) -
          Number(b.pricePerNight || 0)
      )
      .slice(0, 6);
  };

  const recommendedStays = getRecommendedStays();

  // Total budget
  const total =
    Number(result?.Stay || 0) +
    Number(result?.Food || 0) +
    Number(result?.Transport || 0) +
    Number(result?.Buffer || 0);

  // Budget percentages
  const stayPercent = total
    ? (Number(result?.Stay || 0) / total) * 100
    : 0;

  const foodPercent = total
    ? (Number(result?.Food || 0) / total) * 100
    : 0;

  const transportPercent = total
    ? (Number(result?.Transport || 0) / total) * 100
    : 0;

  const bufferPercent = total
    ? (Number(result?.Buffer || 0) / total) * 100
    : 0;

  return (
    <div className="budget-page">

      {/* HEADER */}

      <div className="budget-header">
        <h1>AI Budget Planner</h1>

        <p>
          Plan your trip smartly with an AI-powered budget
          breakdown.
        </p>
      </div>


      {/* PLANNER INPUT */}

      <div className="planner-card">

        <div className="input-group">

          <label>Destination</label>

          <input
            type="text"
            placeholder="e.g. Goa, Manali, Mumbai"
            value={destination}
            onChange={(e) =>
              setDestination(e.target.value)
            }
          />

        </div>


        <div className="input-row">

          <div className="input-group">

            <label>Travelers</label>

            <input
              type="number"
              min="1"
              value={travelers}
              onChange={(e) =>
                setTravelers(Number(e.target.value))
              }
            />

          </div>


          <div className="input-group">

            <label>Travel Days</label>

            <input
              type="number"
              min="1"
              value={days}
              onChange={(e) =>
                setDays(Number(e.target.value))
              }
            />

          </div>


          <div className="input-group">

            <label>Total Budget (₹)</label>

            <input
              type="number"
              min="1"
              value={budget}
              onChange={(e) =>
                setBudget(Number(e.target.value))
              }
            />

          </div>

        </div>


        <button
          className="plan-button"
          onClick={handlePlanTrip}
          disabled={loading}
        >
          {loading
            ? "Creating Your Plan..."
            : "Plan My Trip"}
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {/* RESULT */}

      {result && (

        <div className="result-section">


          {/* RESULT TITLE */}

          <div className="result-title">

            <h2>
              Your {destination} Budget Plan
            </h2>

            <p>
              {days} days • {travelers} traveler
              {travelers > 1 ? "s" : ""}
            </p>

          </div>


          {/* TOTAL */}

          <div className="total-card">

            <div>

              <span>
                Total Estimated Budget
              </span>

              <h2>
                ₹{total.toLocaleString("en-IN")}
              </h2>

            </div>

            <div className="total-icon">
              ₹
            </div>

          </div>


          {/* BUDGET CARDS */}

          <div className="budget-cards">


            <div className="budget-card stay">

              <span>🏨</span>

              <p>Stay</p>

              <h3>
                ₹
                {Number(result.Stay || 0)
                  .toLocaleString("en-IN")}
              </h3>

            </div>


            <div className="budget-card food">

              <span>🍴</span>

              <p>Food</p>

              <h3>
                ₹
                {Number(result.Food || 0)
                  .toLocaleString("en-IN")}
              </h3>

            </div>


            <div className="budget-card transport">

              <span>🚗</span>

              <p>Transport</p>

              <h3>
                ₹
                {Number(result.Transport || 0)
                  .toLocaleString("en-IN")}
              </h3>

            </div>


            <div className="budget-card buffer">

              <span>🛡️</span>

              <p>Buffer</p>

              <h3>
                ₹
                {Number(result.Buffer || 0)
                  .toLocaleString("en-IN")}
              </h3>

            </div>

          </div>


          {/* CHART */}

          <div className="chart-card">

            <div>

              <h2>
                Budget Breakdown
              </h2>

              <p>
                See where your travel budget is allocated.
              </p>


              <div className="legend">

                <div>
                  <span className="legend-dot stay-dot"></span>
                  Stay — {stayPercent.toFixed(0)}%
                </div>

                <div>
                  <span className="legend-dot food-dot"></span>
                  Food — {foodPercent.toFixed(0)}%
                </div>

                <div>
                  <span className="legend-dot transport-dot"></span>
                  Transport — {transportPercent.toFixed(0)}%
                </div>

                <div>
                  <span className="legend-dot buffer-dot"></span>
                  Buffer — {bufferPercent.toFixed(0)}%
                </div>

              </div>

            </div>


            <div
              className="pie-chart"
              style={{
                background: `conic-gradient(
                  #4f46e5 0% ${stayPercent}%,
                  #22c55e ${stayPercent}% ${
                    stayPercent + foodPercent
                  }%,
                  #f59e0b ${
                    stayPercent + foodPercent
                  }% ${
                    stayPercent +
                    foodPercent +
                    transportPercent
                  }%,
                  #ef4444 ${
                    stayPercent +
                    foodPercent +
                    transportPercent
                  }% 100%
                )`,
              }}
            >

              <div className="pie-center">

                <span>Total</span>

                <strong>
                  ₹{total.toLocaleString("en-IN")}
                </strong>

              </div>

            </div>

          </div>


          {/* RECOMMENDED STAYS */}

          <div className="recommended-stays">

            <div className="result-title">

              <h2>
                Recommended Stays
              </h2>

              <p>
                Stays in {destination} within your ₹
                {Number(result.Stay || 0)
                  .toLocaleString("en-IN")}
                {" "}stay budget.
              </p>

            </div>


            {recommendedStays.length > 0 ? (

              <div className="recommended-stays-row">

                {recommendedStays.map((listing) => (

                  <div
                    className="ai-stay-card"
                    key={listing.id || listing.title}
                  >


                    {/* IMAGE */}

                    <div className="ai-stay-image">

                      <img
                        src={`/${listing.image}`}
                        alt={listing.title}
                      />

                    </div>


                    {/* INFO */}

                    <div className="ai-stay-info">

                      <h3>
                        {listing.title}
                      </h3>

                      <p className="ai-stay-location">
                        {listing.city}
                      </p>


                      <div className="ai-stay-bottom">

                        <div>

                          <strong>
                            ₹
                            {Number(
                              listing.pricePerNight
                            ).toLocaleString("en-IN")}
                          </strong>

                          <span>
                            {" "} / night
                          </span>

                        </div>


                        <button
                        className="ai-book-button"
                        onClick={() =>
    navigate("/booking", {
      state: {
        listing,
      },
    })
  }
>
  Book Now
</button>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              <div className="no-stays">

                <p>
                  No stays found within your stay budget.
                </p>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default AIBudgetPlanner;