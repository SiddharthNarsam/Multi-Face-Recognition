# Multi-Face Recognition And Crowd Analysis System — Using Deep Learning

> Built with a **custom CNN model designed and trained from scratch** for face embedding generation, alongside FaceNet and YOLOv5 for a complete deep learning pipeline.

A full-stack attendance system that uses face recognition to identify students and log their attendance automatically. Built with a React frontend and a Flask + MongoDB backend.

---

## What It Does

Students register once with 5 photos. After that, they can log in by simply showing their face to the webcam — no passwords. The system matches their face against stored embeddings, logs attendance for that day, and routes them to their personal dashboard.

Admins get a richer dashboard: run live multi-face recognition across a group, view and manage all registered users, assign/revoke admin roles, and see the full attendance sheet.

---

## Features

| Feature | Details |
|---------|---------|
| **Face Registration** | Registers a user using 5 webcam photos; stores both FaceNet and CNN embeddings in MongoDB |
| **FaceNet Login** | MTCNN face detection + FaceNet embeddings + cosine similarity (threshold: 0.7) |
| **CNN Login** | Lightweight custom CNN + Haar Cascade detection + cosine similarity (threshold: 0.94) |
| **QR Code Login** | Scan a QR code to pre-fill roll number, then verify face |
| **Auto Attendance** | Attendance is marked in MongoDB automatically on successful login or recognition |
| **Multi-face Recognition** | Admin can scan a group photo/webcam frame and mark multiple people present at once |
| **Crowd Counting** | Upload or capture an image — YOLOv5 detects and counts people, returns annotated image |
| **User Dashboard** | Shows stored profile image and personal attendance calendar |
| **Admin Dashboard** | Live recognition feed, registered user list, role management, full attendance table |
| **Role-Based Access** | Two roles: `admin` and `user`. Admins can promote/demote users. Last admin is protected from deletion |
| **Session Management** | Auto-logout after 1 hour of inactivity using `localStorage` + `setTimeout` |

---

## Tech Stack

### Backend
| Library | Purpose |
|---------|---------|
| Python 3.11 | Runtime |
| Flask | REST API server |
| Flask-PyMongo | MongoDB integration |
| OpenCV (`opencv-python-headless`) | Image processing, Haar Cascade face detection |
| MTCNN | Deep learning face detector (used for FaceNet pipeline) |
| `keras-facenet` | FaceNet model for generating 512-d face embeddings |
| TensorFlow 2.13 / Keras | Custom CNN embedding model |
| Ultralytics YOLOv5 (`yolov5su.pt`) | Crowd / people detection |
| scikit-learn | Cosine similarity comparisons |
| MongoDB | Stores user data, embeddings, and attendance records |

### Frontend
| Library | Purpose |
|---------|---------|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Axios | HTTP requests to Flask API |
| Bootstrap 5 | Styling |
| `react-webcam` | Webcam capture |
| `react-qr-scanner` | QR code scanning for roll number input |

---

## Project Structure

```
Face Recognition/
├── Backend/                  # Flask API
│   ├── app.py                # Main application — all routes and logic
│   ├── requirements.txt      # Python dependencies
│   ├── yolov5su.pt           # YOLOv5 model weights (included)
│   ├── .env.example          # Environment variable template
│   └── README.md             # Backend-specific setup guide
│
└── attendeasy/               # React frontend
    ├── src/
    │   ├── App.js            # Routes, auth state, session management, navbar
    │   ├── utils/config.js   # API base URL config (reads from .env)
    │   └── components/
    │       ├── Login/        # Webcam login + QR scan
    │       ├── Register/     # 5-photo registration form
    │       ├── Home/         # Admin dashboard (recognition, users, attendance)
    │       ├── User/         # User dashboard (profile + personal attendance)
    │       ├── Attendance/   # Full attendance table (admin)
    │       ├── CNN/          # CNN-based login page
    │       ├── Crowd/        # Crowd counting page
    │       ├── DisplayImages/# View registered user images
    │       ├── QrCodeScanner/# Standalone QR scanner
    │       └── ProtectedRoute/ # Auth guard component
    ├── .env.example          # Environment variable template
    └── README.md             # Frontend-specific setup guide
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Register a new user with 5 images |
| `POST` | `/login` | FaceNet face login + attendance |
| `POST` | `/CNN-login` | CNN face login + attendance |
| `POST` | `/recognize` | Multi-face recognition + attendance (admin) |
| `POST` | `/user_recognize` | Multi-face recognition, no attendance logging |
| `POST` | `/crowd` | People count + annotated image via YOLOv5 |
| `GET` | `/get_users` | List all registered users |
| `GET` | `/users/<rollnumber>/images` | Get user profile details + stored image |
| `GET` | `/attendance` | Full attendance records (all users) |
| `GET` | `/user_attendance/<rollnumber>` | Attendance for a specific user |
| `PATCH` | `/users/<rollnumber>/role` | Update a user's role (admin/user) |
| `DELETE` | `/users/<rollnumber>` | Delete a user |

---

## Quick Start

### Prerequisites
- Python **3.11** (TensorFlow 2.13 does not support 3.12+)
- Node.js **18+**
- MongoDB running locally **or** a MongoDB Atlas URI

---

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd "Face Recognition"
```

---

### 2. Backend Setup

```bash
cd Backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows CMD/PowerShell

# Upgrade pip tools first (prevents ML install errors)
python -m pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env — set MONGO_URI to your MongoDB connection string

# Run the server
python app.py
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd attendeasy

# Configure environment
copy .env.example .env
# .env should contain:
# REACT_APP_LOCAL_HOST_API_URL=http://localhost:5000

# Install dependencies and run
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## MongoDB Collections

| Collection | Contents |
|------------|----------|
| `data` | User profiles: roll number, name, father name, phone, role, FaceNet embeddings, CNN embeddings, stored image |
| `attendance1` | Attendance records: `username` (roll number) + one field per date (`YYYY-MM-DD: true`) |

---

## How Recognition Works

```
Webcam frame
    │
    ├─ MTCNN detects face
    │       └─ FaceNet generates 512-d embedding
    │               └─ Cosine similarity vs all stored embeddings
    │                       └─ Match > 0.7 → recognized
    │
    └─ Haar Cascade detects face (CNN path)
            └─ Custom CNN generates 512-d embedding
                    └─ Cosine similarity vs stored CNN embedding
                            └─ Match > 0.94 → recognized
```

---

## Notes

- The first user whose roll number matches `DEFAULT_ADMIN_ROLLNUMBER` (set in `.env`) is automatically assigned the `admin` role
- `cnn_model.weights.h5` is generated after the first registration and is gitignored — it does not need to be committed
- The system prevents deleting or demoting the last remaining admin
- All face processing happens server-side; the frontend only sends raw images
