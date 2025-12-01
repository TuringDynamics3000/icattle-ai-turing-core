import hashlib
import base64
import time
from typing import Dict, Any

# --- Core Logic: Muzzle Hash and S3 Simulation ---

def store_image_in_s3_bronze(image_data: str, muzzle_hash: str) -> str:
    """
    Simulates storing the image in the S3 Bronze Zone.
    Returns the S3 key.
    """
    # In a real system, this would upload the data to S3.
    timestamp = int(time.time())
    s3_key = f"bronze/agritech/muzzle_shots/{muzzle_hash}/{timestamp}.b64"
    return s3_key

def calculate_muzzle_hash(image_data: str) -> str:
    """
    Calculates the SHA-256 hash of the image data.
    This hash serves as the immutable Aggregate Root ID.
    """
    # Decode the base64 string to get the raw image bytes
    try:
        # Note: In a real app, you would handle the low-res/high-res tiered upload here.
        image_bytes = base64.b64decode(image_data)
    except Exception:
        # Return a deterministic hash for invalid data
        return hashlib.sha256(b"INVALID_IMAGE_DATA").hexdigest()
        
    # Calculate the SHA-256 hash
    muzzle_hash = hashlib.sha256(image_bytes).hexdigest()
    return muzzle_hash

def process_image_command(image_data: str) -> Dict[str, Any]:
    """
    Core logic to process the image data and prepare for event publishing.
    """
    # 1. Calculate the immutable Aggregate Root ID (Muzzle Hash)
    muzzle_hash = calculate_muzzle_hash(image_data)
    
    # 2. Store the image in the S3 Bronze Zone (Simulated)
    s3_key = store_image_in_s3_bronze(image_data, muzzle_hash)
    
    # 3. Calculate the Image Version ID (hash of the current image)
    image_version_id = calculate_muzzle_hash(image_data)
    
    return {
        "aggregate_id": muzzle_hash,
        "image_version_id": image_version_id,
        "s3_key": s3_key
    }
