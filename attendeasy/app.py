import base64
import os
import tempfile

# Use temporary directory or current working directory for app data
# This avoids permission issues in containerized environments
# Check if running in container with pre-created directories
if os.path.exists('/tmp/app_data') and os.access('/tmp/app_data', os.W_OK):
    app_data_path = '/tmp/app_data'
    print("Using pre-created /tmp/app_data directory")
else:
    try:
        # Try to use /tmp first (usually writable in containers)
        app_data_path = '/tmp/app_data'
        os.makedirs(app_data_path, exist_ok=True)
    except PermissionError:
        # Fallback to current directory or temp directory
        app_data_path = os.path.join(os.getcwd(), 'app_data')
        try:
            os.makedirs(app_data_path, exist_ok=True)
        except PermissionError:
            # Last resort: use system temp directory
            app_data_path = tempfile.mkdtemp(prefix='app_data_')

# Make sure the necessary directories exist and have proper permissions
try:
    os.makedirs(f'{app_data_path}/ultralytics', exist_ok=True)
    os.makedirs(f'{app_data_path}/.keras', exist_ok=True)
    
    # Set environment variables for the respective paths
    os.environ['ULTRALYTICS_CONFIG_DIR'] = f'{app_data_path}/ultralytics'
    os.environ['KERAS_HOME'] = f'{app_data_path}/.keras'
    
    print(f"Successfully created app data directory at: {app_data_path}")
except PermissionError as e:
    print(f"Warning: Could not create app data directories: {e}")
    # Set environment variables to current directory as fallback
    os.environ['ULTRALYTICS_CONFIG_DIR'] = os.getcwd()
    os.environ['KERAS_HOME'] = os.getcwd()

import cv2
import numpy as np
from flask import Flask, request, jsonify
from mtcnn.mtcnn import MTCNN
from keras_facenet import FaceNet
from sklearn.metrics.pairwise import cosine_similarity
from flask_cors import CORS
from flask_pymongo import PyMongo
from ultralytics import YOLO
from bson.objectid import ObjectId  # Import ObjectId for MongoDB
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
from sklearn.preprocessing import LabelEncoder
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Role management settings
DEFAULT_ROLE = "user"
ALLOWED_ROLES = {"user", "admin"}
DEFAULT_ADMIN_ROLLNUMBER = os.getenv("DEFAULT_ADMIN_ROLLNUMBER", "23BD1A056D").upper()

# Initialize MTCNN detector and FaceNet model
detector = MTCNN()
embedder = FaceNet()

# Configure MongoDB
# The URI includes the database name 'travis_db' directly in the path.
# This is the recommended way to specify the database.
app.config["MONGO_URI"] = "mongodb+srv://nanduvinay719:76qqKRX4zC97yQun@travis.744fuyn.mongodb.net/travis_db?retryWrites=true&w=majority&appName=travis" 
mongo = PyMongo(app)#initialize
haar_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def normalize_role(role_value, rollnumber=None):
    # Handle case where role_value might be an object or unexpected type
    if role_value is None:
        role = ""
    elif isinstance(role_value, dict):
        # If role is stored as a dict/object in MongoDB, extract the value
        print(f"WARNING: Role is a dict: {role_value}")
        role = str(role_value.get("role", "") or role_value.get("_value", "") or "").strip().lower()
    elif isinstance(role_value, str):
        role = role_value.strip().lower()
    else:
        # Convert any other type to string
        print(f"WARNING: Role is unexpected type {type(role_value)}: {role_value}")
        role = str(role_value).strip().lower()
    
    if role in ALLOWED_ROLES:
        return role
    if rollnumber and str(rollnumber).upper() == DEFAULT_ADMIN_ROLLNUMBER:
        return "admin"
    return DEFAULT_ROLE

def count_admins():
    users = mongo.db.data.find({}, {"role": 1, "RollNumber": 1})
    return sum(
        1
        for user in users
        if normalize_role(user.get("role"), user.get("RollNumber")) == "admin"
    )

def create_cnn_embedding_model():
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=(160, 160, 1)),
        MaxPooling2D(2, 2),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D(2, 2),
        Flatten(),
        Dense(512, activation='relu'),
        Dense(512, activation='linear')  # Final dense layer to produce a 512-dimensional embedding
    ])
    return model

cnn_model = create_cnn_embedding_model()
cnn_model.compile(optimizer='adam', loss='mse') 
# Using MSE loss as we are not training for classification

