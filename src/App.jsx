import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AppLayout } from "./Components/AppLayout";

import Home from "./Pages/Home";
import Stays from "./Pages/Stays";
import AIBudgetPlanner from "./Pages/AIBudgetPlanner";
import MyBookings from "./Pages/MyBookings";

import Login from "./Pages/login";
import Signup from "./Pages/Signup";
import ProtectedRoute from "./Components/protectedRoute";
import Booking from "./Pages/booking";
import About from "./Pages/About";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<AppLayout />}>

          {/* Home Page */}
          <Route path="/" element={<Home />} />

          {/* Stays Page */}
          <Route path="/stays" element={<Stays />} />

          {/* Login Page */}
          <Route path="/login" element={<Login />} />

          {/* Signup Page */}
          <Route path="/signup" element={<Signup />} />

          {/* AI Budget Planner - Protected */}
          <Route
            path="/ai-budget-planner"
            element={
              <ProtectedRoute>
                <AIBudgetPlanner />
              </ProtectedRoute>
            }
          />

          <Route path="/booking" element={<Booking />} />

          <Route path="/my-bookings" element={<MyBookings />} />

          <Route path="/About" element={<About />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;