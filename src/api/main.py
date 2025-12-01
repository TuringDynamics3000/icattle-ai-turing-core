from fastapi import FastAPI, Header, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import time

# Import core logic and dispatcher
from ..infrastructure.core_logic import process_image_command
from ..infrastructure.command_dispatcher import dispatch_command # NEW IMPORT

# --- Domain Models (Simplified) ---

class AnimalImageCaptured(BaseModel):
    image_data: str # Base64 encoded image data
    
class TuringContext(BaseModel):
    tenant_id: str
    request_id: str
    user_id: str
    device_id: str
    geo_location: str
    
# --- Infrastructure Simulation ---

# Simulated dependency injection for Turing Protocol Context
async def enforce_turing_protocol(
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID"),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_device_id: Optional[str] = Header(None, alias="X-Device-ID"),
    x_geo_location: Optional[str] = Header(None, alias="X-Geo-Location"),
) -> TuringContext:
    """Enforces the Turing Protocol by extracting required headers."""
    # Enforce bank-grade context collection
    if not all([x_tenant_id, x_request_id, x_user_id, x_device_id, x_geo_location]):
        raise HTTPException(status_code=400, detail="Turing Protocol Headers Missing. Required: X-Tenant-ID, X-Request-ID, X-User-ID, X-Device-ID, X-Geo-Location")
    
    return TuringContext(
        tenant_id=x_tenant_id,
        request_id=x_request_id,
        user_id=x_user_id,
        device_id=x_device_id,
        geo_location=x_geo_location
    )

# --- Updated Dispatch Logic ---
def handle_image_capture_command(command: AnimalImageCaptured, context: TuringContext):
    # 1. Process image and get core event data (Muzzle Hash, S3 Key)
    core_event_data = process_image_command(command.image_data)
    
    # 2. Combine core data with full context metadata
    full_metadata = context.dict()
    
    # 3. Create the final event structure
    event = {
        "aggregate_id": core_event_data["aggregate_id"],
        "aggregate_type": "Animal",
        "event_type": "AnimalImageCaptured",
        "version": 1,
        "payload": core_event_data,
        "metadata": full_metadata,
        "timestamp": time.time()
    }
    
    # 4. Dispatch the event (Persist to DB and Publish to Kafka)
    result = dispatch_command(event)
    
    return {"status": result["status"], "aggregate_id": event["aggregate_id"], "event_id": result["event_id"]}

# --- API Gateway Router ---

app = FastAPI(title="iCattle.ai API Gateway")

@app.post("/api/v1/agritech/image_capture")
async def image_capture_endpoint(
    command: AnimalImageCaptured,
    context: TuringContext = Depends(enforce_turing_protocol)
):
    """
    Accepts a new animal image capture event, enforcing the Turing Protocol.
    """
    try:
        result = handle_image_capture_command(command, context)
        return result
    except Exception as e:
        # Catch infrastructure errors (DB/Kafka connection) and return 500
        raise HTTPException(status_code=500, detail=f"Infrastructure Error: {e}")

if __name__ == "__main__":
    import uvicorn
    # Note: You will need to run this on your local machine
    # uvicorn.run(app, host="0.0.0.0", port=8001)
    print("FastAPI application defined. Ready for next step.")
