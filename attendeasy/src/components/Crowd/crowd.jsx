import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { config } from "../../utils/config";
import "./crowd.css";

function Crowd() {
  const [image, setImage] = useState(null); // Stores captured image
  const [processedImage, setProcessedImage] = useState(null); // Stores processed image from backend
  const [humanCount, setHumanCount] = useState(null); // Number of humans detected
  const [isCameraOpen, setIsCameraOpen] = useState(false); // Toggle for webcam
  const [isLoading, setIsLoading] = useState(false); // Loading state for submission
  const [previewUrl, setPreviewUrl] = useState("");
  const webcamRef = useRef(null); // Reference to Webcam component
  const navigate = useNavigate();
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user", // Use "environment" for back camera on mobile
  };

  const handleOpenCamera = () => {
    setIsCameraOpen(!isCameraOpen); // Open the camera
  };

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot(); // Capture image from webcam
      if (imageSrc) {
        // Convert base64 to file
        const byteString = atob(imageSrc.split(",")[1]);
        const mimeString = imageSrc.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], "captured_image.jpg", {
          type: "image/jpeg",
        });
        setImage(file);
        setPreviewUrl(imageSrc);
      } else {
        setPreviewUrl("");
      }
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await axios.post(`${config.API_URL}/crowd`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProcessedImage(`data:image/jpeg;base64,${response.data.image}`);
      setHumanCount(response.data.count);
    } catch (error) {
      console.error("Error processing the image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="crowd-page">
      <section className="crowd-hero">
        <div className="crowd-hero-text">
          <span className="crowd-pill">Crowd intelligence</span>
          <h1>Real-time crowd analysis</h1>
          <p>
            Upload or capture a frame to detect people instantly. Get visual
            overlays and a fast count that helps manage capacity and safety.
          </p>
          <div className="crowd-hero-actions">
            <button
              className="crowd-btn ghost"
              type="button"
              onClick={() => navigate("/home")}
            >
              Back to dashboard
            </button>
          </div>
          <div className="crowd-info-grid">
            <div className="crowd-info-card">
              <h4>Live capture</h4>
              <p>Use the camera or upload a still image.</p>
            </div>
            <div className="crowd-info-card">
              <h4>Instant count</h4>
              <p>Model highlights faces with precise totals.</p>
            </div>
            <div className="crowd-info-card">
              <h4>Smart insights</h4>
              <p>Plan seating and monitoring with data.</p>
            </div>
          </div>
        </div>
        <div className="crowd-hero-panel">
          <div className="crowd-hero-card">
            <h3>Session snapshot</h3>
            <ul>
              <li>Detection model: YOLO</li>
              <li>Frame size: 1280 x 720</li>
              <li>Status: {isLoading ? "Processing" : "Ready"}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="crowd-grid">
        <div className="crowd-card upload-card">
          <div className="crowd-card-header">
            <h3>Upload or capture</h3>
            <p>Choose a file or open the camera to snap a frame.</p>
          </div>
          <label className="crowd-upload">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setImage(file || null);
                setPreviewUrl(file ? URL.createObjectURL(file) : "");
              }}
            />
            <span className="upload-title">
              {image ? "Image selected" : "Tap to upload an image"}
            </span>
            <span className="upload-hint">JPG or PNG. Clear, wide-angle.</span>
          </label>
          {previewUrl && (
            <img className="crowd-preview" src={previewUrl} alt="Preview" />
          )}
          <div className="crowd-actions">
            <button
              className="crowd-btn primary"
              type="button"
              onClick={handleOpenCamera}
            >
              {isCameraOpen ? "Close camera" : "Open camera"}
            </button>
            <button
              className="crowd-btn ghost"
              type="button"
              onClick={captureImage}
            >
              Capture image
            </button>
          </div>
        </div>

        <div className="crowd-card camera-card">
          <div className="crowd-card-header">
            <h3>Live camera</h3>
            <p>Position the camera to capture the crowd scene.</p>
          </div>
          {isCameraOpen ? (
            <div className="camera-frame">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
              />
            </div>
          ) : (
            <div className="camera-placeholder">
              Camera closed. Click "Open camera" to start.
            </div>
          )}
        </div>

        <div className="crowd-card result-card">
          <div className="crowd-card-header">
            <h3>Results</h3>
            <p>Processed frame and detected count appear here.</p>
          </div>
          <div className="result-metrics">
            <div>
              <span className="metric-label">People detected</span>
              <span className="metric-value">
                {humanCount !== null ? humanCount : "--"}
              </span>
            </div>
            <div>
              <span className="metric-label">Processing</span>
              <span className="metric-value">
                {isLoading ? "Running" : "Idle"}
              </span>
            </div>
          </div>
          {processedImage ? (
            <img
              className="processed-image"
              src={processedImage}
              alt="Processed"
            />
          ) : (
            <div className="camera-placeholder">
              No processed image yet. Submit a frame to analyze.
            </div>
          )}
          <button
            className="crowd-btn primary"
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !image}
          >
            {isLoading ? "Processing..." : "Submit for analysis"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default Crowd;
