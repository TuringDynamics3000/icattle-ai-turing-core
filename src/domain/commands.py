"""
Domain Commands - Pure data structures representing user intentions
Part of the Functional Core (no I/O, no side effects)
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any


@dataclass(frozen=True)
class CaptureAnimalImage:
    """
    Command to capture and register an animal's muzzle print image.
    
    This is the primary command for biometric identity registration.
    Immutable to ensure command integrity throughout the pipeline.
    """
    image_data: str  # Base64-encoded JPEG/PNG
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        """Validate command invariants"""
        if not self.image_data:
            raise ValueError("image_data cannot be empty")
        if not isinstance(self.timestamp, datetime):
            raise ValueError("timestamp must be a datetime object")
