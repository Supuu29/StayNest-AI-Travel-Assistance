import React from "react";
import { useNavigate } from "react-router-dom";

function About() {
  const navigate = useNavigate();

  return (
    <div className="about-page">

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <p className="about-small-title">WELCOME TO STAYNEST</p>

          <h1>
            Travel smarter.
            <br />
            Stay better.
          </h1>

          <p className="about-hero-text">
            StayNest is your smart travel companion that helps you
            plan your trip, manage your budget, discover stays,
            and book your perfect accommodation — all in one place.
          </p>

          <div className="about-hero-buttons">
            <button
              onClick={() => navigate("/ai-budget-planner")}
              className="about-primary-button"
            >
              Plan My Trip
            </button>

            <button
              onClick={() => navigate("/stays")}
              className="about-secondary-button"
            >
              Explore Stays
            </button>
          </div>
        </div>
      </section>

      {/* What is StayNest */}
      <section className="about-section about-intro">
        <div className="about-section-heading">
          <p className="about-label">ABOUT STAYNEST</p>

          <h2>Everything you need for a better trip</h2>

          <p>
            Planning a trip can involve searching for destinations,
            calculating expenses, comparing stays, and managing
            bookings. StayNest brings these experiences together
            in one simple platform.
          </p>
        </div>

        <div className="about-intro-content">
          <div className="about-intro-card">
            <div className="about-icon">🏠</div>

            <h3>One Place</h3>

            <p>
              Discover stays, plan your budget, and manage your
              bookings without switching between multiple platforms.
            </p>
          </div>

          <div className="about-intro-card">
            <div className="about-icon">🤖</div>

            <h3>AI Powered</h3>

            <p>
              Our AI budget planner helps you create a practical
              travel budget based on your destination and available
              budget.
            </p>
          </div>

          <div className="about-intro-card">
            <div className="about-icon">✨</div>

            <h3>Simple Experience</h3>

            <p>
              We focus on keeping travel planning simple,
              understandable, and easy to use.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="about-section about-features-section">
        <div className="about-section-heading">
          <p className="about-label">WHAT WE OFFER</p>

          <h2>Travel planning made easier</h2>

          <p>
            From planning your budget to keeping track of your
            reservations, StayNest gives you the tools you need
            for your journey.
          </p>
        </div>

        <div className="about-features">

          <div className="about-feature-card">
            <div className="feature-number">01</div>

            <div className="feature-icon">🧠</div>

            <h3>AI Budget Planner</h3>

            <p>
              Enter your destination, number of travelers, trip
              duration, and budget. StayNest creates a
              category-wise travel budget for you.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="feature-number">02</div>

            <div className="feature-icon">🏡</div>

            <h3>Discover Stays</h3>

            <p>
              Explore available stays with useful information
              such as location, price, images, and other details.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="feature-number">03</div>

            <div className="feature-icon">📅</div>

            <h3>Easy Booking</h3>

            <p>
              Choose your preferred stay, enter your travel
              dates, and confirm your reservation easily.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="feature-number">04</div>

            <div className="feature-icon">👤</div>

            <h3>My Bookings</h3>

            <p>
              Keep all your current and previous bookings
              organized in one convenient place.
            </p>
          </div>

        </div>
      </section>

      {/* How it works */}
      <section className="about-section about-how-section">

        <div className="about-section-heading">
          <p className="about-label">HOW IT WORKS</p>

          <h2>Your journey starts here</h2>

          <p>
            Planning your stay with StayNest is simple.
          </p>
        </div>

        <div className="about-steps">

          <div className="about-step">
            <div className="step-circle">1</div>

            <h3>Choose your destination</h3>

            <p>
              Decide where you want to travel and start
              exploring your options.
            </p>
          </div>

          <div className="step-line"></div>

          <div className="about-step">
            <div className="step-circle">2</div>

            <h3>Set your budget</h3>

            <p>
              Tell our AI planner how many people are travelling,
              how long you will stay, and your total budget.
            </p>
          </div>

          <div className="step-line"></div>

          <div className="about-step">
            <div className="step-circle">3</div>

            <h3>Discover your stay</h3>

            <p>
              Find stays that match your destination and
              travel budget.
            </p>
          </div>

          <div className="step-line"></div>

          <div className="about-step">
            <div className="step-circle">4</div>

            <h3>Book & travel</h3>

            <p>
              Select your stay, choose your dates, confirm your
              booking, and get ready for your trip.
            </p>
          </div>

        </div>
      </section>

      {/* Mission */}
      <section className="about-mission">

        <div className="mission-content">
          <p className="about-label">OUR MISSION</p>

          <h2>
            Making travel planning
            <br />
            simple, smart, and stress-free.
          </h2>

          <p>
            We believe planning a trip should be exciting,
            not complicated. StayNest aims to bring useful
            travel tools together so travelers can spend less
            time worrying about planning and more time enjoying
            their journey.
          </p>
        </div>

      </section>

      {/* Technology */}
      <section className="about-section about-tech-section">

        <div className="about-section-heading">
          <p className="about-label">OUR TECHNOLOGY</p>

          <h2>Built with modern technology</h2>

          <p>
            StayNest combines modern web technologies with
            AI-powered travel planning to create a smooth
            travel experience.
          </p>
        </div>

        <div className="technology-list">

          <div className="technology-item">
            <span>⚛️</span>
            <strong>React</strong>
            <p>Interactive user interface</p>
          </div>

          <div className="technology-item">
            <span>🟢</span>
            <strong>Node.js</strong>
            <p>Backend application runtime</p>
          </div>

          <div className="technology-item">
            <span>🚀</span>
            <strong>Express.js</strong>
            <p>Backend API framework</p>
          </div>

          <div className="technology-item">
            <span>🍃</span>
            <strong>MongoDB</strong>
            <p>Database for application data</p>
          </div>

          <div className="technology-item">
            <span>🤖</span>
            <strong>Gemini AI</strong>
            <p>AI-powered travel planning</p>
          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="about-cta">

        <div>
          <p className="about-label">READY TO TRAVEL?</p>

          <h2>Start planning your next adventure.</h2>

          <p>
            Discover stays, plan your budget, and make your
            next trip easier with StayNest.
          </p>

          <div className="about-cta-buttons">

            <button
              className="about-primary-button"
              onClick={() => navigate("/ai-budget-planner")}
            >
              Plan My Trip
            </button>

            <button
              className="about-secondary-button"
              onClick={() => navigate("/stays")}
            >
              Explore Stays
            </button>

          </div>
        </div>

      </section>

    </div>
  );
}

export default About;