def cosine(embedding1, embedding2):
    dot_product = np.dot(embedding1, embedding2)
    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)
    similarity = dot_product / (norm1 * norm2)
    return similarity

@app.route('/CNN-login', methods=['POST'])
def cnnlogin():
    # Check for uploaded image
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files['image']
    rollnumber = request.form['rollnumber']
    rollnumber = rollnumber.upper()

    if not rollnumber:
        return jsonify({"error": "Roll number is required"}), 400

    # Fetch user data from MongoDB
    # Collection name 'data' is already correctly used here
    user_data = mongo.db.data.find_one(
        {"RollNumber": rollnumber},
        {"CNN_embeddings": 1, "username": 1, "role": 1, "RollNumber": 1},
    )
    if user_data is None:
        return jsonify({"error": "User not found"}), 404
    stored_cnn_embedding = np.array(user_data["CNN_embeddings"])# Convert stored embeddings to NumPy array
    username = user_data["username"]
    role = normalize_role(user_data.get("role"), user_data.get("RollNumber", rollnumber))
    print(username)
    # Decode image
    image_data = file.read()
    image_array = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        return jsonify({"error": "Invalid image"}), 400
    # Initialize Haar Cascade

    # Detect the face using Haar Cascade
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = haar_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
    if len(faces) == 0:
        return jsonify({"error": "No face detected"}), 400

    # Process the first detected face
    x, y, w, h = faces[0]
    cropped_face = cv2.resize(image[y:y+h, x:x+w], (160, 160))

    # Preprocess face for CNN model
    gray_face = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2GRAY).reshape(160, 160, 1)
    normalized_face = np.expand_dims(gray_face, axis=-1)
    normalized_face = np.expand_dims(normalized_face, axis=0)
    normalized_face = normalized_face / 255.0  # Normalize pixel values to [0, 1]
    # Generate embedding using the CNN model
    cnn_embedding = cnn_model.predict(normalized_face)[0]
    print("CNN shape: ",cnn_embedding.shape,"Stored shape: ",stored_cnn_embedding.shape)
    # Compare the embedding with stored embeddings
    similarity = cosine(cnn_embedding, stored_cnn_embedding)
    print(f"Similarity: {similarity}")

    # Set a threshold for recognition
    recognition_threshold = 0.94  # Adjust this threshold as needed
    if similarity > recognition_threshold:
        return jsonify(
            {"name": username, "probability": float(similarity), "role": role}
        ), 200
    else:
        return jsonify({"error": "Face not recognized", "probability": float(similarity)}), 401

@app.route('/login', methods=['POST'])
def recognizeLogin():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files['image']
    
    # Validate rollnumber
    if "rollnumber" not in request.form or not request.form["rollnumber"].strip():
        return jsonify({"error": "Roll number is required"}), 400
    
    name = request.form["rollnumber"].strip().upper()
    
    # Read and decode image
    image_data = file.read()
    if not image_data:
        return jsonify({"error": "Empty image file"}), 400
        
    image_array = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)   
    
    if image is None:
        return jsonify({"error": "Invalid image format. Please try capturing again."}), 400
    
    # Check if any users are registered
    if len(face_data) == 0:
        return jsonify({"error": "No registered users found. Please register first."}), 400
    
    results = recognize_faces_in_image(image)
    print(f"Recognition results: {results}")
    
    if not results or len(results) == 0:
        return jsonify({"error": "No faces detected in the image. Please ensure your face is clearly visible."}), 400
    if (results[0]['name']==name):
        print("done")
        today = datetime.now().strftime("%Y-%m-%d")
        # Collection name 'attendance1' is already correctly used here
        mongo.db.attendance1.update_one(
                {'username': results[0]['name']},
                {'$set': {today: True}},  # Mark as present for today
                upsert=True
            )
        user_data = mongo.db.data.find_one(
            {"RollNumber": name},
            {"role": 1, "RollNumber": 1},
        )
        print(f"DEBUG - User data from DB: {user_data}")
        print(f"DEBUG - Role from DB: {user_data.get('role') if user_data else None}")
        
        role = normalize_role(
            user_data.get("role") if user_data else None,
            user_data.get("RollNumber") if user_data else name,
        )
        print(f"DEBUG - Normalized role: {role}")
        print(f"DEBUG - Role type: {type(role)}")
        
        # Ensure role is a string
        role_str = str(role) if role is not None else "user"
        
        return jsonify(
            {
                "name": name,
                "probability": results[0]["probability"],
                "role": role_str,
            }
        ), 200
    else:
        # Face detected but doesn't match the roll number
        detected_name = results[0]['name']
        if detected_name == "Unknown":
            return jsonify({"error": "Face not recognized. Please register first or try again."}), 400
        else:
            return jsonify({"error": f"Face detected belongs to {detected_name}, but you entered {name}. Please verify your roll number."}), 400

