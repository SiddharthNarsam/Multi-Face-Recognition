import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import DisplayImages from "./components/DisplayImages";
import Crowd from "./components/Crowd";
import Attendence from "./components/Attendance";
import QrCodeScanner from "./components/QrCodeScanner";
import ProtectedRoute from "./components/ProtectedRoute";
import User from "./components/User";
import CNN from "./components/CNN";
import "./App.css";

function App() {
  const clearSession = useCallback(() => {
    localStorage.setItem("userLoggedIn", "false");
    localStorage.removeItem("username");
    localStorage.removeItem("loginAt");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-change"));
  }, []);

  const readAuthSnapshot = useCallback(() => {
    const username = localStorage.getItem("username") || "";
    const role = localStorage.getItem("role") || "user";
    const loginAtRaw = localStorage.getItem("loginAt");
    const loginAt = loginAtRaw ? Number(loginAtRaw) : 0;
    const isLoggedIn = localStorage.getItem("userLoggedIn") === "true";
    const sessionMaxMs = 60 * 60 * 1000;

    if (!isLoggedIn || !loginAt) {
      return { isLoggedIn: false, username: "", role: "user", expiresAt: 0 };
    }

    const expired = Date.now() - loginAt > sessionMaxMs;
    if (expired) {
      clearSession();
      return { isLoggedIn: false, username: "", role: "user", expiresAt: 0 };
    }

    return { isLoggedIn: true, username, role, expiresAt: loginAt + sessionMaxMs };
  }, [clearSession]);

  const [authState, setAuthState] = useState(readAuthSnapshot());
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    const syncAuth = () => {
      setAuthState(readAuthSnapshot());
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-change", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-change", syncAuth);
    };
  }, [readAuthSnapshot]);

  const isAdmin = authState.role === "admin";
  useEffect(() => {
    if (!authState.isLoggedIn || !authState.expiresAt) {
      return undefined;
    }

    const timeoutMs = authState.expiresAt - Date.now();
    if (timeoutMs <= 0) {
      clearSession();
      window.location.href = "/login";
      return undefined;
    }

    const timer = setTimeout(() => {
      clearSession();
      window.location.href = "/login";
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [authState.isLoggedIn, authState.expiresAt, clearSession]);

  const handleLogout = () => {
    clearSession();
    setNavOpen(false);
    window.location.href = "/login";
  };
  const Navbar = () => {
    if (isAdmin) {
      return (
        <nav className="site-nav">
          <div className="nav-inner">
            <a className="nav-brand" href="/home">
              Face Recognition KMIT
            </a>
            <button
              className="nav-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className={`nav-links ${navOpen ? "nav-open" : ""}`}>
              {authState.isLoggedIn && (
                <a
                  className="nav-link-item"
                  href="/home"
                  onClick={() => setNavOpen(false)}
                >
                  Home
                </a>
              )}
              {!authState.isLoggedIn && (
                <a
                  className="nav-link-item"
                  href="/"
                  onClick={() => setNavOpen(false)}
                >
                  Login
                </a>
              )}
              <a
                className="nav-link-item"
                href="/register"
                onClick={() => setNavOpen(false)}
              >
                Register
              </a>
              <a
                className="nav-link-item"
                href="/attendence"
                onClick={() => setNavOpen(false)}
              >
                Attendence
              </a>
              <a
                className="nav-link-item"
                href="/crowd-analysis"
                onClick={() => setNavOpen(false)}
              >
                Crowd Count
              </a>
              <a
                className="nav-link-item nav-pill"
                href="/CNN-login"
                onClick={() => setNavOpen(false)}
              >
                Custom CNN
              </a>
              {authState.isLoggedIn && (
                <button
                  className="nav-link-item nav-pill nav-logout"
                  type="button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </nav>
      );
    } else {
      return (
        <nav className="site-nav">
          <div className="nav-inner">
            <a className="nav-brand" href="/user">
              Face Recognition KMIT
            </a>
            <button
              className="nav-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className={`nav-links ${navOpen ? "nav-open" : ""}`}>
              {authState.isLoggedIn && (
                <a
                  className="nav-link-item"
                  href="/user"
                  onClick={() => setNavOpen(false)}
                >
                  Home
                </a>
              )}
              {!authState.isLoggedIn && (
                <a
                  className="nav-link-item"
                  href="/login"
                  onClick={() => setNavOpen(false)}
                >
                  Login
                </a>
              )}
              <a
                className="nav-link-item"
                href="/register"
                onClick={() => setNavOpen(false)}
              >
                Register
              </a>
              <a
                className="nav-link-item nav-pill"
                href="/CNN-Login"
                onClick={() => setNavOpen(false)}
              >
                CNN login
              </a>
              {authState.isLoggedIn && (
                <button
                  className="nav-link-item nav-pill nav-logout"
                  type="button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </nav>
      );
    }
  };
  return (
    <Router>
      {<Navbar />}

      <div className="container" style={{ paddingTop: "60px" }}>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/CNN-login" element={<CNN />} />
          {/* Use ProtectedRoute for the routes that require login */}
          <Route
            path="/home"
            element={<ProtectedRoute element={<Home />} requiredRole="admin" />}
          />
          <Route
            path="/display-images"
            element={
              <ProtectedRoute element={<DisplayImages />} requiredRole="admin" />
            }
          />
          <Route
            path="/crowd-analysis"
            element={<ProtectedRoute element={<Crowd />} requiredRole="admin" />}
          />
          <Route
            path="/attendence"
            element={
              <ProtectedRoute element={<Attendence />} requiredRole="admin" />
            }
          />
          <Route path="/user" element={<ProtectedRoute element={<User />} />} />
          <Route path="/QRscanner" element={<QrCodeScanner />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
