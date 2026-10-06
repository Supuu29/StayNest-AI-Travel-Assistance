import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <div
          className="navbar-logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <img
            src="/staynestlogo.png"
            alt="StayNest Logo"
            className="logo-image"
          />
          <span>StayNest</span>
        </div>

        {/* Navigation */}
        <div className="navbar-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/stays">Stays</NavLink>
          <NavLink to="/my-bookings">My Bookings</NavLink>
          <NavLink to="/about">About</NavLink>
        </div>

        {/* Actions */}
        <div className="navbar-actions">

          {/* AI Budget Planner */}
          <button
            className="ai-button"
            onClick={() => navigate("/ai-budget-planner")}
          >
            ✨ AI Budget Planner
          </button>

          {isLoggedIn ? (
            <>
              {/* User name */}
              <span
                style={{
                  fontWeight: "600",
                  marginRight: "10px",
                }}
              >
                Hi, {user?.name}
              </span>

              {/* Logout */}
              <button
                className="login-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Login */}
              <button
                className="login-button"
                onClick={() => navigate("/login")}
              >
                Login
              </button>

              {/* Signup */}
              <button
                className="signup-button"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;