@app.route('/register', methods=['POST'])
def register():
    rollnumber = request.form["RollNumber"].upper()
    username = request.form['Username']
    fathername = request.form["FatherName"]
    phoneno = request.form["phoneNumber"]
    facenet_embeddings, cnn_embeddings = [], []
    stored_image = None  # To store the first grayscale image

    print(username)
    # Check if user already exists
    # Collection name 'data' is already correctly used here
    existing_user = mongo.db.data.find_one(
        {"$or": [{"username": username}, {"RollNumber": rollnumber}]},
        {"_id": 0},
    )
    if existing_user:
        return jsonify({"error": f"User '{username}' already exists"}), 400

    # Process uploaded images
    for i in range(5):  # Expecting 5 images
        try:
            image_file = request.files[f'image{i}']
        except KeyError:
            return jsonify({"error": f"Missing image{i} in the request"}), 400

        image_data = image_file.read()
        image_array = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        # Face detection using MTCNN for FaceNet
        mtcnn_faces = detector.detect_faces(image)
        if mtcnn_faces:
            # Get the first detected face for FaceNet embedding
            x, y, w, h = mtcnn_faces[0]['box']
            x, y = max(0, x), max(0, y)
            cropped_face = cv2.resize(image[y:y+h, x:x+w], (160, 160))
            rgb_face = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2RGB)

            # Get FaceNet embedding
            facenet_embedding = embedder.embeddings(np.expand_dims(rgb_face, axis=0)).flatten()
            facenet_embeddings.append(facenet_embedding)
        # Face detection using Haar Cascade for CNN
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        haar_faces = haar_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
        if len(haar_faces) > 0:
            x, y, w, h = haar_faces[0]
            cropped_face = cv2.resize(image[y:y+h, x:x+w], (160, 160))
            gray_face = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2GRAY).reshape(160, 160, 1)
            normalized_face=np.expand_dims(gray_face, axis=-1) #dimnesion
            normalized_face=np.expand_dims(normalized_face, axis=0) #batch
            normalized_face = normalized_face / 255.0 #0-1
            # Get CNN embedding
            cnn_embedding = cnn_model.predict(normalized_face)[0]
            cnn_embeddings.append(cnn_embedding)
            # Save the first grayscale face as base64
            if stored_image is None:
                _, buffer = cv2.imencode('.jpg', cv2.cvtColor(cropped_face, cv2.COLOR_BGR2GRAY))
                stored_image = base64.b64encode(buffer).decode('utf-8')

    if not facenet_embeddings or not cnn_embeddings:
        return jsonify({"error": "No valid faces detected in the uploaded images"}), 400

    # Calculate mean embeddings
    mean_facenet_embedding = np.mean(facenet_embeddings, axis=0).astype(float).tolist()
    mean_cnn_embedding = np.mean(cnn_embeddings, axis=0).astype(float).tolist()
    
    # Save model weights with error handling
    try:
        weights_path = os.path.join(app_data_path, 'cnn_model.weights.h5')
        cnn_model.save_weights(weights_path)
    except Exception as e:
        print(f"Warning: Could not save model weights: {e}")
        # Try saving in current directory
        try:
            cnn_model.save_weights('cnn_model.weights.h5')
        except Exception as e2:
            print(f"Warning: Could not save model weights in current directory: {e2}")
    
    # Create user data
    # Collection name 'data' is already correctly used here
    id = mongo.db.data.count_documents({}) + 1
    user_data = {
        'RollNumber': rollnumber,
        'username': username,
        'FatherName': fathername,
        'phoneNumber': phoneno,
        'role': DEFAULT_ROLE,
        'embeddings': mean_facenet_embedding,
        'CNN_embeddings': mean_cnn_embedding,
        'stored_image': stored_image,
        'id': id
    }

    # Insert into MongoDB
    mongo.db.data.insert_one(user_data)
    # Collection name 'attendance1' is already correctly used here
    mongo.db.attendance1.insert_one({"username": rollnumber, "id": id})
    # Reload embeddings
    reload_embeddings()

    return jsonify({"message": "User registered successfully!"}), 201

