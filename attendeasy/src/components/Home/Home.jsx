import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";
import { config } from "../../utils/config";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [prediction, setPrediction] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userList, setUserList] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [storedImage, setStoredImage] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [attendanceList, setAttendanceList] = useState([]);
  const [infoMessage, setInfoMessage] = useState("");

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role") || "user";
  const isLoggedIn = localStorage.getItem("userLoggedIn") === "true";

  console.log("Home component - Debug info:", {
    username,
    role,
    isLoggedIn,
    loginAt: localStorage.getItem("loginAt"),
  });

  useEffect(() => {
    console.log(
      "Home useEffect running - isLoggedIn:",
      isLoggedIn,
      "role:",
      role,
    );
    if (!isLoggedIn) {
      console.log("Not logged in, redirecting to /");
      navigate("/");
      return;
    }
    if (role !== "admin") {
      console.log("Not admin, redirecting to /user");
      navigate("/user");
      return;
    }
    console.log("Admin user, fetching data...");

    const fetchStoredImage = async () => {
      if (!username) {
        console.log("No username, skipping image fetch");
        return;
      }
      try {
        console.log("Fetching stored image for:", username);
        const response = await axios.get(
          `${config.API_URL}/users/${username}/images`,
        );
        console.log("Stored image response:", response.data);
        setStoredImage(response.data.details.stored_image);
      } catch (error) {
        console.error("Failed to fetch stored image:", error);
        console.error("Error details:", error.response?.data);
      }
    };

    const fetchUsers = async () => {
      try {
        console.log("Fetching users list...");
        const response = await axios.get(`${config.API_URL}/get_users`);
        console.log("Users response:", response.data);
        setUserList(response.data.users || []);
        setUserCount(response.data.count || 0);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        console.error("Error details:", error.response?.data);
      }
    };

    fetchStoredImage();
    fetchUsers();
  }, [username, navigate, isLoggedIn, role]);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setIsUploading(true);
        setInfoMessage("Image loaded. Run predict to get results.");
      };
      reader.readAsDataURL(file);
    }
  };

  const predictFromImage = async (imageSrc, sourceLabel) => {
    setIsRunning(true);
    setPrediction([]);
    setInfoMessage(`Running recognition from ${sourceLabel}...`);

    const response = await fetch(imageSrc);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append("image", blob, "uploaded_image.jpg");

    try {
      const response = await axios.post(
        `${config.API_URL}/recognize`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const results = response.data;

      setPrediction(results);

      setAttendanceList((prev) => {
        const next = [...prev];
        results.forEach((result) => {
          if (!next.some((user) => user.name === result.name)) {
            next.push(result);
          }
        });
        return next;
      });
      setInfoMessage("Recognition updated.");
    } catch (error) {
      console.error("Prediction failed:", error);
      setPrediction([{ name: "Error", probability: 0 }]);
      setInfoMessage("Prediction failed. Please try again.");
    } finally {
      setIsRunning(false);
      setSelectedImage(null);
      setIsUploading(false);
    }
  };

  const captureAndPredict = async () => {
    if (isRunning) {
      setInfoMessage("Finishing the previous capture...");
      return;
    }
    if (!webcamRef.current || !isCameraOn) {
      setInfoMessage("Turn on the camera to capture a frame.");
      return;
    }
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setInfoMessage("Unable to capture a frame. Please try again.");
      return;
    }
    await predictFromImage(imageSrc, "live camera");
  };

  const handlePredictButton = () => {
    if (selectedImage) {
      predictFromImage(selectedImage, "uploaded image");
    } else {
      setInfoMessage("Select an image first to run prediction.");
    }
  };

  const handleToggleCamera = () => {
    if (isCameraOn) {
      if (intervalId) {
        clearInterval(intervalId);
      }
      setIntervalId(null);
      setIsCameraOn(false);
      setInfoMessage("Live capture paused.");
    } else {
      setIsCameraOn(true);
      const id = setInterval(() => {
        captureAndPredict();
      }, 2500);
      setIntervalId(id);
      setInfoMessage("Live capture started.");
    }
  };

  const navigateToDisplayImages = () => {
    navigate("/display-images");
  };

  const logoutfun = () => {
    localStorage.setItem("userLoggedIn", "false");
    localStorage.removeItem("username");
    localStorage.removeItem("loginAt");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  };

  const handleMakeAdmin = async (rollNumber) => {
    try {
      setInfoMessage("Updating user role...");
      await axios.patch(`${config.API_URL}/users/${rollNumber}/role`, {
        role: "admin",
      });
      const response = await axios.get(`${config.API_URL}/get_users`);
      setUserList(response.data.users || []);
      setUserCount(response.data.count || 0);
      setInfoMessage("User updated to admin.");
    } catch (error) {
      console.error("Failed to update user role:", error);
      const message =
        error.response?.data?.error || "Failed to update user role.";
      setInfoMessage(message);
    }
  };

  const handleDeleteUser = async (rollNumber) => {
    const confirmed = window.confirm(
      `Delete ${rollNumber}? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }
    try {
      setInfoMessage("Deleting user...");
      await axios.delete(`${config.API_URL}/users/${rollNumber}`);
      const response = await axios.get(`${config.API_URL}/get_users`);
      setUserList(response.data.users || []);
      setUserCount(response.data.count || 0);
      setInfoMessage("User deleted.");
    } catch (error) {
      console.error("Failed to delete user:", error);
      const message = error.response?.data?.error || "Failed to delete user.";
      setInfoMessage(message);
    }
  };

  if (!isLoggedIn) {
    console.log("Render: Not logged in, should redirect");
    navigate("/");
    return null;
  }

  console.log("Rendering Home page...");
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-text">
          <div className="pill">Admin Console</div>
          <h1>Smart attendance control center</h1>
          <p className="hero-subtitle">
            Welcome back{username ? `, ${username}` : ""}. Monitor live
            recognition, review roster details, and log attendance in one view.
          </p>

          <div className="stat-row">
            <div className="stat-card">
              <span className="stat-label">Registered users</span>
              <span className="stat-number">{userCount}</span>
              <span className="stat-foot">Synced from server</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Faces detected</span>
              <span className="stat-number">{prediction.length}</span>
              <span className="stat-foot">Last capture</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Marked present</span>
              <span className="stat-number">{attendanceList.length}</span>
              <span className="stat-foot">Current session</span>
            </div>
          </div>

          <div className="hero-actions">
            <button onClick={handleToggleCamera} className="btn primary-btn">
              {isCameraOn ? "Stop live capture" : "Start live capture"}
            </button>
            <label className="btn ghost-btn upload-trigger">
              Upload an image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                hidden
              />
            </label>
            <button onClick={navigateToDisplayImages} className="btn ghost-btn">
              View user records
            </button>
            <button onClick={logoutfun} className="btn danger-btn">
              Log out
            </button>
          </div>
          {infoMessage && <p className="hint-text">{infoMessage}</p>}
        </div>

        <div className="live-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Live recognition</p>
              <h3>{isCameraOn ? "Camera active" : "Camera paused"}</h3>
            </div>
            <span className={`status-badge ${isCameraOn ? "success" : "idle"}`}>
              {isCameraOn ? "Running" : "Idle"}
            </span>
          </div>

          <div className="camera-shell">
            {isCameraOn ? (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="camera-feed"
                videoConstraints={{
                  width: 480,
                  height: 360,
                  facingMode: "user",
                }}
              />
            ) : (
              <div className="camera-placeholder">
                <p>Start live capture to monitor faces automatically.</p>
                <button
                  className="btn primary-btn"
                  type="button"
                  onClick={handleToggleCamera}
                >
                  Start now
                </button>
              </div>
            )}
          </div>

          <div className="panel-footer">
            <button
              onClick={captureAndPredict}
              className="btn primary-btn"
              disabled={!isCameraOn || isRunning}
            >
              {isRunning ? "Processing..." : "Capture current frame"}
            </button>
            <p className="footer-hint">
              Auto-capture runs every few seconds while live capture is on.
            </p>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <div className="panel upload-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Manual check</p>
              <h3>Upload & predict</h3>
            </div>
            {isUploading && <span className="status-badge">Ready</span>}
          </div>
          <div className="upload-drop">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Uploaded preview"
                className="upload-preview"
              />
            ) : (
              <div className="upload-empty">
                <p>Drop or select an image to run recognition.</p>
                <label className="btn ghost-btn upload-trigger">
                  Choose image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    hidden
                  />
                </label>
              </div>
            )}
          </div>
          <div className="panel-footer">
            <button
              onClick={handlePredictButton}
              className="btn primary-btn"
              disabled={!selectedImage || isRunning}
            >
              {isRunning ? "Running..." : "Predict uploaded image"}
            </button>
          </div>
        </div>

        <div className="panel predictions-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Detections</p>
              <h3>Latest results</h3>
            </div>
            <span className="status-badge">
              {prediction.length} face{prediction.length === 1 ? "" : "s"}
            </span>
          </div>
          {prediction.length > 0 ? (
            <ul className="data-list">
              {prediction.map((result, index) => (
                <li key={index} className="data-row">
                  <span className="name">{result.name}</span>
                  <span className="score">
                    {(result.probability * 100).toFixed(2)}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="placeholder-text">
              No detections yet. Capture a frame or upload an image to begin.
            </p>
          )}
        </div>

        <div className="panel attendance-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Session log</p>
              <h3>Attendance</h3>
            </div>
            <span className="status-badge">{attendanceList.length}</span>
          </div>
          {attendanceList.length > 0 ? (
            <ul className="data-list">
              {attendanceList.map((user, index) => (
                <li key={index} className="data-row">
                  <span className="name">{user.name}</span>
                  <span className="score">Marked</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="placeholder-text">No users marked as present yet.</p>
          )}
        </div>

        <div className="panel roster-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Roster</p>
              <h3>User details</h3>
            </div>
          </div>

          <div className="roster-highlight">
            {storedImage ? (
              <div className="stored-image">
                <img
                  src={`data:image/jpeg;base64,${storedImage}`}
                  alt="Stored user"
                />
                <div>
                  <p className="eyebrow">Stored image</p>
                  <p className="name">{username}</p>
                </div>
              </div>
            ) : (
              <p className="placeholder-text">
                No stored image found for this user.
              </p>
            )}
          </div>

          <div className="roster-list">
            <div className="panel-heading roster-heading">
              <p className="eyebrow">Registered users</p>
              <span className="status-badge">{userCount}</span>
            </div>
            <ul className="data-list scrollable">
              {userList.map((user) => (
                <li key={user.rollNumber} className="data-row roster-row">
                  <div className="roster-info">
                    <span className="name">{user.rollNumber || ""}</span>
                    <span className="roster-sub">{user.username || ""}</span>
                  </div>
                  <div className="roster-meta">
                    <span
                      className={`role-pill ${
                        user.role === "admin" ? "admin" : "user"
                      }`}
                    >
                      {user.role || "user"}
                    </span>
                    {user.role !== "admin" && (
                      <button
                        className="btn ghost-btn roster-btn"
                        type="button"
                        onClick={() => handleMakeAdmin(user.rollNumber)}
                      >
                        Make admin
                      </button>
                    )}
                    <button
                      className="btn danger-btn roster-btn"
                      type="button"
                      onClick={() => handleDeleteUser(user.rollNumber)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
