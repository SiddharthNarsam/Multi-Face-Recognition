# Face Recognition Backend — Setup Guide (Windows / Python 3.11)

This project uses a **Python virtual environment** to keep dependencies isolated and stable. Follow the steps below to set up the backend correctly.

---

## 1. Install Python 3.11

Download and install Python 3.11 from:

[https://www.python.org/downloads/release/python-3119/](https://www.python.org/downloads/release/python-3119/)

During installation:

* ✅ Check **Add Python to PATH**

Verify installation:

```bash
python --version
```

You should see:

```
Python 3.11.x
```

---

## 2. Create Virtual Environment

Navigate to the backend directory:

```bash
cd Backend
```

Create a virtual environment using Python 3.11:

```bash
python -m venv venv
```

Activate the environment:

**Windows (CMD / PowerShell):**

```bash
venv\Scripts\activate
```

You should now see:

```
(venv)
```

---

## 3. Upgrade Pip Tools (Important)

Upgrade pip, setuptools, and wheel to ensure precompiled ML libraries install correctly:

```bash
python -m pip install --upgrade pip setuptools wheel
```

This prevents build errors with packages like TensorFlow, scikit-learn, and OpenCV.

---

## 4. Install Project Dependencies

Install all required packages from `requirements.txt`:

```bash
python -m pip install -r requirements.txt
```

---

## 5. Verify Installation

Run this command to confirm core modules are working:

```bash
python -c "import tensorflow, mtcnn, cv2, flask, sklearn; print('All core modules OK')"
```

If successful, you should see:

```
All core modules OK
```

---

## 6. Run the Application

Start the backend server:

```bash
python app.py
```

---

## Notes

* Recommended Python version: **3.11**
* Always activate the virtual environment before installing packages or running the app
* Use this command for installing any new packages:

```bash
python -m pip install <package-name>
```

---

## Troubleshooting

If you encounter installation issues:

```bash
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
```

If TensorFlow or scikit-learn fails to install, confirm:

```bash
python --version
```

It must be **Python 3.8–3.11** (Python 3.12 is not supported by TensorFlow 2.13).

---

## Environment Deactivation

To exit the virtual environment:

```bash
deactivate
```

---

This setup ensures a stable, reproducible backend environment for Face Recognition and ML-based services.
