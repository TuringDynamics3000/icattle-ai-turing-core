import requests
import base64
import json
import time

# --- Configuration ---
API_URL = "http://localhost:8001/api/v1/agritech/image_capture"

# --- Test Data ---
# A small, unique base64 string to simulate an image.
# This will generate a unique, deterministic Muzzle Hash.
TEST_IMAGE_DATA = base64.b64encode(f"TestImage_{time.time()}".encode('utf-8')).decode('utf-8')

# Full Turing Protocol Context Headers
HEADERS = {
    "X-Tenant-ID": "icattle-ai-veridion-one",
    "X-Request-ID": f"req-{int(time.time())}",
    "X-User-ID": "farmer-john-doe-123",
    "X-Device-ID": "mobile-samsung-s23-456",
    "X-Geo-Location": "-33.8688, 151.2093" # Sydney, Australia
}

# Command Payload
PAYLOAD = {
    "image_data": TEST_IMAGE_DATA
}

def send_test_command():
    print(f"Sending command to API Gateway: {API_URL}")
    print(f"Using Tenant ID: {HEADERS['X-Tenant-ID']}")
    
    try:
        response = requests.post(API_URL, headers=HEADERS, json=PAYLOAD)
        
        print("\n" + "="*50)
        print(f"API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ COMMAND DISPATCH SUCCESSFUL")
            print(f"Aggregate ID (Muzzle Hash): {data['aggregate_id']}")
            print(f"Event ID (DB Record): {data['event_id']}")
        else:
            print("❌ COMMAND DISPATCH FAILED")
            print(f"Response Body: {response.text}")
            
        print("="*50 + "\n")
        
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR: Ensure the FastAPI server is running on port 8001.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    send_test_command()
