import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import QrScanner from "react-qr-scanner";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { config } from "../../utils/config";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Login.css";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [message, setMessage] = useState("");
  const [process, setProcess] = useState(true);
  const [rollnumber, setRollnumber] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [error, setError] = useState("");

  // Set rollnumber from location.state if provided
  useEffect(() => {
    if (location.state?.rollnumber) {
      setRollnumber(location.state.rollnumber);
    }
  }, [location.state]);

  const handleScan = (data) => {
    if (data) {
      const scannedRollNumber = data.text.split(",")[0];
      setRollnumber(scannedRollNumber);
      setShowQrScanner(false); // Automatically close QR scanner after successful scan
    }
  };

  const handleError = (err) => {
    setError("Error accessing the camera or scanning QR code.");
    console.error(err);
  };

  const captureAndVerify = async () => {
    setProcess(false); // Disable button
    setMessage(""); // Clear previous messages

    // Validate rollnumber first
    if (!rollnumber || rollnumber.trim() === "") {
      setMessage("Please enter your roll number.");
      setProcess(true);
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setMessage("Failed to capture image. Please try again.");
      setProcess(true);
      return;
    }

    try {
      // Convert base64 image to Blob
      const responseData = imageSrc.split(",")[1]; // Extract base64 part
      const blob = await fetch(`data:image/jpeg;base64,${responseData}`).then(
        (res) => res.blob(),
      );

      // Prepare form data
      const formData = new FormData();
      formData.append("image", blob, "captured_image.jpg");
      formData.append("rollnumber", rollnumber.trim());

      // Make API call
      const response = await axios.post(`${config.API_URL}/login`, formData);
      const result = response.data;
      console.log("Login response:", result);

      // Process the response
      const uname = result["name"];
      const role = result["role"] || "user";
      console.log("Login success - username:", uname, "role:", role);

      if (uname !== "Unknown" && uname !== "user not recognised") {
        localStorage.setItem("userLoggedIn", "true"); // Mark user as logged in
        localStorage.setItem("username", uname);
        localStorage.setItem("loginAt", Date.now().toString());
        localStorage.setItem("role", role);
        console.log("LocalStorage set:", {
          userLoggedIn: localStorage.getItem("userLoggedIn"),
          username: localStorage.getItem("username"),
          role: localStorage.getItem("role"),
          loginAt: localStorage.getItem("loginAt"),
        });
        window.dispatchEvent(new Event("auth-change"));

        // Navigate based on user type
        if (role === "admin") {
          console.log("Admin login, navigating to /home");
          navigate("/home");
        } else {
          console.log("User login, navigating to /user");
          navigate("/user", { state: { result: result } });
        }
      } else {
        setMessage("Face not recognized.");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      if (error.response) {
        // Display specific error message from server
        const errorMsg =
          error.response.data?.error ||
          error.response.data?.message ||
          "Server error occurred";
        setMessage(`Error: ${errorMsg}`);
      } else if (error.request) {
        setMessage("No response from server. Please check your connection.");
      } else {
        setMessage("Network error. Please check your connection.");
      }
    } finally {
      setProcess(true); // Enable button
    }
  };

  const previewStyle = {
    height: "300px",
    width: "100%",
    maxWidth: "400px",
    objectFit: "cover",
  };

  return (
    <div className="login-page">
      <section className="hero">
        <div className="hero-text">
          <div className="pill">KMIT Attendance Suite</div>
          <h1>Login with Face Recognition</h1>
          <p className="hero-subtitle">
            Streamline attendance management with secure, fast face verification
            and QR-based identity pairing.
          </p>

          <div className="login-panel">
            <label htmlFor="rollnumber" className="input-label">
              Roll Number
            </label>
            <input
              id="rollnumber"
              type="text"
              placeholder="Enter roll number"
              value={rollnumber}
              onChange={(e) => setRollnumber(e.target.value)}
              className="form-control login-input"
            />
            <div className="button-row">
              <button
                onClick={captureAndVerify}
                className="btn primary-btn"
                disabled={!process}
              >
                {process ? "Capture and Verify" : "Processing..."}
              </button>
              <button
                onClick={() => setShowQrScanner(true)}
                className="btn ghost-btn"
              >
                Scan QR Code
              </button>
            </div>
            {message && <p className="status-text error-text">{message}</p>}
          </div>

          <div className="capture-guidelines">
            <h4>Capture tips</h4>
            <ul>
              <li>Keep only one face in the frame.</li>
              <li>Use bright, even lighting without harsh shadows.</li>
              <li>Center your face and look straight at the camera.</li>
              <li>Keep the background clean and uncluttered.</li>
            </ul>
          </div>

          <div className="trust-row">
            <div className="trust-card">
              <h4>Seamless Login</h4>
              <p>One glance. One tap. No passwords.</p>
            </div>
            <div className="trust-card">
              <h4>Attendance Sync</h4>
              <p>Auto-mark presence in real time.</p>
            </div>
            <div className="trust-card">
              <h4>Custom CNN</h4>
              <p>Tailored models for your campus.</p>
            </div>
          </div>
        </div>

        <div className="hero-media">
          <div className="media-frame">
            <div className="media-topbar">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="media-label">Live Camera</span>
            </div>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="camera-feed"
            />
          </div>
          <div className="media-hint">
            The preview stays local until you verify.
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <div className="feature-card">
          <h3>Real-time Detection</h3>
          <p>Instantly match faces and log attendance.</p>
        </div>
        <div className="feature-card">
          <h3>Roll Number Mapping</h3>
          <p>Pair ID cards to face profiles with QR.</p>
        </div>
        <div className="feature-card">
          <h3>Crowd Insights</h3>
          <p>Count and visualize people in the frame.</p>
        </div>
        <div className="feature-card">
          <h3>Secure by Design</h3>
          <p>Controlled access for admins and users.</p>
        </div>
      </section>

      <section className="flow-section">
        <div className="flow-header">
          <h2>How Face Recognition Works</h2>
          <p>
            Follow a guided flow that pairs your roll number, live capture, and
            instant verification.
          </p>
        </div>
        <div className="flow-grid">
          <div className="flow-step">
            <span className="step-index">01</span>
            <h3>Capture</h3>
            <p>Use the live camera to take a crisp, front-facing snapshot.</p>
          </div>
          <div className="flow-step">
            <span className="step-index">02</span>
            <h3>Match</h3>
            <p>Your face is compared against the enrolled profile securely.</p>
          </div>
          <div className="flow-step">
            <span className="step-index">03</span>
            <h3>Confirm</h3>
            <p>Attendance is logged and your session unlocks instantly.</p>
          </div>
        </div>
        <div className="flow-faq">
          <details>
            <summary>What happens to my photo?</summary>
            <p>
              The image is used for verification and not stored in the browser
              after the check completes.
            </p>
          </details>
          <details>
            <summary>Why use QR codes?</summary>
            <p>
              QR pairing links your ID card to the right profile before facial
              matching begins.
            </p>
          </details>
          <details>
            <summary>How accurate is recognition?</summary>
            <p>
              The system uses a campus-trained model to keep accuracy and speed
              high in real-world lighting.
            </p>
          </details>
        </div>
      </section>

      <section className="about-section">
        <div className="about-text">
          <h2>Efficient Attendance Tracking</h2>
          <p>
            Replace manual roll calls with an AI-powered workflow that keeps
            accuracy high and admin workload low. Designed for classrooms, labs,
            and campus events.
          </p>
          <div className="about-stats">
            <div>
              <span className="stat-number">5x</span>
              <span className="stat-label">Faster check-ins</span>
            </div>
            <div>
              <span className="stat-number">99%</span>
              <span className="stat-label">Recognition precision</span>
            </div>
          </div>
        </div>
        <div className="about-visual">
          <div className="visual-card">
            <div className="visual-header">Attendance Console</div>
            <div className="visual-body">
              <div className="visual-row">
                <span className="visual-pill" />
                <span className="visual-bar" />
              </div>
              <div className="visual-row">
                <span className="visual-pill" />
                <span className="visual-bar" />
              </div>
              <div className="visual-row">
                <span className="visual-pill" />
                <span className="visual-bar" />
              </div>
              <div className="visual-chart" />
            </div>
          </div>
        </div>
      </section>

      {showQrScanner && (
        <div className="qr-overlay">
          <div className="qr-modal">
            <button
              className="qr-close"
              onClick={() => setShowQrScanner(false)}
              aria-label="Close scanner"
            >
              &times;
            </button>
            <h4 className="text-center">Scan QR Code</h4>
            <QrScanner
              delay={200}
              style={previewStyle}
              onError={handleError}
              onScan={handleScan}
            />
            {error && <p className="text-danger mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
