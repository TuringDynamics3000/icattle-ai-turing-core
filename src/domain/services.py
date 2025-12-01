"""
Domain Services - Pure business logic functions
Part of the Functional Core (no I/O, no side effects)
"""

import hashlib
import base64
import uuid
from datetime import datetime
from typing import Tuple
from .events import AnimalImageCaptured, EventType
from .commands import CaptureAnimalImage


def calculate_muzzle_hash(image_data: str) -> str:
    """Calculate deterministic biometric identifier from image data"""
    if not image_data:
        raise ValueError("image_data cannot be empty")
    
    try:
        image_bytes = base64.b64decode(image_data)
    except Exception as e:
        raise ValueError(f"Invalid base64 image data: {e}")
    
    return hashlib.sha256(image_bytes).hexdigest()


def generate_s3_key(muzzle_hash: str, timestamp: datetime, tier: str = "bronze") -> str:
    """Generate S3 object key for image storage"""
    if tier not in ["bronze", "silver", "gold"]:
        raise ValueError(f"Invalid tier: {tier}")
    
    date_path = timestamp.strftime("%Y/%m/%d")
    hash_prefix = muzzle_hash[:8]
    
    return f"{tier}/{date_path}/{hash_prefix}/{muzzle_hash}.jpg"


def generate_image_version_id(muzzle_hash: str, timestamp: datetime) -> str:
    """Generate unique version ID for this specific image capture"""
    timestamp_str = timestamp.isoformat()
    random_component = uuid.uuid4().hex[:8]
    combined = f"{muzzle_hash}:{timestamp_str}:{random_component}"
    return hashlib.sha256(combined.encode()).hexdigest()[:16]


def process_image_capture_command(command: CaptureAnimalImage) -> Tuple[str, str, str]:
    """Process image capture command - pure business logic"""
    muzzle_hash = calculate_muzzle_hash(command.image_data)
    s3_key = generate_s3_key(muzzle_hash, command.timestamp, tier="bronze")
    image_version_id = generate_image_version_id(muzzle_hash, command.timestamp)
    return muzzle_hash, s3_key, image_version_id


def create_animal_image_captured_event(
    command: CaptureAnimalImage,
    muzzle_hash: str,
    s3_key: str,
    image_version_id: str,
    version: int = 1
) -> AnimalImageCaptured:
    """Create AnimalImageCaptured event from command"""
    event_id = str(uuid.uuid4())
    
    return AnimalImageCaptured(
        event_id=event_id,
        event_type=EventType.ANIMAL_IMAGE_CAPTURED,
        aggregate_id=muzzle_hash,
        aggregate_type="Animal",
        version=version,
        timestamp=command.timestamp,
        muzzle_hash=muzzle_hash,
        image_s3_key=s3_key,
        image_version_id=image_version_id,
        metadata=command.metadata
    )


def validate_image_data(image_data: str) -> bool:
    """Validate base64 image data"""
    if not image_data:
        raise ValueError("Image data cannot be empty")
    
    try:
        decoded = base64.b64decode(image_data)
        if len(decoded) == 0:
            raise ValueError("Decoded image data is empty")
        return True
    except Exception as e:
        raise ValueError(f"Invalid base64 image data: {e}")
