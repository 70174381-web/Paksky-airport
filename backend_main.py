"""
Airport Management System – FastAPI Backend
Bridges the C++ binary with the React frontend via:
  - REST endpoints for schedule & delay prediction
  - WebSocket for live plane position streaming
"""

import subprocess
import re
import json
import asyncio
import random
import math
import platform
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# ── Path to compiled C++ binary ───────────────────────────────
_exe = "airport.exe" if platform.system() == "Windows" else "airport"
BINARY = Path(__file__).parent.parent / "airport_cpp" / _exe

app = FastAPI(title="Airport Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
#  Pydantic models
# ─────────────────────────────────────────────────────────────

class FlightIn(BaseModel):
    id: str
    arrival: int
    departure: int
    size: int

class WeatherIn(BaseModel):
    wind_speed: float
    visibility: float
    rain: float
    snow: float

class FlightOut(BaseModel):
    id: str
    arrival: int
    departure: int
    size: int
    gate: Optional[str] = None
    delay: int = 0

class ScheduleResponse(BaseModel):
    assigned: List[FlightOut]
    minimum_total_delay: int

class DelayResponse(BaseModel):
    predicted_delay_minutes: float
    breakdown: dict

# ─────────────────────────────────────────────────────────────
#  C++ binary interaction helpers
# ─────────────────────────────────────────────────────────────

ANSI_ESCAPE = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

def strip_ansi(text: str) -> str:
    return ANSI_ESCAPE.sub('', text)

def run_cpp(stdin_input: str) -> str:
    """Run the C++ binary with given stdin and return stripped stdout."""
    if not BINARY.exists():
        raise FileNotFoundError(
            f"C++ binary not found at: {BINARY}\n"
            f"Please compile it first:\n"
            f"  cd airport_cpp\n"
            f"  g++ -std=c++17 -O2 -o airport src/main.cpp -I include"
        )
    result = subprocess.run(
        [str(BINARY)],
        input=stdin_input,
        capture_output=True,
        text=True,
        timeout=10
    )
    return strip_ansi(result.stdout)

def minutes_to_hhmm(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"

# ─────────────────────────────────────────────────────────────
#  Parse the C++ schedule output
# ─────────────────────────────────────────────────────────────

def parse_schedule_output(raw: str, flights: List[FlightIn]) -> ScheduleResponse:
    assigned = []
    min_delay = 0

    delay_match = re.search(r'Min total delay.*?:\s*(\d+)', raw)
    if delay_match:
        min_delay = int(delay_match.group(1))

    in_results = False
    for line in raw.splitlines():
        line = line.strip()
        if 'Assignment Results' in line:
            in_results = True
            continue
        if in_results and 'Gate Status Map' in line:
            break
        if not in_results:
            continue

        m = re.match(
            r'^(\w+)\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d+)\s+(\S+)\s+(\d+)',
            line
        )
        if m:
            flight_id, arr_str, dep_str, size, gate, delay = m.groups()
            arr_h, arr_m = map(int, arr_str.split(':'))
            dep_h, dep_m = map(int, dep_str.split(':'))
            assigned.append(FlightOut(
                id=flight_id,
                arrival=arr_h * 60 + arr_m,
                departure=dep_h * 60 + dep_m,
                size=int(size),
                gate=gate if gate != '---' else None,
                delay=int(delay)
            ))

    if not assigned:
        for f in flights:
            assigned.append(FlightOut(
                id=f.id, arrival=f.arrival, departure=f.departure,
                size=f.size, gate=None, delay=0
            ))

    return ScheduleResponse(assigned=assigned, minimum_total_delay=min_delay)

# ─────────────────────────────────────────────────────────────
#  REST Endpoints
# ─────────────────────────────────────────────────────────────

@app.post("/api/schedule", response_model=ScheduleResponse)
async def schedule_flights(flights: List[FlightIn]):
    n = len(flights)
    lines = ["1", "4", str(n)]
    for f in flights:
        lines += [f.id, str(f.arrival), str(f.departure), str(f.size)]
    lines.append("0")
    stdin = "\n".join(lines) + "\n"
    raw = run_cpp(stdin)
    return parse_schedule_output(raw, flights)


@app.get("/api/schedule/demo/{size}", response_model=ScheduleResponse)
async def schedule_demo(size: str):
    choice = "1" if size == "small" else "2"
    stdin = f"1\n{choice}\n0\n"
    raw = run_cpp(stdin)

    demo = [
        FlightIn(id="PK301", arrival=480, departure=600, size=3),
        FlightIn(id="PK502", arrival=490, departure=610, size=2),
        FlightIn(id="EK201", arrival=500, departure=700, size=3),
        FlightIn(id="TK101", arrival=510, departure=580, size=1),
        FlightIn(id="QR011", arrival=600, departure=720, size=2),
    ]
    if size == "large":
        demo += [
            FlightIn(id="SQ007", arrival=620, departure=800, size=3),
            FlightIn(id="BA101", arrival=630, departure=750, size=2),
            FlightIn(id="AA200", arrival=640, departure=760, size=1),
            FlightIn(id="DL303", arrival=700, departure=840, size=3),
            FlightIn(id="UA404", arrival=720, departure=900, size=2),
        ]
    return parse_schedule_output(raw, demo)


@app.post("/api/predict-delay", response_model=DelayResponse)
async def predict_delay(weather: WeatherIn):
    stdin = (
        f"2\n1\n"
        f"{weather.wind_speed}\n"
        f"{weather.visibility}\n"
        f"{weather.rain}\n"
        f"{weather.snow}\n"
        f"0\n"
    )
    raw = run_cpp(stdin)

    delay = 0.0
    m = re.search(r'Predicted delay:\s*([\d.]+)', raw)
    if m:
        delay = float(m.group(1))

    breakdown = {}
    for factor, pattern in [
        ("wind_speed", r'Wind speed\s+\+([\d.]+)'),
        ("visibility", r'Low vis\s+\+([\d.]+)'),
        ("rain",       r'Rain\s+\+([\d.]+)'),
        ("snow",       r'Snow\s+\+([\d.]+)'),
    ]:
        bm = re.search(pattern, raw)
        if bm:
            breakdown[factor] = float(bm.group(1))

    return DelayResponse(
        predicted_delay_minutes=delay,
        breakdown=breakdown
    )


@app.get("/api/gate-map")
async def gate_map():
    stdin = "5\n0\n"
    raw = run_cpp(stdin)

    gates = []
    for m in re.finditer(r'([A-C][1-3])\[cap=(\d+)\]\s*[■□]\s+free@(\d{2}:\d{2})', raw):
        gid, cap, free = m.groups()
        h, mn = map(int, free.split(':'))
        occupied = '■' in raw[m.start()-10:m.start()]
        gates.append({
            "id": gid,
            "capacity": int(cap),
            "occupied": occupied,
            "free_at": h * 60 + mn,
            "terminal": gid[0]
        })
    return {"gates": gates}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "binary": str(BINARY),
        "binary_exists": BINARY.exists(),
        "platform": platform.system()
    }

# ─────────────────────────────────────────────────────────────
#  WebSocket – live plane position simulation
# ─────────────────────────────────────────────────────────────

LAX_CENTER = (33.9425, -118.4081)
PLANES_BASE = [
    {"id": "PK301", "lat": 33.9425, "lng": -118.4081, "size": 3, "heading": 45},
    {"id": "PK502", "lat": 33.9450, "lng": -118.4130, "size": 2, "heading": 120},
    {"id": "EK201", "lat": 33.9380, "lng": -118.4050, "size": 3, "heading": 270},
    {"id": "TK101", "lat": 33.9400, "lng": -118.3990, "size": 1, "heading": 200},
    {"id": "QR400", "lat": 33.9460, "lng": -118.4020, "size": 2, "heading": 350},
]

active_connections: List[WebSocket] = []

def move_plane(plane: dict) -> dict:
    speed = 0.0003 * (0.5 + plane["size"] * 0.2)
    plane["heading"] = (plane["heading"] + random.uniform(-5, 5)) % 360
    heading_rad = math.radians(plane["heading"])
    plane["lat"] += math.cos(heading_rad) * speed * random.uniform(0.8, 1.2)
    plane["lng"] += math.sin(heading_rad) * speed * random.uniform(0.8, 1.2)
    dlat = plane["lat"] - LAX_CENTER[0]
    dlng = plane["lng"] - LAX_CENTER[1]
    dist = math.sqrt(dlat**2 + dlng**2)
    if dist > 0.08:
        plane["heading"] = (math.degrees(math.atan2(-dlng, -dlat))) % 360
    return plane

planes_state = [dict(p) for p in PLANES_BASE]

@app.websocket("/ws/map")
async def websocket_map(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    global planes_state
    try:
        while True:
            planes_state = [move_plane(p) for p in planes_state]
            payload = [
                {"id": p["id"], "lat": p["lat"], "lng": p["lng"], "size": p["size"]}
                for p in planes_state
            ]
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1.5)
    except WebSocketDisconnect:
        active_connections.remove(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
