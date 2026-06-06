# Airport Gate Management System — C++ / DSA Edition

A complete rewrite of the original Python/React airport system in **pure C++17**,
with every core operation backed by a hand-rolled data structure.

---

## DSA Concepts Used

| # | Data Structure / Algorithm | Where Used | Complexity |
|---|---------------------------|------------|------------|
| 1 | **Min-Heap Priority Queue** | Order flights by arrival time | push/pop O(log n) |
| 2 | **Hash Map** (`unordered_map`) | O(1) gate lookup by ID | O(1) avg |
| 3 | **Adjacency-List Graph** | Gate proximity network | O(V+E) space |
| 4 | **BFS** | Nearest available gate search | O(V+E) |
| 5 | **Dynamic Programming** | Minimise total flight delay | O(n) |
| 6 | **AVL BST** | Sorted flight index (log n search) | O(log n) |
| 7 | **Doubly Linked List** | Position log (FIFO, latest-per-flight) | O(1) append |
| 8 | **Greedy Best-Fit** | Gate assignment heuristic | O(g) per flight |

---

## Project Structure

```
airport_cpp/
├── include/
│   ├── types.h           # Domain structs: Flight, Gate, WeatherInput …
│   ├── min_heap.h        # Generic templated min-heap (sift-up/down)
│   ├── hash_map.h        # Hash map wrapper with clean API
│   ├── graph.h           # Undirected adjacency-list graph + BFS
│   ├── gate_scheduler.h  # Orchestrator – uses heap, map, graph, DP
│   ├── delay_predictor.h # Rule-based + tiny MLP delay predictor
│   └── database.h        # Linked list log + AVL BST flight index
├── src/
│   └── main.cpp          # Interactive CLI application
└── Makefile
```

---

## Build & Run

### Requirements
- g++ with C++17 support (GCC 7+ or Clang 5+)

### Build
```bash
make          # or: g++ -std=c++17 -O2 -I include -o airport src/main.cpp
```

### Run
```bash
./airport     # or: make run
```

---

## Features

### 1. Flight Gate Scheduler
- Add flights manually, use demo sets, or generate random ones
- Min-heap pops earliest-arriving flights first
- Greedy best-fit assigns the smallest-capacity gate that fits
- BFS fallback finds the nearest available gate via the graph
- DP computes the minimum achievable total delay

### 2. Weather Delay Predictor
- Rule-based engine (wind / visibility / rain / snow)
- Tiny 2-layer MLP perceptron implemented from scratch (Xavier init, tanh)
- Preset scenario comparison table

### 3. In-Memory Database
- AVL BST stores flight records; search in O(log n)
- Doubly linked list stores position log (auto-trimmed to 500 entries)
- "Latest position per flight" mimics QuestDB `LATEST ON` semantics

### 4. DSA Concepts Demo
- Min-heap step-by-step push/pop walkthrough
- BFS traversal from each terminal start node
- DP delay minimisation table printed step-by-step
- Hash map O(1) gate lookup demo

---

## Original Stack vs C++ Rewrite

| Component | Original | C++ Rewrite |
|-----------|----------|-------------|
| Scheduler DSA | Python `heapq`, `deque`, `dict` | Custom `MinHeap<T>`, `GateGraph`, `HashMap<T>` |
| Database | QuestDB (TimeSeries SQL) | `LinkedList<T>` + `FlightBST` (AVL) |
| AI Model | PyTorch MLP | Hand-rolled MLP (linear algebra, no libs) |
| API | FastAPI + WebSocket | Interactive CLI |
| Frontend | React + TypeScript | ANSI-colour terminal UI |
