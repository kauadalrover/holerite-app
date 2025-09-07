import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import HoleriteApp from "./HoleriteApp";
import LucroApp from "./LucroApp";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/holerite" element={<HoleriteApp />} />
        <Route path="/lucro" element={<LucroApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);