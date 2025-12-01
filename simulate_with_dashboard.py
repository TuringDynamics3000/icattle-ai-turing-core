"""
Simulation with Real-time Dashboard Integration
Developed by: TuringDynamics
"""
import asyncio
import aiohttp
import base64
import json
import time
import random
from datetime import datetime
from io import BytesIO
from PIL import Image, ImageDraw
import hashlib

API_URL = "http://localhost:8002/api/v1/agritech/image_capture"
DASHBOARD_URL = "http://localhost:8003/api/update"
CONCURRENT_REQUESTS = 50

OWNERS = [
    {"owner_id": "OWNER_001", "name": "Green Valley Ranch", "animal_count": 2000},
    {"owner_id": "OWNER_002", "name": "Sunset Cattle Co", "animal_count": 1500},
    {"owner_id": "OWNER_003", "name": "Prairie Livestock", "animal_count": 1500},
    {"owner_id": "OWNER_004", "name": "Mountain View Farms", "animal_count": 1000},
]

GEO_LOCATIONS = {
    "OWNER_001": "-34.9285,138.6007",
    "OWNER_002": "-37.8136,144.9631",
    "OWNER_003": "-27.4698,153.0251",
    "OWNER_004": "-31.9505,115.8605",
}


def generate_simple_image(animal_id ):
    """Generate simple synthetic muzzle image"""
    img = Image.new('RGB', (200, 200), color=(240, 230, 220))
    draw = ImageDraw.Draw(img)
    seed = int(hashlib.md5(animal_id.encode()).hexdigest(), 16) % (10**8)
    random.seed(seed)
    for _ in range(10):
        x, y = random.randint(0, 200), random.randint(0, 200)
        w, h = random.randint(10, 30), random.randint(10, 30)
        draw.ellipse([x, y, x+w, y+h], fill=(random.randint(100,180), random.randint(80,150), random.randint(70,130)))
    buffer = BytesIO()
    img.save(buffer, format='JPEG', quality=75)
    return buffer.getvalue()


async def submit_animal(session, owner_id, user_id, device_id, animal_id, geo_location):
    """Submit single animal capture"""
    image_bytes = generate_simple_image(animal_id)
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    headers = {
        "Content-Type": "application/json",
        "X-Tenant-ID": owner_id,
        "X-Request-ID": f"req-{animal_id}-{int(time.time()*1000)}",
        "X-User-ID": user_id,
        "X-Device-ID": device_id,
        "X-Geo-Location": geo_location
    }
    
    payload = {"image_data": image_base64}
    
    try:
        async with session.post(API_URL, headers=headers, json=payload, timeout=30) as response:
            if response.status == 200:
                return {"success": True, "owner_id": owner_id, "animal_id": animal_id}
            else:
                return {"success": False, "owner_id": owner_id, "animal_id": animal_id}
    except Exception as e:
        return {"success": False, "owner_id": owner_id, "animal_id": animal_id, "error": str(e)}


async def update_dashboard(session, stats):
    """Send stats update to dashboard"""
    try:
        async with session.post(DASHBOARD_URL, json=stats, timeout=5) as response:
            pass
    except:
        pass  # Dashboard is optional


async def run_simulation():
    """Run simulation with dashboard updates"""
    # Prepare animals
    all_animals = []
    for owner in OWNERS:
        owner_id = owner["owner_id"]
        for i in range(owner["animal_count"]):
            animal_id = f"{owner_id}_ANIMAL_{i+1:05d}"
            user_id = f"{owner_id}_USER_{(i % 5) + 1:02d}"
            device_id = f"{owner_id}_DEVICE_{(i % 3) + 1:02d}"
            all_animals.append({
                "owner_id": owner_id,
                "owner_name": owner["name"],
                "animal_id": animal_id,
                "user_id": user_id,
                "device_id": device_id,
                "geo_location": GEO_LOCATIONS[owner_id]
            })
    
    # Initialize stats
    stats = {
        "total_animals": len(all_animals),
        "processed": 0,
        "success": 0,
        "failed": 0,
        "current_batch": 0,
        "total_batches": (len(all_animals) + 99) // 100,
        "throughput": 0.0,
        "start_time": datetime.utcnow().isoformat(),
        "by_owner": {
            owner["owner_id"]: {
                "name": owner["name"],
                "total": owner["animal_count"],
                "processed": 0,
                "success": 0,
                "failed": 0
            }
            for owner in OWNERS
        }
    }
    
    print("="*80)
    print("iCattle.ai - OPTIMIZED Simulation (50 concurrent requests)")
    print("="*80)
    for owner in OWNERS:
        print(f"{owner['name']} ({owner['owner_id']}): {owner['animal_count']} animals")
    print(f"\nTotal: {len(all_animals)} animals")
    print(f"Dashboard: http://localhost:8003" )
    print("="*80)
    print()
    
    start_time = time.time()
    
    async with aiohttp.ClientSession( ) as session:
        # Send initial stats to dashboard
        await update_dashboard(session, stats)
        
        semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
        batch_size = 100
        total_batches = (len(all_animals) + batch_size - 1) // batch_size
        
        for batch_num, i in enumerate(range(0, len(all_animals), batch_size), 1):
            batch = all_animals[i:i+batch_size]
            batch_start = time.time()
            print(f"\nBatch {batch_num}/{total_batches} ({len(batch)} animals)...")
            
            # Process batch concurrently
            async def process_with_semaphore(animal):
                async with semaphore:
                    return await submit_animal(
                        session, animal["owner_id"], animal["user_id"],
                        animal["device_id"], animal["animal_id"], animal["geo_location"]
                    )
            
            results = await asyncio.gather(*[process_with_semaphore(a) for a in batch])
            
            # Update stats
            batch_success = sum(1 for r in results if r["success"])
            batch_failed = len(results) - batch_success
            stats["processed"] += len(results)
            stats["success"] += batch_success
            stats["failed"] += batch_failed
            stats["current_batch"] = batch_num
            
            # Update owner stats
            for result in results:
                owner_id = result["owner_id"]
                stats["by_owner"][owner_id]["processed"] += 1
                if result["success"]:
                    stats["by_owner"][owner_id]["success"] += 1
                else:
                    stats["by_owner"][owner_id]["failed"] += 1
            
            # Calculate throughput
            batch_time = time.time() - batch_start
            batch_throughput = len(batch) / batch_time
            elapsed = time.time() - start_time
            overall_throughput = stats["processed"] / elapsed
            stats["throughput"] = overall_throughput
            
            # Update dashboard
            await update_dashboard(session, stats)
            
            print(f"  Completed: {batch_success}/{len(batch)} in {batch_time:.2f}s ({batch_throughput:.1f} animals/sec)")
            print(f"  Progress: {stats['processed']}/{len(all_animals)} ({100*stats['processed']/len(all_animals):.1f}%)")
            
            if i+batch_size < len(all_animals):
                await asyncio.sleep(0.1)
    
    elapsed = time.time() - start_time
    print("\n" + "="*80)
    print("COMPLETE")
    print("="*80)
    print(f"Time: {elapsed:.2f}s ({elapsed/60:.2f} min)")
    print(f"Throughput: {len(all_animals)/elapsed:.2f} animals/sec")
    print(f"Success: {stats['success']} ({100*stats['success']/stats['total_animals']:.1f}%)")
    print(f"Failed: {stats['failed']}")
    print("="*80)


if __name__ == "__main__":
    print("\niCattle.ai FAST Simulation with Dashboard\n")
    print("Make sure dashboard is running: python dashboard_server.py")
    print("Then open: http://localhost:8003\n" )
    asyncio.run(run_simulation())
