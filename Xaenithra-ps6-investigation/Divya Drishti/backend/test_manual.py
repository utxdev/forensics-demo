import requests
import os

BASE_URL = "http://localhost:8000"

def test_analyze():
    # Create a dummy file
    with open("test_image.jpg", "wb") as f:
        f.write(os.urandom(1024))
        
    files = {'file': open('test_image.jpg', 'rb')}
    try:
        response = requests.post(f"{BASE_URL}/analyze", files=files)
        print("Analyze Status:", response.status_code)
        print("Analyze Response:", response.json())
        
        if response.status_code == 200:
            file_id = response.json().get("file_id")
            return file_id
    except Exception as e:
        print("Analyze Failed:", e)
    finally:
        files['file'].close()
        if os.path.exists("test_image.jpg"):
            os.remove("test_image.jpg")
            
def test_hex(file_id):
    if not file_id:
        print("Skipping Hex Test (No File ID)")
        return

    try:
        response = requests.get(f"{BASE_URL}/hex/{file_id}?offset=0&size=16")
        print("Hex Status:", response.status_code)
        print("Hex Response:", response.json())
    except Exception as e:
        print("Hex Failed:", e)

if __name__ == "__main__":
    print("Testing Backend...")
    # We need the server code to be importable or running. 
    # For this script, we assume the server is running or we can test logic directly?
    # Actually, let's just test the functions directly to avoid needing to spawn uvicorn in background for now, 
    # or better, let's write a pytest test that uses TestClient
    pass
