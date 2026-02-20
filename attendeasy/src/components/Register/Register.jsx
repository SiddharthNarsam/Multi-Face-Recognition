import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import QrScanner from "react-qr-scanner";
import axios from "axios";
import { config } from "../../utils/config";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [details, setDetails] = useState({
    rollNumber: "",
    username: "",
    fatherName: "",
    phoneNumber: "",
  });
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [mode, setMode] = useState("qr");
  const [infoMessage, setInfoMessage] = useState(
    "Scan a QR code or switch to manual to start.",
  );

  const parseQrData = (data) => {
    const parts = data.split(",");
    return {
      rollNumber: parts[0] || "",
      username: parts[1] || "",
      fatherName: parts[2] || "",
      phoneNumber: parts[4] || "",
    };
  };

  const handleScan = (data) => {
    if (data) {
      const parsedData = parseQrData(data.text);
      setDetails(parsedData);
      setError("");
      setInfoMessage(
        "QR scanned and details filled. Capture images to proceed.",
      );
      setIsScannerOpen(false);
    }
  };

  const handleError = (err) => {
    setError("Error accessing the camera or scanning QR code.");
    console.error(err);
  };

  const captureImages = async () => {
    setIsCapturing(true);
    const images = [];
    for (let i = 0; i < 7; i++) {
      const imageSrc = webcamRef.current.getScreenshot();
      images.push(imageSrc);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    setCapturedImages(images);
    setIsCapturing(false);
    setInfoMessage("Images captured. Submit to register.");
  };

  const sendImagesToBackend = async () => {
    if (!details.rollNumber || !details.username || !details.phoneNumber) {
      setInfoMessage("Please fill in roll number, username, and phone number.");
      return;
    }

    if (capturedImages.length === 0) {
      setInfoMessage("Capture 7 images before submitting.");
      return;
    }

    const payload = new FormData();
    payload.append("RollNumber", details.rollNumber);
    payload.append("Username", details.username);
    payload.append("FatherName", details.fatherName);
    payload.append("phoneNumber", details.phoneNumber);

    capturedImages.forEach((image, index) => {
      const byteString = atob(image.split(",")[1]);
      const mimeString = image.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const file = new Blob([ab], { type: mimeString });
      payload.append(`image${index}`, file, `captured_image_${index}.jpg`);
    });

    try {
      setSuccess(!success);
      await axios.post(`${config.API_URL}/register`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess(!success);
      alert("User registered successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Failed to register user:", error);
      setInfoMessage("Registration failed. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="register-page">
      <section className="instruction-banner">
        <div className="pill soft">Quick steps</div>
        <ol>
          <li>Scroll down to enter details.</li>
          <li>Pick one: scan QR for auto-fill or type manually.</li>
          <li>Capture 7 images, then submit to register.</li>
        </ol>
      </section>

      <section className="register-hero">
        <div className="hero-text">
          <div className="pill">New profile</div>
          <h1>Create a student profile</h1>
          <p className="hero-subtitle">
            Register with either a quick QR scan or manual details, then capture
            seven frames for a reliable face embedding. Responsive and ready for
            any device.
          </p>
          <div className="hero-actions">
            <button
              className={`btn ghost-btn ${mode === "qr" ? "active" : ""}`}
              onClick={() => setMode("qr")}
            >
              Use QR code
            </button>
            <button
              className={`btn ghost-btn ${mode === "manual" ? "active" : ""}`}
              onClick={() => setMode("manual")}
            >
              Enter details manually
            </button>
          </div>
          {infoMessage && <p className="hint-text">{infoMessage}</p>}
        </div>

        <div className="live-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Live capture</p>
              <h3>Take 7 snapshots</h3>
            </div>
            <span className="status-badge">
              {capturedImages.length}/7 captured
            </span>
          </div>

          <div className="camera-frame">
            <div className="media-topbar">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="media-label">Capture Feed</span>
            </div>
            <div className="camera-shell">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="camera-feed"
                videoConstraints={{
                  width: 360,
                  height: 270,
                  facingMode: "user",
                }}
              />
            </div>
          </div>

          <div className="panel-footer">
            <button
              onClick={captureImages}
              className="btn primary-btn"
              disabled={isCapturing}
            >
              {isCapturing ? "Capturing..." : "Capture 7 images"}
            </button>
            {capturedImages.length > 0 && (
              <p className="footer-hint">
                {capturedImages.length} images ready. Submit to register.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <div className="panel details-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {mode === "qr" ? "Scan & autofill" : "Manual entry"}
              </p>
              <h3>Student details</h3>
            </div>
            {mode === "qr" ? (
              <button
                className="btn ghost-btn"
                type="button"
                onClick={() => setIsScannerOpen(true)}
              >
                Scan QR
              </button>
            ) : (
              <span className="status-badge">Manual</span>
            )}
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Roll number</span>
              <input
                name="rollNumber"
                value={details.rollNumber}
                onChange={handleInputChange}
                placeholder="e.g. 23BD1A056V"
                required
              />
            </label>
            <label className="field">
              <span>Full name</span>
              <input
                name="username"
                value={details.username}
                onChange={handleInputChange}
                placeholder="Student name"
                required
              />
            </label>
            <label className="field">
              <span>Father's name</span>
              <input
                name="fatherName"
                value={details.fatherName}
                onChange={handleInputChange}
                placeholder="Optional"
              />
            </label>
            <label className="field">
              <span>Phone number</span>
              <input
                name="phoneNumber"
                value={details.phoneNumber}
                onChange={handleInputChange}
                placeholder="10-digit number"
                required
              />
            </label>
          </div>

          <div className="panel-footer">
            <button
              onClick={sendImagesToBackend}
              className="btn primary-btn"
              disabled={
                isCapturing ||
                capturedImages.length === 0 ||
                !details.rollNumber ||
                !details.username ||
                !details.phoneNumber
              }
            >
              {success ? "Register user" : "Processing..."}
            </button>
            <p className="footer-hint">
              Use QR to autofill or type manually, then capture seven frames
              before submitting.
            </p>
          </div>
        </div>

        <div className="panel summary-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Preview</p>
              <h3>Collected info</h3>
            </div>
          </div>
          <ul className="data-list">
            <li className="data-row">
              <span className="name">Roll Number</span>
              <span className="score">{details.rollNumber || "-"}</span>
            </li>
            <li className="data-row">
              <span className="name">Name</span>
              <span className="score">{details.username || "-"}</span>
            </li>
            <li className="data-row">
              <span className="name">Father's Name</span>
              <span className="score">{details.fatherName || "-"}</span>
            </li>
            <li className="data-row">
              <span className="name">Phone</span>
              <span className="score">{details.phoneNumber || "-"}</span>
            </li>
            <li className="data-row">
              <span className="name">Captured</span>
              <span className="score">{capturedImages.length}/7</span>
            </li>
          </ul>

          <div className="instructions">
            <h4>Capture tips</h4>
            <ul>
              <li>Use bright, even lighting to avoid shadows.</li>
              <li>Keep the background neat and clutter-free.</li>
              <li>Clean the camera lens for sharp images.</li>
              <li>Center your face and hold still for each frame.</li>
            </ul>
          </div>
        </div>
      </section>

      {isScannerOpen && (
        <div className="qr-overlay">
          <div className="qr-modal">
            <button
              className="qr-close"
              onClick={() => setIsScannerOpen(false)}
              aria-label="Close scanner"
            >
              &times;
            </button>
            <h4 className="text-center">Scan QR Code</h4>
            <QrScanner
              delay={200}
              onError={handleError}
              onScan={handleScan}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              facingMode="environment"
            />
            {error && <p className="text-danger mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
