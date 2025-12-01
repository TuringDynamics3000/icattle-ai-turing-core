"""
Domain Events - Immutable facts about what happened
Part of the Functional Core (no I/O, no side effects)
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum


class EventType(str, Enum):
    """Canonical event type enumeration"""
    ANIMAL_IMAGE_CAPTURED = "AnimalImageCaptured"
    ANIMAL_REGISTERED = "AnimalRegistered"
    BIOMETRIC_MATCH_CONFIRMED = "BiometricMatchConfirmed"
    BIOMETRIC_MATCH_FAILED = "BiometricMatchFailed"


@dataclass(frozen=True)
class DomainEvent:
    """Base class for all domain events"""
    event_id: str
    event_type: EventType
    aggregate_id: str  # The muzzle hash
    aggregate_type: str
    version: int
    timestamp: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "aggregate_id": self.aggregate_id,
            "aggregate_type": self.aggregate_type,
            "version": self.version,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass(frozen=True)
class AnimalImageCaptured(DomainEvent):
    """Event: An animal's muzzle print image was captured"""
    muzzle_hash: str
    image_s3_key: str
    image_version_id: str
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        base = super().to_dict()
        base.update({
            "muzzle_hash": self.muzzle_hash,
            "image_s3_key": self.image_s3_key,
            "image_version_id": self.image_version_id,
            "metadata": self.metadata or {}
        })
        return base
