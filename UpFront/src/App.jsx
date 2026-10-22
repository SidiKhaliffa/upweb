import React from "react";
import { Routes, Route, Navigate } from "react-router";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Toaster from "./Components/Toaster";
import "./styles/forms.css";

const RedirectHandler = () => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<RedirectHandler />} />
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
