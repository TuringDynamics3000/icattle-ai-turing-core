"""
Real-time Simulation Dashboard Server
Developed by: TuringDynamics
"""
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import json
from datetime import datetime
from typing import List
import os

app = FastAPI(title="iCattle.ai Simulation Dashboard")

# Store connected WebSocket clients
connected_clients: List[WebSocket] = []

# Simulation statistics
stats = {
    "total_animals": 0,
    "processed": 0,
    "success": 0,
    "failed": 0,
    "current_batch": 0,
    "total_batches": 0,
    "throughput": 0.0,
    "start_time": None,
    "by_owner": {}
}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    connected_clients.append(websocket)
    
    # Send current stats immediately
    await websocket.send_json(stats)
    
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(1)
    except Exception:
        connected_clients.remove(websocket)


@app.post("/api/update")
async def update_stats(data: dict):
    """Receive updates from simulation"""
    global stats
    
    # Update stats
    if "total_animals" in data:
        stats["total_animals"] = data["total_animals"]
    if "processed" in data:
        stats["processed"] = data["processed"]
    if "success" in data:
        stats["success"] = data["success"]
    if "failed" in data:
        stats["failed"] = data["failed"]
    if "current_batch" in data:
        stats["current_batch"] = data["current_batch"]
    if "total_batches" in data:
        stats["total_batches"] = data["total_batches"]
    if "throughput" in data:
        stats["throughput"] = data["throughput"]
    if "start_time" in data and stats["start_time"] is None:
        stats["start_time"] = data["start_time"]
    if "by_owner" in data:
        stats["by_owner"] = data["by_owner"]
    
    # Broadcast to all connected clients
    for client in connected_clients:
        try:
            await client.send_json(stats)
        except:
            pass
    
    return {"status": "ok"}


@app.get("/api/stats")
async def get_stats():
    """Get current statistics"""
    return stats


@app.get("/")
async def get_dashboard():
    """Serve dashboard HTML"""
    html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>iCattle.ai Simulation Dashboard - TuringDynamics</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header .subtitle {
            color: #666;
            font-size: 1.1em;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .metric-card:hover {
            transform: translateY(-5px);
        }
        .metric-label {
            color: #888;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
        }
        .metric-sub {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .progress-section {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .progress-bar {
            width: 100%;
            height: 40px;
            background: #f0f0f0;
            border-radius: 20px;
            overflow: hidden;
            position: relative;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .owner-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .owner-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .owner-name {
            font-weight: bold;
            font-size: 1.2em;
            margin-bottom: 10px;
            color: #667eea;
        }
        .owner-metric {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-running { background: #4caf50; animation: pulse 2s infinite; }
        .status-idle { background: #ff9800; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐄 iCattle.ai Simulation Dashboard</h1>
            <div class="subtitle">
                <span class="status-indicator status-running"></span>
                Real-time Monitoring | Developed by TuringDynamics
            </div>
        </div>

        <div class="metrics">
            <div class="metric-card">
                <div class="metric-label">Total Animals</div>
                <div class="metric-value" id="total-animals">0</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Processed</div>
                <div class="metric-value" id="processed">0</div>
                <div class="metric-sub" id="progress-pct">0%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Success Rate</div>
                <div class="metric-value" id="success-rate">100%</div>
                <div class="metric-sub"><span id="success">0</span> / <span id="failed">0</span> failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Throughput</div>
                <div class="metric-value" id="throughput">0.0</div>
                <div class="metric-sub">animals/second</div>
            </div>
        </div>

        <div class="progress-section">
            <h2 style="margin-bottom: 15px;">Progress</h2>
            <div class="progress-bar">
                <div class="progress-fill" id="progress-bar" style="width: 0%">
                    <span id="progress-text">0%</span>
                </div>
            </div>
            <div style="margin-top: 15px; text-align: center; color: #666;">
                Batch <span id="current-batch">0</span> of <span id="total-batches">0</span>
            </div>
        </div>

        <div class="progress-section">
            <h2 style="margin-bottom: 15px;">By Owner</h2>
            <div class="owner-stats" id="owner-stats">
                <!-- Owner cards will be inserted here -->
            </div>
        </div>

        <div class="footer">
            © 2025 TuringDynamics | Production-Ready Event Sourcing Platform
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:8003/ws');
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            updateDashboard(data);
        };

        function updateDashboard(data) {
            document.getElementById('total-animals').textContent = data.total_animals || 0;
            document.getElementById('processed').textContent = data.processed || 0;
            document.getElementById('success').textContent = data.success || 0;
            document.getElementById('failed').textContent = data.failed || 0;
            document.getElementById('current-batch').textContent = data.current_batch || 0;
            document.getElementById('total-batches').textContent = data.total_batches || 0;
            document.getElementById('throughput').textContent = (data.throughput || 0).toFixed(1);
            
            const progress = data.total_animals > 0 ? (data.processed / data.total_animals * 100) : 0;
            document.getElementById('progress-pct').textContent = progress.toFixed(1) + '%';
            document.getElementById('progress-bar').style.width = progress + '%';
            document.getElementById('progress-text').textContent = progress.toFixed(1) + '%';
            
            const successRate = data.processed > 0 ? (data.success / data.processed * 100) : 100;
            document.getElementById('success-rate').textContent = successRate.toFixed(1) + '%';
            
            // Update owner stats
            if (data.by_owner) {
                const ownerStatsDiv = document.getElementById('owner-stats');
                ownerStatsDiv.innerHTML = '';
                
                for (const [ownerId, ownerData] of Object.entries(data.by_owner)) {
                    const card = document.createElement('div');
                    card.className = 'owner-card';
                    card.innerHTML = `
                        <div class="owner-name">${ownerData.name || ownerId}</div>
                        <div class="owner-metric">
                            <span>Total:</span>
                            <span>${ownerData.total || 0}</span>
                        </div>
                        <div class="owner-metric">
                            <span>Processed:</span>
                            <span>${ownerData.processed || 0}</span>
                        </div>
                        <div class="owner-metric">
                            <span>Success:</span>
                            <span style="color: #4caf50;">${ownerData.success || 0}</span>
                        </div>
                        <div class="owner-metric">
                            <span>Failed:</span>
                            <span style="color: #f44336;">${ownerData.failed || 0}</span>
                        </div>
                    `;
                    ownerStatsDiv.appendChild(card);
                }
            }
        }
    </script>
</body>
</html>
    """
    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    import uvicorn
    print("Starting Dashboard Server...")
    print("Dashboard URL: http://localhost:8003" )
    uvicorn.run(app, host="0.0.0.0", port=8003)
