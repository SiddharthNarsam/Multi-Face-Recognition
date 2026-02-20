import React, { useState } from "react";
import axios from "axios";
import { config } from "../../utils/config";
import "./DisplayImages.css";

const DisplayImages = () => {
  const [username, setUsername] = useState(""); // State for the input username
  const [storedImage, setStoredImage] = useState(null); // To hold the user's stored image
  const [error, setError] = useState(null); // To hold error messages
  const [data, setdata] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchStoredImage = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(null); // Clear any previous errors
    setStoredImage(null); // Clear previous stored image
    setIsLoading(true);

    try {
      const response = await axios.get(
        `${config.API_URL}/users/${username}/images`,
      );
      const details = response.data["details"];
      console.log(details);
      setdata(details);
      const stored_image = details["stored_image"];
      // Get the stored image from the response
      setStoredImage(stored_image); // Set the stored image
    } catch (error) {
      console.error("Failed to fetch stored image:", error);
      setError("Failed to fetch stored image. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="display-page">
      <section className="display-hero">
        <div className="display-hero-text">
          <span className="display-pill">User profile lookup</span>
          <h1>Display user details</h1>
          <p>
            Search by roll number or username to fetch the stored profile image
            and enrollment details.
          </p>
          <form className="display-form" onSubmit={fetchStoredImage}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter roll number or username"
              aria-label="Enter roll number or username"
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Fetching..." : "Fetch profile"}
            </button>
          </form>
          {error && <p className="display-error">{error}</p>}
          <div className="display-tips">
            <div>
              <h4>Quick tip</h4>
              <p>Use the exact roll number format for faster lookup.</p>
            </div>
            <div>
              <h4>Privacy first</h4>
              <p>Only authorized staff should access user profiles.</p>
            </div>
          </div>
        </div>
        <div className="display-hero-panel">
          <div className="profile-card">
            <div className="profile-image">
              {storedImage ? (
                <img
                  src={`data:image/jpeg;base64,${storedImage}`}
                  alt="Stored user"
                />
              ) : (
                <div className="profile-placeholder">
                  {isLoading ? "Loading image..." : "No image loaded"}
                </div>
              )}
            </div>
            <div className="profile-details">
              <span className="detail-label">Roll Number</span>
              <span className="detail-value">{data["RollNumber"] || "--"}</span>
              <span className="detail-label">Name</span>
              <span className="detail-value">{data["username"] || "--"}</span>
              <span className="detail-label">Father Name</span>
              <span className="detail-value">{data["FatherName"] || "--"}</span>
            </div>
          </div>
          <div className="info-card">
            <h3>What you can do here</h3>
            <ul>
              <li>Verify the enrolled image for accuracy.</li>
              <li>Cross-check roll numbers with names.</li>
              <li>Ensure profile data stays updated.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="display-grid">
        <div className="display-card">
          <h3>Profile summary</h3>
          <p>Review the fetched details at a glance.</p>
          <div className="summary-grid">
            <div>
              <span className="detail-label">Status</span>
              <span className="detail-value">
                {storedImage ? "Profile found" : "Awaiting search"}
              </span>
            </div>
            <div>
              <span className="detail-label">Image quality</span>
              <span className="detail-value">
                {storedImage ? "Good" : "--"}
              </span>
            </div>
            <div>
              <span className="detail-label">Last action</span>
              <span className="detail-value">
                {isLoading ? "Fetching profile" : "Ready"}
              </span>
            </div>
          </div>
        </div>

        <div className="display-card">
          <h3>Verification checklist</h3>
          <p>Confirm each field before continuing.</p>
          <div className="checklist">
            <label>
              <input type="checkbox" />
              Face matches the enrolled image
            </label>
            <label>
              <input type="checkbox" />
              Roll number is correct
            </label>
            <label>
              <input type="checkbox" />
              Name matches campus records
            </label>
          </div>
        </div>

        <div className="display-card accent">
          <h3>Need to update a profile?</h3>
          <p>
            Have the student re-register to refresh the stored image and profile
            details.
          </p>
          <details>
            <summary>When should I re-register?</summary>
            <p>
              If the appearance changes significantly or image quality is poor,
              a new enrollment improves recognition accuracy.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
};

export default DisplayImages;
