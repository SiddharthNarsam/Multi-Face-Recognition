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
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install flask flask-cors flask-pymongo mtcnn keras-facenet ultralytics tensorflow scikit-learn opencv-python numpy
```

Configure MongoDB in `app.py` by setting `app.config["MONGO_URI"]` to your URI.
If you want to keep secrets out of code, move this value to an environment
variable and load it before starting the app.

Start the API:

```powershell
$env:FLASK_APP="app.py"
flask run --host 0.0.0.0 --port 5000
```

Note: `app.py` expects a YOLO weights filename of `yolov5s.pt`. Either rename
`yolov5su.pt` or update the path in `app.py` to match your file.

### Frontend (React)

Set the API base URL in `.env`:

```
REACT_APP_API_URL=http://localhost:5000
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
