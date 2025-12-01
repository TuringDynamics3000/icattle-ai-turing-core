"""Test the production API with domain layer"""
import requests
import base64
import uuid
from datetime import datetime
from PIL import Image
from io import BytesIO

API_URL = "http://localhost:8002/api/v1/agritech/image_capture"

# Create test image
img = Image.new('RGB', (200, 200 ), color=(240, 230, 220))
buffer = BytesIO()
img.save(buffer, format='JPEG')
image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

# Turing Protocol headers
headers = {
    "Content-Type": "application/json",
    "X-Tenant-ID": "OWNER_001",
    "X-Request-ID": str(uuid.uuid4()),
    "X-User-ID": "USER_001",
    "X-Device-ID": "DEVICE_001",
    "X-Geo-Location": "-34.9285,138.6007"
}

# Payload
payload = {
    "image_data": image_base64,
    "metadata": {"breed": "Angus", "age_months": 24}
}

print("Testing Production API...")
print(f"URL: {API_URL}")
print(f"Headers: {list(headers.keys())}")
print()

response = requests.post(API_URL, headers=headers, json=payload)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")

if response.status_code == 200:
    result = response.json()
    print()
    print("SUCCESS!")
    print(f"Muzzle Hash: {result['aggregate_id']}")
    print(f"Event ID: {result['event_id']}")
else:
    print("FAILED!")
