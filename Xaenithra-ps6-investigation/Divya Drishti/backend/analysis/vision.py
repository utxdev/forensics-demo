import cv2
import numpy as np

def detect_faces(file_path: str) -> dict:
    result = {
        "faces_detected": 0,
        "boxes": [], # [x, y, w, h]
        "error": None
    }
    
    try:
        # Load image
        img = cv2.imread(file_path)
        if img is None:
            return result # Not an image or unreadable
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Load Haar Cascade
        # In a real deployed env, we'd bundle the xml. 
        # For this prototype, we rely on cv2's default or download it.
        # cv2.data.haarcascades path
        face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(face_cascade_path)
        
        if face_cascade.empty():
            # Fallback for some systems where cv2.data might be weird
            result["error"] = "Haar Cascade not found"
            return result
            
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        result["faces_detected"] = len(faces)
        # Convert numpy int32 to python int for JSON serialization
        result["boxes"] = [[int(x), int(y), int(w), int(h)] for (x, y, w, h) in faces]
        
    except Exception as e:
        result["error"] = str(e)
        
    return result
