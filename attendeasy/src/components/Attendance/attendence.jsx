import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { config } from "../../utils/config";
import "./attendence.css";

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [users, setUsers] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Fetch attendance data from the API
    const fetchAttendance = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/attendance`);
        const records = response.data["attendance"];
        // Extract unique users and dates
        const userMap = new Map(); // To store unique users by ID
        const dateSet = new Set();

        records.forEach((record) => {
          userMap.set(record.id, record.username); // Store users by ID
          Object.keys(record).forEach((key) => {
            if (key !== "id" && key !== "username" && key !== "prototype") {
              dateSet.add(key); // Collect unique dates
            }
          });
        });

        setUsers(
          [...userMap.entries()].map(([id, username]) => ({ id, username })),
        );
        setDates([...dateSet].sort()); // Sort dates
        setAttendanceData(records);
        setLoading(false);
      } catch (err) {
        setError("Error fetching attendance data.");
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const summary = useMemo(() => {
    const totalUsers = users.length;
    const totalDays = dates.length;
    let totalPresent = 0;
    let totalRecords = 0;

    users.forEach((user) => {
      const record = attendanceData.find((item) => item.id === user.id);
      if (!record) {
        return;
      }
      dates.forEach((date) => {
        if (record[date] !== undefined) {
          totalRecords += 1;
          if (record[date]) {
            totalPresent += 1;
          }
        }
      });
    });

    const attendanceRate =
      totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    return { totalUsers, totalDays, totalPresent, attendanceRate };
  }, [attendanceData, users, dates]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) {
      return users;
    }
    const term = search.toLowerCase();
    return users.filter(
      (user) =>
        `${user.id}`.toLowerCase().includes(term) ||
        (user.username || "").toLowerCase().includes(term),
    );
  }, [search, users]);

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-loading">Loading attendance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-page">
        <div className="attendance-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <section className="attendance-hero">
        <div className="attendance-hero-text">
          <span className="attendance-pill">Attendance analytics</span>
          <h1>Attendance records</h1>
          <p>
            Track daily presence, review attendance trends, and keep the roster
            synchronized across sessions.
          </p>
          <div className="attendance-stats">
            <div className="stat-card">
              <span className="stat-label">Total users</span>
              <span className="stat-value">{summary.totalUsers}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Tracked days</span>
              <span className="stat-value">{summary.totalDays}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total present</span>
              <span className="stat-value">{summary.totalPresent}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Attendance rate</span>
              <span className="stat-value">{summary.attendanceRate}%</span>
            </div>
          </div>
        </div>
        <div className="attendance-hero-panel">
          <div className="insight-card">
            <h3>Tips for accuracy</h3>
            <ul>
              <li>Verify images are captured in good lighting.</li>
              <li>Use consistent roll numbers for records.</li>
              <li>Review absences after each session.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="attendance-table-section">
        <div className="table-header">
          <div>
            <h2>Daily logs</h2>
            <p>Search by roll number or username to filter rows.</p>
          </div>
          <input
            type="text"
            placeholder="Search user"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search user"
          />
        </div>

        <div className="attendance-table">
          <div className="table-row table-head">
            <span>User ID</span>
            <span>Username</span>
            {dates.map((date) => (
              <span key={date}>{date}</span>
            ))}
          </div>
          {filteredUsers.length === 0 && (
            <div className="table-empty">No matching users found.</div>
          )}
          {filteredUsers.map((user) => {
            const attendanceRecord = attendanceData.find(
              (record) => record.id === user.id,
            );
            return (
              <div className="table-row" key={user.id}>
                <span>{user.id}</span>
                <span>{user.username}</span>
                {dates.map((date) => {
                  const isPresent = attendanceRecord && attendanceRecord[date];
                  return (
                    <span
                      key={date}
                      className={`status-pill ${
                        isPresent ? "present" : "absent"
                      }`}
                    >
                      {isPresent ? "Present" : "Absent"}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Attendance;
