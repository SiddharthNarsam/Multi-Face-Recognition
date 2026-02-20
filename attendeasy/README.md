# Attendeasy - Face Recognition Attendance

Attendeasy is a full-stack face recognition attendance system. The Flask API handles
face registration, recognition, and attendance logging. The React UI provides
signup, login, attendance views, and a crowd-counting screen.

## Features

- Face registration with multiple images and embedding storage
- Login via FaceNet or a lightweight CNN embedding
- Multi-face recognition and attendance logging
- Crowd counting with YOLO
- User detail and attendance lookup

## Tech Stack

- Backend: Flask, OpenCV, MTCNN, FaceNet, TensorFlow/Keras, Ultralytics YOLO, MongoDB
- Frontend: React, React Router, Axios, Bootstrap

## Project Layout

- `app.py` Flask API (main backend)
- `new.py` older backend entry point (includes `app.run`)
- `src/` React app
- `public/` React public assets
- `yolov5su.pt` YOLO weights file

## Setup

### Prereqs

- Python 3.9+
- Node.js 18+
- MongoDB (local or Atlas)

### Backend (Flask)

Create a virtual environment and install dependencies:

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Copy the environment example and configure your MongoDB URI:

```powershell
copy .env.example .env
```

Edit `.env` and set your `MONGO_URI` (local MongoDB or Atlas).

Start the API:

```powershell
python app.py
```

Note: `yolov5su.pt` must be present in the `Backend/` folder (it is included in the repo).

### Frontend (React)

Copy the environment example and set the backend URL:

```powershell
copy .env.example .env
```

The `.env` file should contain:

```
REACT_APP_LOCAL_HOST_API_URL=http://localhost:5000
```

Install and run:

```powershell
npm install
npm start
```

## API Endpoints (selected)

- `POST /register` register a user with 5 images
- `POST /login` login via FaceNet embeddings
- `POST /CNN-login` login via CNN embeddings
- `POST /recognize` multi-face recognition + attendance logging
- `POST /user_recognize` multi-face recognition (no logging)
- `POST /crowd` crowd count + annotated image
- `GET /get_users` list registered users
- `GET /users/<username>/images` get user details + stored image
- `GET /user_attendance/<username>` get attendance for user
- `GET /attendance` get attendance records for all users

## Notes

- The backend downloads ML weights on first run if missing (internet required).
- For best recognition, use well-lit, front-facing images.
