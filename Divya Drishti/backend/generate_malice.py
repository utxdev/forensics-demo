from PIL import Image
import io
import os

def create_malitious_evidence():
    # 1. Create a clean, valid JPEG image (100x100 red square)
    img = Image.new('RGB', (100, 100), color = 'red')
    
    # Save to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    valid_jpeg_data = img_byte_arr.getvalue()
    
    # 2. Define the "Hidden Payload" (Malicious content)
    # Appending data after the JPEG EOF marker (FF D9)
    hidden_payload = b"TopSecret_Nuclear_Codes_v2.pdf_HIDDEN" * 10 
    
    malicious_data = valid_jpeg_data + hidden_payload
    
    # 3. Save to file
    output_path = "malicious_evidence.jpg"
    with open(output_path, "wb") as f:
        f.write(malicious_data)
        
    print(f"Created {output_path}")
    print(f"Original Size: {len(valid_jpeg_data)} bytes")
    print(f"Malicious Size: {len(malicious_data)} bytes")
    print(f"Hidden Payload: {len(hidden_payload)} bytes appended")

if __name__ == "__main__":
    create_malitious_evidence()
