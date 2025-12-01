"""
Production API - Integrates domain layer with existing iCattle.ai infrastructure
"""
from fastapi import FastAPI, Request, HTTPException, Header
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
import logging
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.domain.commands import CaptureAnimalImage
from src.domain.services import (
    process_image_capture_command,
    create_animal_image_captured_event
)
from src.infrastructure.logging_config import setup_logging, set_correlation_id

# Setup logging
setup_logging(level="INFO", format_type="json")
logger = logging.getLogger(__name__)

app = FastAPI(title="iCattle.ai Production API", version="1.0.0")


class ImageCaptureRequest(BaseModel):
    """Request model for image capture"""
    image_data: str
    metadata: Optional[Dict[str, Any]] = None


class ImageCaptureResponse(BaseModel):
    """Response model for image capture"""
    status: str
    aggregate_id: str
    event_id: str


@app.middleware("http" )
async def turing_protocol_middleware(request: Request, call_next):
    """Enforce Turing Protocol headers"""
    required_headers = ["x-tenant-id", "x-request-id", "x-user-id", "x-device-id", "x-geo-location"]
    
    for header in required_headers:
        if header not in request.headers:
            return HTTPException(
                status_code=400,
                detail=f"Missing required Turing Protocol header: {header}"
            )
    
    # Set correlation ID from request ID
    set_correlation_id(request.headers.get("x-request-id"))
    
    response = await call_next(request)
    return response


@app.post("/api/v1/agritech/image_capture", response_model=ImageCaptureResponse)
async def capture_image(
    request_body: ImageCaptureRequest,
    x_tenant_id: str = Header(...),
    x_request_id: str = Header(...),
    x_user_id: str = Header(...),
    x_device_id: str = Header(...),
    x_geo_location: str = Header(...)
):
    """
    Capture animal muzzle image - Production implementation with domain layer
    """
    try:
        # 1. Create command (Functional Core input)
        command = CaptureAnimalImage(
            image_data=request_body.image_data,
            timestamp=datetime.utcnow(),
            metadata=request_body.metadata
        )
        
        # 2. Process command (Pure domain logic)
        muzzle_hash, s3_key, image_version_id = process_image_capture_command(command)
        
        # 3. Create event (Pure domain logic)
        event = create_animal_image_captured_event(
            command=command,
            muzzle_hash=muzzle_hash,
            s3_key=s3_key,
            image_version_id=image_version_id,
            version=1
        )
        
        # 4. Log with correlation ID
        logger.info(
            f"Image captured for animal {muzzle_hash[:8]}",
            extra={
                "event_id": event.event_id,
                "aggregate_id": event.aggregate_id,
                "tenant_id": x_tenant_id,
                "user_id": x_user_id
            }
        )
        
        # 5. In production, save to event store here
        # event_db_id = await event_store.save_event(...)
        
        return ImageCaptureResponse(
            status="success",
            aggregate_id=muzzle_hash,
            event_id=event.event_id
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "icattle-production"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