# Load embeddings from MongoDB for recognition
@app.route('/get_users', methods=['GET'])
def get_users():
    # Collection name 'data' is already correctly used here
    users = list(
        mongo.db.data.find({}, {"id": 1, "username": 1, "RollNumber": 1, "role": 1})
    )
    user_count = len(users)
    formatted_users = []
    for user in users:
        roll = user.get("RollNumber", "")
        username = user.get("username", "")
        role = normalize_role(user.get("role"), roll)
        
        # Ensure all values are strings, not objects
        formatted_users.append(
            {
                "rollNumber": str(roll) if roll else "",
                "username": str(username) if username else "",
                "role": str(role) if role else "user",
            }
        )
    return jsonify({"users": formatted_users, "count": user_count})

def load_embeddings_from_db():
    if mongo is None:
        print("MongoDB not connected - returning empty embeddings")
        return [], [], {}, {}
    
    try:
        users = list(mongo.db.data.find())
        face_data = []# facenet embeddings
        labels = [] # id 1,2,3,..
        names = {} #dict of id and roll number
        roles = {}
        # {"1":vinay,"2":shahank}
        for user in users:
            face_data.append(user["embeddings"])
            labels.append(user['id'])  # Keep the ObjectId
            names[user['id']] = user['RollNumber']  # Use ObjectId as key
            roles[user['id']] = normalize_role(user.get("role"), user.get("RollNumber"))

        print(f"Loaded {len(face_data)} user embeddings from database")
        return (face_data, labels, names, roles) if face_data else ([], [], {}, {})
    except Exception as e:
        print(f"Error loading embeddings from database: {e}")
        return [], [], {}, {}

# Load face embeddings from MongoDB initially
face_data, labels, names, roles = load_embeddings_from_db()

# Load CNN model weights with error handling
try:
    weights_path = os.path.join(app_data_path, 'cnn_model.weights.h5')
    if os.path.exists(weights_path):
        cnn_model.load_weights(weights_path)
        print("Loaded CNN model weights from app_data directory")
    elif os.path.exists('cnn_model.weights.h5'):
        cnn_model.load_weights('cnn_model.weights.h5')
        print("Loaded CNN model weights from current directory")
    else:
        print("No existing CNN model weights found - will use initialized weights")
except Exception as e:
    print(f"Warning: Could not load CNN model weights: {e}")

# Reload embeddings to update after a new registration
def reload_embeddings():
    global face_data, labels, names, roles
    try:
        weights_path = os.path.join(app_data_path, 'cnn_model.weights.h5')
        if os.path.exists(weights_path):
            cnn_model.load_weights(weights_path)
        elif os.path.exists('cnn_model.weights.h5'):
            cnn_model.load_weights('cnn_model.weights.h5')
    except Exception as e:
        print(f"Warning: Could not reload CNN model weights: {e}")
    
    face_data, labels, names, roles = load_embeddings_from_db()

# Recognize faces using MongoDB-stored embeddings
model = YOLO('yolov5s.pt')  # Replace with your YOLO model path

@app.route('/crowd', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    # Read the image from the request
    file = request.files['image']
    img_array = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    # Perform YOLO detection
    results = model.predict(source=img, conf=0.5) 
    print(results)# Confidence threshold
    detections = results[0].boxes.xyxy  # Bounding boxes
    labels = results[0].boxes.cls.cpu().numpy()  # Class labels
    human_boxes = [box for box, label in zip(detections, labels) if int(label) == 0]  # Filter humans

    # Draw bounding boxes for humans only
    human_count = 0
    for box in human_boxes:
        x1, y1, x2, y2 = map(int, box[:4])
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        human_count += 1

    # Convert the processed image to Base64
    _, buffer = cv2.imencode('.jpg', img)
    encoded_image = base64.b64encode(buffer).decode('utf-8')

    return jsonify({'count': human_count, 'image': encoded_image})

def recognize_faces_in_image(image):
    if len(face_data) == 0:
        return [{"name": "No registered faces", "probability": 0.0, "role": "unknown"}]

    faces = detector.detect_faces(image)
    results = []
    for face in faces:
        x, y, width, height = face['box']
        cropped_face = cv2.resize(image[y:y+height, x:x+width], (160, 160))
        
        # Convert cropped face to RGB
        rgb_face = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2RGB)
        embedding = embedder.embeddings(np.expand_dims(rgb_face, axis=0)).flatten()  # Use RGB face here

        # Compare with stored embeddings in MongoDB
        similarities = cosine_similarity([embedding], face_data)
        idx = np.argmax(similarities)
        best_match = similarities[0][idx]

        if best_match > 0.7:
            recognized_id = labels[idx] # Get the ObjectId
            recognized_name = names[recognized_id]  # Use ObjectId to get the username
            role = roles.get(recognized_id, DEFAULT_ROLE)
            results.append(
                {"name": recognized_name, "probability": float(best_match), "role": role}
            )
        else:
            results.append(
                {"name": "Unknown", "probability": float(best_match), "role": "unknown"}
            )
    return results

