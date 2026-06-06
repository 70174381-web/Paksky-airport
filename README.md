# ✈ PakSky — Airport Management System

A full-stack airport operations and flight booking platform built with a **C++ DSA engine**, **Python FastAPI backend**, and **React + TypeScript frontend**.

![PakSky](https://img.shields.io/badge/PakSky-Airport%20Management-3b9eff?style=for-the-badge&logo=airplane)
![C++](https://img.shields.io/badge/C++-17-00599C?style=for-the-badge&logo=cplusplus)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)

---

## 🖥️ Screenshots

> Login → Book Flights → Airport Ops Map → Gate Scheduler → Weather Predictor

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  React Frontend (Vite + TS)                  │
│  LoginPage  │  BookingPortal  │  AirportMap  │  FlightPanel  │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP (axios) + WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│               FastAPI Backend (Python 3.11)                  │
│  /api/schedule  /api/predict-delay  /api/flights             │
│  /api/bookings  /api/gate-map       /ws/map                  │
└──────────────────────┬──────────────────────────────────────┘
                       │  subprocess stdin/stdout
┌──────────────────────▼──────────────────────────────────────┐
│              C++ DSA Engine (airport.exe)                    │
│  GateScheduler │ DelayPredictor │ AirportDB │ Graph          │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🔐 Authentication
- Login / Sign Up with role-based access (Admin / User)
- Animated login page with flying planes background
- Demo accounts included for testing

### ✈ Flight Booking Portal
- Search flights across **9 Pakistani airports** + 6 international destinations
- Filter by Domestic / International
- Dynamic ticket pricing in **PKR** based on route and demand
- **3 seat classes** — Economy 💺, Business 🛋️, First Class 👑
- Real-time seat availability per flight
- Full booking flow — select flight → choose class → passenger details → confirm
- Booking management — view and cancel bookings

### 📋 Flight Status Board
- Live departure board for any airport and date
- Status indicators: ON TIME / DELAYED / BOARDING / DEPARTED

### 🗺️ Live Airport Map
- Interactive **Leaflet map** centered on Pakistan
- Real-time plane tracking via **WebSocket** (updates every 1.5s)
- All 9 Pakistani airports plotted with domestic route lines
- Planes colored by aircraft class (Heavy/Medium/Light)

### ⬡ Gate Scheduler (C++ DSA)
- Assigns aircraft to gates using **MinHeap + HashMap + BFS + Dynamic Programming**
- Minimizes total delay across all flights
- Supports 5-flight and 10-flight demo sets

### ⛅ Weather Delay Predictor (C++ MLP)
- Predicts flight delay from wind, visibility, rain, snow
- Rule-based engine + hand-coded neural network
- Returns delay breakdown per weather factor

### ⊞ Gate Status Map
- Visual grid of Terminals A, B, C (9 gates total)
- Shows occupancy, capacity, and free time per gate

---

## 🧠 DSA Concepts Used

| Concept | Purpose | Complexity |
|---------|---------|------------|
| Min-Heap Priority Queue | Process flights by arrival order | O(log n) |
| Hash Map | Gate lookup by ID | O(1) |
| Adjacency-List Graph | Gate proximity network | O(V+E) |
| BFS | Nearest available gate search | O(V+E) |
| Dynamic Programming | Minimize total delay | O(n²) |
| Greedy Best-Fit | Gate assignment by capacity | O(n log n) |
| AVL BST | Sorted flight record index | O(log n) |
| Doubly Linked List | Position log FIFO | O(1) append |

---

## 🗂️ Project Structure

```
airport_fullstack/
├── airport_cpp/                  # C++ DSA Engine
│   ├── src/main.cpp
│   ├── include/
│   │   ├── types.h
│   │   ├── gate_scheduler.h     # MinHeap + HashMap + BFS + DP
│   │   ├── delay_predictor.h    # Rule engine + MLP neural net
│   │   ├── database.h           # AVL BST + Linked List
│   │   ├── graph.h
│   │   ├── hash_map.h
│   │   └── min_heap.h
│   ├── airport.exe              # Compiled Windows binary
│   └── Makefile
│
├── airport_app/
│   ├── backend/
│   │   ├── main.py              # FastAPI server (all endpoints)
│   │   └── requirements.txt
│   │
│   └── frontend/
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx          # Root + navigation + auth gate
│       │   ├── LoginPage.tsx    # Animated login / signup
│       │   ├── BookingPortal.tsx # Flight search + booking
│       │   ├── AirportMap.tsx   # Leaflet map + WebSocket
│       │   ├── FlightPanel.tsx  # Gate scheduler + weather
│       │   └── index.css
│       ├── package.json
│       └── vite.config.ts
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11
- Node.js 18+
- g++ (for recompiling C++ on Linux/Mac)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/paksky-airport.git
cd paksky-airport
```

### 2. Start the Backend
```bash
cd airport_app/backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start the Frontend
```bash
cd airport_app/frontend
npm install
npm run dev
```

### 4. Open the app
```
http://localhost:5173
```

### 5. Demo Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@paksky.pk | admin123 |
| User | user@paksky.pk | user123 |

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Backend + binary status |
| GET | `/api/flights` | Search flights (date, origin, destination) |
| GET | `/api/airports` | All airport data |
| GET | `/api/airlines` | All airline data |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings` | List all bookings |
| DELETE | `/api/bookings/{id}` | Cancel a booking |
| POST | `/api/schedule` | Run C++ gate scheduler |
| GET | `/api/schedule/demo/small` | 5-flight demo |
| GET | `/api/schedule/demo/large` | 10-flight demo |
| POST | `/api/predict-delay` | Weather delay prediction |
| GET | `/api/gate-map` | Gate occupancy status |
| GET | `/api/map/routes` | Flight route coordinates |
| WS | `/ws/map` | Live plane position stream |
| GET | `/docs` | Swagger UI (interactive API docs) |

---

## 🛫 Pakistani Airports Covered

| Code | Airport | City | Type |
|------|---------|------|------|
| KHI | Jinnah International | Karachi | International |
| LHE | Allama Iqbal International | Lahore | International |
| ISB | Islamabad International | Islamabad | International |
| PEW | Bacha Khan International | Peshawar | International |
| SKT | Sialkot International | Sialkot | International |
| MUX | Multan International | Multan | International |
| UET | Quetta International | Quetta | Domestic |
| LYP | Faisalabad International | Faisalabad | Domestic |
| GWD | Gwadar International | Gwadar | Domestic |

---

## ✈ Airlines Supported

| Code | Airline | Country |
|------|---------|---------|
| PK | Pakistan International Airlines | Pakistan |
| PA | Airblue | Pakistan |
| ER | Serene Air | Pakistan |
| EK | Emirates | UAE |
| QR | Qatar Airways | Qatar |
| TK | Turkish Airlines | Turkey |
| SV | Saudi Arabian Airlines | Saudi Arabia |
| FZ | flydubai | UAE |

---

## 🔧 Recompiling the C++ Binary

### Windows (MinGW)
```bash
cd airport_cpp
g++ -std=c++17 -O2 -o airport.exe src/main.cpp -I include
```

### Linux / Mac
```bash
cd airport_cpp
g++ -std=c++17 -O2 -o airport src/main.cpp -I include
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Map Library | Leaflet + React-Leaflet |
| HTTP Client | Axios |
| Backend | FastAPI (Python 3.11) |
| WebSocket | Python asyncio + websockets |
| DSA Engine | C++17 |
| Fonts | Syne + JetBrains Mono |

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">
  Made with ✈ for Pakistan
  <br/>
  <strong>KHI · LHE · ISB · PEW · DXB · DOH · LHR</strong>
</div>
