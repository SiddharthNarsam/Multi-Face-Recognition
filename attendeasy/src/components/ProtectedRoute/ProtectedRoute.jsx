import React from "react";
import { Navigate } from "react-router-dom";

const SESSION_MAX_MS = 60 * 60 * 1000;

const isSessionValid = () => {
  const isLoggedIn = localStorage.getItem("userLoggedIn") === "true";
  const loginAtRaw = localStorage.getItem("loginAt");
  const loginAt = loginAtRaw ? Number(loginAtRaw) : 0;

  if (!isLoggedIn || !loginAt) {
    return false;
  }

  const expired = Date.now() - loginAt > SESSION_MAX_MS;
  if (expired) {
    localStorage.setItem("userLoggedIn", "false");
    localStorage.removeItem("username");
    localStorage.removeItem("loginAt");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-change"));
    return false;
  }

  return true;
};

const ProtectedRoute = ({ element, requiredRole }) => {
  // Check if the user is logged in (You can check this from localStorage, sessionStorage, or state)
  if (!isSessionValid()) {
    return <Navigate to="/login" />;
  }

  if (requiredRole === "admin") {
    const role = localStorage.getItem("role") || "user";
    if (role !== "admin") {
      return <Navigate to="/user" />;
    }
  }

  // If logged in, render the protected route
  return element;
};

export default ProtectedRoute;
