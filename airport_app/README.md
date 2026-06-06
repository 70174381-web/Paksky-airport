# ✈ Airport Management System – Full Stack

A complete airport operations dashboard that connects a **C++ DSA engine** to a **React + TypeScript** frontend via a **FastAPI Python bridge**.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   React Frontend (Vite + TypeScript)                 │
│   ├─ AirportMap.tsx   – Live Leaflet map + WebSocket │
│   └─ FlightPanel.tsx  – Scheduler / Weather / Gates  │
│                  ↑ axios / WebSocket                 │
│   FastAPI Backend (Python)                           │
│   ├─ POST /api/schedule        – Gate assignment     │
│   ├─ POST /api/predict-delay   – Weather delay       │
│   ├─ GET  /api/gate-map        – Gate status         │
│   └─ WS   /ws/map              – Live plane coords   │
│                  ↑ subprocess stdin/stdout           │
│   C++ Binary (airport_cpp/airport)                   │
│   ├─ GateScheduler   MinHeap + HashMap + BFS + DP    │
│   ├─ DelayPredictor  Rule-based + MLP neural net     │
│   └─ AirportDB       AVL BST + Doubly Linked List    │
└──────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# One-command launch (from this directory)
chmod +x start.sh && ./start.sh
```

Then open **http://localhost:5173**

## Manual Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
airport_app/
├── start.sh                    # One-click launcher
├── backend/
│   ├── main.py                 # FastAPI server
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── AirportMap.tsx      # Leaflet map + WS
│       └── FlightPanel.tsx     # Control panel
└── ../airport_cpp/             # Pre-compiled C++ binary
    ├── airport                 # The binary
    ├── src/main.cpp
    └── include/
        ├── types.h
        ├── gate_scheduler.h    # MinHeap + HashMap + BFS + DP
        ├── delay_predictor.h   # Rule + MLP predictor
        ├── database.h          # AVL BST + Linked List
        ├── graph.h
        ├── hash_map.h
        └── min_heap.h
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/schedule` | Run gate assignment for custom flights |
| GET | `/api/schedule/demo/small` | 5-flight demo via C++ |
| GET | `/api/schedule/demo/large` | 10-flight demo via C++ |
| POST | `/api/predict-delay` | Weather delay prediction |
| GET | `/api/gate-map` | Current gate occupancy |
| WS | `/ws/map` | Live plane position stream |
| GET | `/docs` | Interactive Swagger UI |

## DSA Concepts (from C++ engine)

1. **Min-Heap Priority Queue** – flights ordered by arrival time, O(log n) push/pop
2. **Hash Map** – O(1) gate lookup by ID  
3. **Adjacency-List Graph** – gate proximity network (3 terminals × 3 gates)
4. **BFS** – nearest available gate search when greedy fails
5. **Dynamic Programming** – minimize total delay across all flights O(n)
6. **Greedy Best-Fit** – gate assignment (smallest sufficient capacity)
7. **AVL BST** – sorted flight record index, O(log n) search
8. **Doubly Linked List** – position log FIFO, O(1) append

## Frontend Features

- **Live Map** – WebSocket-powered plane movement around LAX with custom icons sized by aircraft class
- **Gate Scheduler** – Send flights to C++ engine, see assignments with terminal color-coding
- **Weather Predictor** – Sliders feed into C++ MLP+rule engine, returns delay with breakdown
- **Gate Map** – Visual terminal grid showing occupancy in real time
