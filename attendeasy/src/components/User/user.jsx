import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../../utils/config";
import "bootstrap/dist/css/bootstrap.min.css";
import "./user.css";

const User = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [storedImage, setStoredImage] = useState(null);
  const [attendance, setAttendance] = useState(null);

  const details = location.state?.result;
  const isLoggedIn = localStorage.getItem("userLoggedIn") === "true";
  const username = details?.name || localStorage.getItem("username") || "";
  useEffect(() => {
    if (!isLoggedIn || !username) {
      navigate("/login");
      return;
    }

    const fetchStoredImage = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/users/${username}/images`,
        );
        console.log(response.data);
        setStoredImage(response.data["details"]["stored_image"]);
      } catch (error) {
        console.error("Failed to fetch stored image:", error);
      }
    };

    const fetchAttendance = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/user_attendance/${username}`,
        );
        console.log(response.data);
        setAttendance(response.data);
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
        setAttendance({ error: "No attendance data found." });
      }
    };

    fetchStoredImage();
    fetchAttendance();
  }, [username, navigate, isLoggedIn]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setIsUploading(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const predictFromImage = async (imageSrc) => {
    setPrediction([]);
    const response = await fetch(imageSrc);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append("image", blob, "uploaded_image.jpg");

    try {
      const response = await axios.post(
        `${config.API_URL}/user_recognize`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const results = response.data;

      setPrediction(results);

      setSelectedImage(null);
      setIsUploading(false);
    } catch (error) {
      console.error("Prediction failed:", error);
      setPrediction([{ name: "Error", probability: 0 }]);
    }
  };

  const handlePredictButton = () => {
    if (selectedImage) {
      predictFromImage(selectedImage);
    } else {
      console.error("No image uploaded");
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setIsUploading(false);
  };

  const attendanceEntries =
    attendance && !attendance.error ? Object.entries(attendance) : [];
  const presentCount = attendanceEntries.filter(
    ([, present]) => present,
  ).length;
  const absentCount = attendanceEntries.length - presentCount;
  const statusText =
    prediction.length > 0
      ? "Scan complete"
      : isUploading
        ? "Image ready"
        : "Awaiting scan";

  return (
    <div className="user-page">
      <section className="user-hero">
        <div className="user-hero-text">
          <span className="user-badge">Active Session</span>
          <h1>Welcome, {username || "Student"}</h1>
          <p className="user-hero-subtitle">
            Your face profile is ready. Upload a photo to verify quickly and
            keep attendance synced in real time.
          </p>
          <div className="user-hero-actions">
            <button
              className="user-btn ghost"
              type="button"
              onClick={() => navigate("/display-images")}
            >
              View user details
            </button>
          </div>
          <div className="user-metrics">
            <div className="metric-card">
              <span className="metric-label">Faces detected</span>
              <span className="metric-value">
                {prediction.length > 0 ? prediction.length : "N/A"}
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Recognition status</span>
              <span className="metric-value">{statusText}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Attendance days</span>
              <span className="metric-value">
                {attendanceEntries.length > 0
                  ? attendanceEntries.length
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
        <div className="user-hero-panel">
          <div className="profile-card">
            <div className="profile-image">
              {storedImage ? (
                <img
                  src={`data:image/jpeg;base64,${storedImage}`}
                  alt="Stored user"
                />
              ) : (
                <div className="profile-placeholder">No image</div>
              )}
            </div>
            <div className="profile-info">
              <h3>{username || "Student"}</h3>
              <p>Face ID linked to your roll number.</p>
            </div>
          </div>
          <div className="status-card">
            <h4>Live status</h4>
            <ul>
              <li>Camera: Ready</li>
              <li>Verification: {statusText}</li>
              <li>Storage: Encrypted profiles</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="user-grid">
        <div className="user-card upload-card">
          <div className="user-card-header">
            <h3>Verify another image</h3>
            <p>Upload a clear face image to run recognition.</p>
          </div>
          <label className="upload-drop">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="user-file-input"
            />
            <span className="upload-title">
              {selectedImage
                ? "Image ready to analyze"
                : "Tap to upload a face image"}
            </span>
            <span className="upload-hint">
              JPEG or PNG, well lit, front-facing.
            </span>
          </label>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Selected preview"
              className="upload-preview"
            />
          )}
          <div className="user-card-actions">
            <button
              onClick={selectedImage ? handlePredictButton : undefined}
              className="user-btn primary"
              disabled={!selectedImage}
              type="button"
            >
              {selectedImage ? "Run recognition" : "Select an image"}
            </button>
            {selectedImage && (
              <button
                onClick={clearSelection}
                className="user-btn ghost"
                type="button"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="user-card results-card">
          <div className="user-card-header">
            <h3>Recognition results</h3>
            <p>Confidence scores update after each scan.</p>
          </div>
          {prediction.length > 0 ? (
            <div className="results-list">
              {prediction.map((result, index) => (
                <div key={index} className="result-item">
                  <div>
                    <span className="result-name">{result.name}</span>
                    <span className="result-sub">Match probability</span>
                  </div>
                  <span className="result-score">
                    {(result.probability * 100).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="results-empty">
              <p>No scans yet. Upload a photo to start recognition.</p>
            </div>
          )}
          {prediction.length > 0 && (
            <div className="results-summary">
              <span>Faces detected</span>
              <strong>{prediction.length}</strong>
            </div>
          )}
        </div>

        <div className="user-card attendance-card">
          <div className="user-card-header">
            <h3>Attendance snapshot</h3>
            <p>Daily presence synced after successful login.</p>
          </div>
          {attendance ? (
            attendance.error ? (
              <div className="results-empty">
                <p>{attendance.error}</p>
              </div>
            ) : (
              <>
                <div className="attendance-stats">
                  <div>
                    <span className="metric-label">Present</span>
                    <span className="metric-value">{presentCount}</span>
                  </div>
                  <div>
                    <span className="metric-label">Absent</span>
                    <span className="metric-value">{absentCount}</span>
                  </div>
                </div>
                <div className="attendance-table">
                  <div className="attendance-row attendance-head">
                    <span>Date</span>
                    <span>Status</span>
                  </div>
                  {attendanceEntries.map(([date, present], index) => (
                    <div key={index} className="attendance-row">
                      <span>{date}</span>
                      <span
                        className={present ? "status-present" : "status-absent"}
                      >
                        {present ? "Present" : "Absent"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            <div className="results-empty">
              <p>Loading attendance...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default User;
