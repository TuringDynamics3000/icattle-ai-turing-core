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

API_URL = "http://localhost:8001/api/v1/agritech/image_capture"
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

async def submit_animal(session, animal_data, semaphore):
    async with semaphore:
        animal_id = animal_data["animal_id"]
        try:
            image_bytes = generate_simple_image(animal_id)
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            headers = {
                "Content-Type": "application/json",
                "X-Tenant-ID": animal_data["owner_id"],
                "X-Request-ID": f"req-{animal_id}-{int(time.time()*1000)}",
                "X-User-ID": animal_data["user_id"],
                "X-Device-ID": animal_data["device_id"],
                "X-Geo-Location": animal_data["geo_location"],
            }
            payload = {"image_data": image_base64}
            async with session.post(API_URL, headers=headers, json=payload, timeout=30) as response:
                if response.status == 200:
                    result = await response.json()
                    return {"success": True, "animal_id": animal_id, "owner_id": animal_data["owner_id"]}
                else:
                    return {"success": False, "animal_id": animal_id, "owner_id": animal_data["owner_id"], "status": response.status}
        except Exception as e:
            return {"success": False, "animal_id": animal_id, "owner_id": animal_data["owner_id"], "error": str(e)}

async def process_batch(session, batch, batch_num, total_batches, semaphore):
    batch_start = time.time()
    print(f"\nBatch {batch_num}/{total_batches} ({len(batch)} animals)...")
    tasks = [submit_animal(session, animal, semaphore) for animal in batch]
    results = await asyncio.gather(*tasks)
    success = sum(1 for r in results if r["success"])
    failed = len(results) - success
    batch_time = time.time() - batch_start
    print(f"  Completed: {success}/{len(batch)} in {batch_time:.2f}s ({len(batch)/batch_time:.1f} animals/sec)")
    if failed > 0:
        print(f"  Failed: {failed}")
    return results

async def run_simulation_async():
    print("="*80)
    print("iCattle.ai - OPTIMIZED Simulation (50 concurrent requests)")
    print("="*80)
    all_animals = []
    for owner in OWNERS:
        print(f"{owner['name']} ({owner['owner_id']}): {owner['animal_count']} animals")
        for i in range(owner['animal_count']):
            all_animals.append({
                "animal_id": f"{owner['owner_id']}_ANIMAL_{i+1:05d}",
                "owner_id": owner['owner_id'],
                "user_id": f"{owner['owner_id']}_USER_{random.randint(1,5):02d}",
                "device_id": f"{owner['owner_id']}_DEVICE_{random.randint(1,3):02d}",
                "geo_location": GEO_LOCATIONS[owner['owner_id']]
            })
    print(f"\nTotal: {len(all_animals)} animals")
    print("="*80)
    
    stats = {"total": len(all_animals), "success": 0, "failed": 0, "by_owner": {o["owner_id"]: {"success": 0, "failed": 0} for o in OWNERS}}
    start_time = time.time()
    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
    connector = aiohttp.TCPConnector(limit=CONCURRENT_REQUESTS )
    
    async with aiohttp.ClientSession(connector=connector ) as session:
        batch_size = 100
        total_batches = (len(all_animals) + batch_size - 1) // batch_size
        for batch_num, i in enumerate(range(0, len(all_animals), batch_size), 1):
            batch = all_animals[i:i+batch_size]
            results = await process_batch(session, batch, batch_num, total_batches, semaphore)
            for r in results:
                if r["success"]:
                    stats["success"] += 1
                    stats["by_owner"][r["owner_id"]]["success"] += 1
                else:
                    stats["failed"] += 1
                    stats["by_owner"][r["owner_id"]]["failed"] += 1
            print(f"  Progress: {min(i+batch_size, len(all_animals))}/{len(all_animals)} ({100*min(i+batch_size, len(all_animals))/len(all_animals):.1f}%)")
            if i+batch_size < len(all_animals):
                await asyncio.sleep(0.1)
    
    elapsed = time.time() - start_time
    print("\n" + "="*80)
    print("COMPLETE")
    print("="*80)
    print(f"Time: {elapsed:.2f}s ({elapsed/60:.2f} min)")
    print(f"Throughput: {len(all_animals)/elapsed:.2f} animals/sec")
    print(f"Success: {stats['success']} ({100*stats['success']/stats['total']:.1f}%)")
    print(f"Failed: {stats['failed']}")
    print("="*80)
    return stats

if __name__ == "__main__":
    print("\niCattle.ai FAST Simulation\n")
    asyncio.run(run_simulation_async())
