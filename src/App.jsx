import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AppLayout } from "./Components/AppLayout";

import Home from "./Pages/Home";
import Stays from "./Pages/Stays";
import AIBudgetPlanner from "./Pages/AIBudgetPlanner";
import { MyBookings } from "./Pages/MyBookings";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>

          {/* Home Page */}
          <Route path="/" element={<Home />} />

          {/* Stays Page */}
          <Route path="/stays" element={<Stays />} />

          {/* AI Budget Planner Page */}
          <Route path="/ai-budget-planner" element={<AIBudgetPlanner />} />

          <Route path="/my-bookings" element={<MyBookings />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;