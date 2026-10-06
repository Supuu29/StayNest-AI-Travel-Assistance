import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [showPopup, setShowPopup] = useState(true);

  // User already logged in
  if (isLoggedIn) {
    return children;
  }

  // User is NOT logged in
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          padding: "35px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "70px",
            height: "70px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            backgroundColor: "#eff6ff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "32px",
          }}
        >
          🔒
        </div>

        {/* Heading */}
        <h2
          style={{
            margin: "0 0 12px",
            color: "#222",
            fontSize: "25px",
          }}
        >
          Must Sign Up
        </h2>

        {/* Message */}
        <p
          style={{
            margin: "0 0 28px",
            color: "#666",
            fontSize: "15px",
            lineHeight: "1.6",
          }}
        >
          You must sign up first to use the AI Budget Planner.
        </p>

        {/* Sign Up Button */}
        <button
          onClick={() => navigate("/signup")}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "10px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>

        {/* Cancel Button */}
        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            padding: "13px",
            marginTop: "10px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            backgroundColor: "#ffffff",
            color: "#555",
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;