"""Unit Tests for Domain Services"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import base64
from datetime import datetime
from src.domain.services import (
    calculate_muzzle_hash,
    generate_s3_key,
    process_image_capture_command
)
from src.domain.commands import CaptureAnimalImage


def test_calculate_muzzle_hash():
    """Same image should produce same hash"""
    image_data = base64.b64encode(b"test_image").decode('utf-8')
    hash1 = calculate_muzzle_hash(image_data)
    hash2 = calculate_muzzle_hash(image_data)
    assert hash1 == hash2
    assert len(hash1) == 64  # SHA-256


def test_generate_s3_key():
    """S3 key should follow correct format"""
    muzzle_hash = "abc123" * 10
    timestamp = datetime(2025, 12, 1, 10, 0, 0)
    key = generate_s3_key(muzzle_hash, timestamp, tier="bronze")
    assert key.startswith("bronze/2025/12/01/")
    assert muzzle_hash in key


def test_process_command():
    """Process valid command"""
    image_data = base64.b64encode(b"test_muzzle").decode('utf-8')
    command = CaptureAnimalImage(
        image_data=image_data,
        timestamp=datetime(2025, 12, 1, 10, 0, 0)
    )
    muzzle_hash, s3_key, version_id = process_image_capture_command(command)
    assert len(muzzle_hash) == 64
    assert "bronze" in s3_key
    assert len(version_id) == 16
