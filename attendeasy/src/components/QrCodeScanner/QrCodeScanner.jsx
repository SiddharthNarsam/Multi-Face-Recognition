import React, { useState } from "react";
import QrScanner from "react-qr-scanner";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

const QrCodeScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleScan = (data) => {
    if (data) {
      const rollnumber = data.text.split(",");
      console.log(rollnumber);
      //console.log(id, firstName, fullName, branch, phoneNumber);
      setScanResult(data.text); // Get decoded QR code text
      setError("");
      navigate("/login", {
        state: { rollnumber: rollnumber[0] },
      });
    }
  };

  const handleError = (err) => {
    setError("Error accessing the camera or scanning QR code.");
    console.error(err);
  };

  // Adjust the preview style to improve scanner visibility and sharpness
  const previewStyle = {
    height: "500px", // Increase the height for better visibility
    width: "100%", // Ensure the video feed takes up the full width
    maxWidth: "600px", // Limit the width for better UI control
    objectFit: "cover", // Ensure the video scales appropriately without distortion
  };

  return (
    <div className="container vh-120 d-flex flex-column justify-content-center align-items-center bg-light">
      <h1 className="text-center mb-4">QR Code Scanner</h1>
      <h4>please place the ID card to scan qr code to proceed to login</h4>

      <div className="card shadow p-3 mb-4 w-100" style={{ maxWidth: "600px" }}>
        <div className="card-body">
          <QrScanner
            delay={200} // Decrease delay for faster scanning
            style={previewStyle} // Apply the modified styling
            onError={handleError}
            onScan={handleScan}
            // You can experiment with these options for better performance:
            facingMode="environment" // Use the rear camera for better quality
            // onCameraError={(err) => console.error("Camera Error:", err)} // Optional: Handle camera error
          />
        </div>
      </div>

      {scanResult && (
        <div
          className="alert alert-success text-center w-100"
          style={{ maxWidth: "600px" }}
        >
          <h4>Decoded QR Code:</h4>
          <p>{scanResult}</p>
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger text-center w-100"
          style={{ maxWidth: "600px" }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default QrCodeScanner;
