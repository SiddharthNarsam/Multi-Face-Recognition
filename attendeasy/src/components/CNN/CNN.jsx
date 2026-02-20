import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { config } from "../../utils/config";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CNN.css";

const CNN = () => {
  const webcamRef = useRef(null);
  const [rollnumber, setRollNumber] = useState("");
  const [message, setMessage] = useState("");
  const [process, setProcess] = useState(false);
  const [reco, setReco] = useState(null);
  const [probability, setProbability] = useState(null);
  const [feedback, setFeedback] = useState("");

  const captureAndVerify = async () => {
    setProcess(true);
    setMessage("");
    setFeedback("");
    setReco(null);
    setProbability(null);

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setMessage("Failed to capture image. Please try again.");
      setProcess(false);
      return;
    }

    const responseData = imageSrc.split(",")[1];
    const blob = await fetch(`data:image/jpeg;base64,${responseData}`).then(
      (res) => res.blob(),
    );

    const formData = new FormData();
    formData.append("image", blob, "captured_image.jpg");
    formData.append("rollnumber", rollnumber);

    try {
      const response = await axios.post(
        `${config.API_URL}/CNN-login`,
        formData,
      );
      const result = response.data;
      const prob = result.probability ?? 0;
      setProbability(prob);

      if (prob > 0.5) {
        setReco(`Custom CNN matched: ${rollnumber}`);
      } else {
        setReco("Custom CNN could not verify this face.");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      if (error.response) {
        setMessage("Server error: " + error.response.data.error);
      } else {
        setMessage("Network error. Please check your connection.");
      }
    } finally {
      setProcess(false);
    }
  };

  const renderResult = () => {
    if (reco && probability !== null) {
      const success = probability > 0.5;
      return (
        <div className={`result-card ${success ? "success" : "danger"}`}>
          <div className="result-header">
            <span className="dot dot-green" />
            <span className="dot dot-yellow" />
            <span className="dot dot-red" />
            <span className="result-label">Prediction feedback</span>
          </div>
          <div className="result-body">
            <h4>{reco}</h4>
            <p>Confidence: {(probability * 100).toFixed(2)}%</p>
          </div>
          <div className="feedback-row">
            <span>Was this prediction correct?</span>
            <div className="feedback-buttons">
              <button
                className="btn primary-btn"
                onClick={() => setFeedback("Marked as correct.")}
              >
                Correct
              </button>
              <button
                className="btn ghost-btn danger"
                onClick={() => setFeedback("Marked as incorrect.")}
              >
                Incorrect
              </button>
            </div>
          </div>
          {feedback && (
            <div
              className={`feedback-status ${
                feedback.includes("incorrect") ? "danger" : "success"
              }`}
            >
              {feedback}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="cnn-page">
      <section className="cnn-hero">
        <div className="hero-text">
          <div className="pill">Custom CNN</div>
          <h1>Login with the custom model</h1>
          <p className="hero-subtitle">
            Use the experimental convolutional network tailored for your campus.
            Capture a frame, pair it with a roll number, and review the
            prediction instantly.
          </p>
          <div className="hero-list">
            <div className="hero-item">
              <h4>Custom training</h4>
              <p>Purpose-built CNN tuned for your dataset.</p>
            </div>
            <div className="hero-item">
              <h4>Live capture</h4>
              <p>Capture from camera with privacy-safe preview.</p>
            </div>
            <div className="hero-item">
              <h4>Result feedback</h4>
              <p>Mark outcomes as correct or incorrect for QA.</p>
            </div>
          </div>
        </div>

        <div className="panel live-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Custom CNN</p>
              <h3>Capture & verify</h3>
            </div>
          </div>
          <div className="camera-frame">
            <div className="media-topbar">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="media-label">Live camera</span>
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
          <div className="form-area">
            <label className="field">
              <span>Roll number</span>
              <input
                type="text"
                placeholder="Enter roll number"
                value={rollnumber}
                onChange={(e) => setRollNumber(e.target.value)}
              />
            </label>
            <button
              onClick={captureAndVerify}
              className="btn primary-btn"
              disabled={process}
            >
              {process ? "Processing..." : "Capture and Verify"}
            </button>
            {message && <p className="status-text error">{message}</p>}
          </div>
          {renderResult()}
        </div>
      </section>
    </div>
  );
};

export default CNN;
