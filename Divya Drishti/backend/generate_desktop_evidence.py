from PIL import Image
import io
import os

def create_desktop_evidence():
    desktop_path = os.path.expanduser("~/Desktop")
    
    # ensure desktop exists, though it should on mac
    if not os.path.exists(desktop_path):
        print(f"Desktop not found at {desktop_path}, checking alternative...")
        return

    print(f"Generating files in: {desktop_path}")

    # Case 1: Digital DNA Mismatch (Spoofing)
    # A text file pretending to be a PNG
    spoof_path = os.path.join(desktop_path, "suspicious_spoof.png")
    with open(spoof_path, "w") as f:
        f.write("This is not a real image. This is a text file disguised as a PNG to test magic byte detection.")
    print(f"[CREATED] {spoof_path} (Type: Spoofed/Fake Extension)")

    # Case 2: Steganography (Hidden Data)
    # A real JPEG with data appended to end
    stego_path = os.path.join(desktop_path, "suspicious_stego.jpg")
    img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    valid_jpeg_data = img_byte_arr.getvalue()
    hidden_payload = b"__SECRET_AGENCY_DATA__" * 50
    with open(stego_path, "wb") as f:
        f.write(valid_jpeg_data + hidden_payload)
    print(f"[CREATED] {stego_path} (Type: Steganography/Hidden Data)")

    # Case 3: Valid Image (Control)
    clean_path = os.path.join(desktop_path, "clean_evidence.jpg")
    with open(clean_path, "wb") as f:
        f.write(valid_jpeg_data)
    print(f"[CREATED] {clean_path} (Type: Clean)")

if __name__ == "__main__":
    create_desktop_evidence()
