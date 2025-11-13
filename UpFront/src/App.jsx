import React from "react";
import { Routes, Route, Navigate } from "react-router";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

const RedirectHandler = () => {
  const token = localStorage.getItem("token");
  console.log("Checking token for redirect:", token);
  return token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<RedirectHandler />} />
    </Routes>
  );
};

export default App;