@app.route('/users/<rollnumber>/role', methods=['PATCH'])
def update_user_role(rollnumber):
    payload = request.get_json(silent=True) or {}
    role = str(payload.get("role", "")).strip().lower()
    if role not in ALLOWED_ROLES:
        return jsonify({"error": "Invalid role"}), 400

    rollnumber = str(rollnumber).upper()
    user = mongo.db.data.find_one({"RollNumber": rollnumber})
    if user is None:
        return jsonify({"error": "User not found"}), 404

    current_role = normalize_role(user.get("role"), user.get("RollNumber"))
    if current_role == "admin" and role != "admin" and count_admins() <= 1:
        return jsonify({"error": "Cannot remove the last admin"}), 400

    mongo.db.data.update_one({"_id": user["_id"]}, {"$set": {"role": role}})
    reload_embeddings()
    return jsonify({"message": "Role updated", "role": role})

@app.route('/users/<rollnumber>', methods=['DELETE'])
def delete_user(rollnumber):
    rollnumber = str(rollnumber).upper()
    user = mongo.db.data.find_one({"RollNumber": rollnumber})
    if user is None:
        return jsonify({"error": "User not found"}), 404

    current_role = normalize_role(user.get("role"), user.get("RollNumber"))
    if current_role == "admin" and count_admins() <= 1:
        return jsonify({"error": "Cannot delete the last admin"}), 400

    mongo.db.data.delete_one({"_id": user["_id"]})
    mongo.db.attendance1.delete_one({"username": rollnumber})
    reload_embeddings()
    return jsonify({"message": "User deleted"})

@app.route('/users/<username>/images', methods=['GET'])
def get_user_images(username):
    username = str(username).upper()
    # Collection name 'data' is already correctly used here
    details = mongo.db.data.find_one({"username": username},{"_id":0,"embeddings":0,"CNN_embeddings":0})
    if not details:
        details = mongo.db.data.find_one({"RollNumber": username},{"_id":0,"embeddings":0,"CNN_embeddings":0})
        if not details:
          return jsonify({"error": "User not found"}), 404
    print(details["RollNumber"])
    # Retrieve the stored image in base64 format
    return jsonify({"details": details})

#multi face
@app.route('/recognize', methods=['POST'])
def recognize():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    file = request.files['image']
    image_data = file.read()
    image_array = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    
    if image is None:
        return jsonify({"error": "Invalid image"}), 400

    results = recognize_faces_in_image(image)
    today = datetime.now().strftime("%Y-%m-%d")
    for result in results:
        if result['name'] != "Unknown":  # Only log attendance for recognized users
            # Collection name 'attendance1' is already correctly used here
            mongo.db.attendance1.update_one(
                {'username': result['name']},
                {'$set': {today: True}},  # Mark as present for today
                upsert=True
            )
    return jsonify(results)

# user multi face
@app.route('/user_recognize', methods=['POST'])
def user_recognize():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"},), 400

    file = request.files['image']
    image_data = file.read()
    image_array = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    
    if image is None:
        return jsonify({"error": "Invalid image"}), 400

    results = recognize_faces_in_image(image)
    return jsonify(results)

@app.route('/user_attendance/<username>', methods=['GET'])
def get_user_attendance(username):
    # Check if the user exists in the database
    # Collection name 'data' is already correctly used here
    user = mongo.db.data.find_one({'RollNumber': username})
    if user is None:
        return jsonify({"error": "User not found"}), 404
    print(user['username'])
    # Fetch the attendance data for the user
    # Collection name 'attendance1' is already correctly used here
    attendance = mongo.db.attendance1.find_one({'username': username}, {'_id': 0,"username":0,"id":0})
    print(attendance)
    if attendance is None:
        return jsonify({"error": "No attendance data found"}), 404

    # Return the attendance data
    return jsonify(attendance)

#attendance
@app.route('/attendance',methods=['GET'])
def get_attendance():
    # Collection name 'attendance1' is already correctly used here
    records = list(mongo.db.attendance1.find({}, {"_id": 0}))
    return jsonify({"attendance": records})