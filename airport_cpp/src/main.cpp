// ============================================================
//  Airport Management System – C++ / DSA Edition
//  Entry point: interactive console application
//
//  DSA Concepts Used:
//   1. Min-Heap Priority Queue  – flight ordering by arrival
//   2. Hash Map (unordered_map) – O(1) gate lookup
//   3. Adjacency-List Graph     – gate proximity network
//   4. BFS                      – nearest available gate
//   5. Dynamic Programming      – minimise total delay
//   6. AVL BST                  – sorted flight index (log n)
//   7. Doubly Linked List       – position log (FIFO)
//   8. Greedy Best-Fit          – gate assignment heuristic
// ============================================================

#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <sstream>
#include <limits>
#include <cmath>
#include <random>
#include <thread>
#include <chrono>

#include "types.h"
#include "gate_scheduler.h"
#include "delay_predictor.h"
#include "database.h"

// ── ANSI colour helpers ──────────────────────────────────────
#define CLR_RESET  "\033[0m"
#define CLR_BOLD   "\033[1m"
#define CLR_CYAN   "\033[36m"
#define CLR_GREEN  "\033[32m"
#define CLR_YELLOW "\033[33m"
#define CLR_RED    "\033[31m"
#define CLR_BLUE   "\033[34m"
#define CLR_MAGENTA "\033[35m"

// ── Utility helpers ──────────────────────────────────────────

static std::string time_str(int minutes) {
    // Convert minute-from-midnight to HH:MM
    std::ostringstream oss;
    oss << std::setw(2) << std::setfill('0') << minutes / 60
        << ":"
        << std::setw(2) << std::setfill('0') << minutes % 60;
    return oss.str();
}

static void separator(char ch = '-', int width = 60) {
    std::cout << std::string(width, ch) << "\n";
}

static void banner() {
    separator('=');
    std::cout << CLR_BOLD << CLR_CYAN
              << "  [*]  Airport Gate Management System  (C++ / DSA)\n"
              << CLR_RESET;
    separator('=');
}

static int read_int(const std::string& prompt, int lo, int hi) {
    int val;
    while (true) {
        std::cout << CLR_YELLOW << prompt << CLR_RESET;
        if (std::cin >> val && val >= lo && val <= hi) {
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            return val;
        }
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cout << CLR_RED << "  Invalid. Enter a number between "
                  << lo << " and " << hi << ".\n" << CLR_RESET;
    }
}

static double read_double(const std::string& prompt, double lo, double hi) {
    double val;
    while (true) {
        std::cout << CLR_YELLOW << prompt << CLR_RESET;
        if (std::cin >> val && val >= lo && val <= hi) {
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            return val;
        }
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cout << CLR_RED << "  Invalid. Enter a number between "
                  << lo << " and " << hi << ".\n" << CLR_RESET;
    }
}

// ── Print helpers ────────────────────────────────────────────

static void print_flight_table(const std::vector<Flight>& flights) {
    if (flights.empty()) {
        std::cout << CLR_YELLOW << "  (no flights)\n" << CLR_RESET;
        return;
    }
    std::cout << CLR_BOLD
              << std::left
              << std::setw(8)  << "Flight"
              << std::setw(10) << "Arrival"
              << std::setw(12) << "Departure"
              << std::setw(6)  << "Size"
              << std::setw(8)  << "Gate"
              << std::setw(10) << "Delay"
              << CLR_RESET << "\n";
    separator('-');
    for (const auto& f : flights) {
        std::string gate_col = f.gate.empty() ? "---" : f.gate;
        std::string colour   = (f.gate == "UNASSIGNED") ? CLR_RED : CLR_GREEN;
        std::cout << colour
                  << std::left
                  << std::setw(8)  << f.id
                  << std::setw(10) << time_str(f.arrival)
                  << std::setw(12) << time_str(f.departure)
                  << std::setw(6)  << f.size
                  << std::setw(8)  << gate_col
                  << std::setw(10) << (std::to_string(f.delay) + " min")
                  << CLR_RESET << "\n";
    }
}

static void print_gate_map(const HashMap<Gate>& gates) {
    std::cout << CLR_BOLD << "\n  Gate Status Map:\n" << CLR_RESET;
    separator('-');
    for (const auto& tid : {"A", "B", "C"}) {
        std::cout << CLR_BOLD << "  Terminal " << tid << ": " << CLR_RESET;
        for (int n = 1; n <= 3; ++n) {
            std::string gid = std::string(tid) + std::to_string(n);
            if (gates.contains(gid)) {
                const Gate& g = gates.get(gid);
                std::string status = g.occupied ? CLR_RED "■" CLR_RESET
                                                : CLR_GREEN "□" CLR_RESET;
                std::cout << "  " << gid << "[cap=" << g.capacity
                          << "] " << status
                          << " free@" << CLR_CYAN << time_str(g.free_at) << CLR_RESET;
            }
        }
        std::cout << "\n";
    }
    separator('-');
    std::cout << CLR_GREEN "  □ Available   " CLR_RESET
              << CLR_RED "■ Occupied\n" CLR_RESET;
}

static void print_bfs_path(const std::vector<std::string>& path) {
    std::cout << CLR_CYAN << "  BFS traversal: " << CLR_RESET;
    for (size_t i = 0; i < path.size(); ++i) {
        std::cout << CLR_BOLD << path[i] << CLR_RESET;
        if (i + 1 < path.size()) std::cout << " → ";
    }
    std::cout << "\n";
}

// ── Sample flight sets ───────────────────────────────────────

static std::vector<Flight> sample_flights_small() {
    return {
        {"PK301",  480,  600, 3, "", 0},
        {"PK502",  490,  610, 2, "", 0},
        {"EK201",  500,  700, 3, "", 0},
        {"TK101",  510,  580, 1, "", 0},
        {"QR011",  600,  720, 2, "", 0},
    };
}

static std::vector<Flight> sample_flights_large() {
    return {
        {"PK301",  480,  600, 3, "", 0},
        {"PK502",  490,  610, 2, "", 0},
        {"EK201",  500,  700, 3, "", 0},
        {"TK101",  510,  580, 1, "", 0},
        {"QR011",  600,  720, 2, "", 0},
        {"SQ007",  620,  800, 3, "", 0},
        {"BA101",  630,  750, 2, "", 0},
        {"AA200",  640,  760, 1, "", 0},
        {"DL303",  700,  840, 3, "", 0},
        {"UA404",  720,  900, 2, "", 0},
    };
}

static std::vector<Flight> generate_random_flights(int n) {
    std::mt19937 rng{std::random_device{}()};
    std::uniform_int_distribution<int> arr_dist(360, 1200);  // 6:00–20:00
    std::uniform_int_distribution<int> dur_dist(30,  180);
    std::uniform_int_distribution<int> sz_dist (1,   3);

    std::vector<std::string> prefixes = {"PK","EK","QR","TK","BA","AA","SQ","DL","UA","LH"};
    std::uniform_int_distribution<int> pfx_dist(0, prefixes.size()-1);
    std::uniform_int_distribution<int> num_dist(100, 999);

    std::vector<Flight> flights;
    for (int i = 0; i < n; ++i) {
        int arr = arr_dist(rng);
        int dep = arr + dur_dist(rng);
        std::string id = prefixes[pfx_dist(rng)] + std::to_string(num_dist(rng));
        flights.push_back({id, arr, dep, sz_dist(rng), "", 0});
    }
    return flights;
}

// ── Module handlers ──────────────────────────────────────────

static void module_schedule(GateScheduler& scheduler, AirportDB& db) {
    std::cout << CLR_BOLD << "\n[ Flight Gate Scheduler ]\n" << CLR_RESET;
    std::cout << "  1. Use 5-flight demo set\n"
              << "  2. Use 10-flight demo set\n"
              << "  3. Generate random flights\n"
              << "  4. Enter flights manually\n";
    int choice = read_int("  Choice: ", 1, 4);

    std::vector<Flight> flights;
    if      (choice == 1) flights = sample_flights_small();
    else if (choice == 2) flights = sample_flights_large();
    else if (choice == 3) {
        int n = read_int("  How many flights? (1–20): ", 1, 20);
        flights = generate_random_flights(n);
    } else {
        int n = read_int("  How many flights? (1–20): ", 1, 20);
        for (int i = 0; i < n; ++i) {
            Flight f;
            std::cout << "  --- Flight " << (i+1) << " ---\n";
            std::cout << "  ID (e.g. PK301): ";
            std::cin  >> f.id;
            f.arrival    = read_int("  Arrival   (minutes from midnight, 0–1439): ", 0, 1439);
            f.departure  = read_int("  Departure (minutes from midnight, 0–1439): ", 0, 1439);
            f.size       = read_int("  Aircraft size (1=small, 2=medium, 3=large): ", 1, 3);
            flights.push_back(f);
        }
    }

    std::cout << "\n" << CLR_BOLD << "  Input Flights:\n" << CLR_RESET;
    separator('-');
    print_flight_table(flights);

    // ── Schedule ──────────────────────────────────────────────
    scheduler.reset();
    for (const auto& f : flights)
        scheduler.add_flight(f);

    std::cout << "\n  " << CLR_CYAN << "[DSA] Popping from min-heap by arrival time...\n"
              << CLR_RESET;
    // Small animation
    for (int i = 0; i < 3; ++i) {
        std::cout << "  Scheduling";
        for (int j = 0; j < i+1; ++j) std::cout << ".";
        std::cout << "\r" << std::flush;
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
    }
    std::cout << "\n";

    std::vector<Flight> assigned = scheduler.assign_gates();
    int min_delay = scheduler.minimize_delay(flights);

    std::cout << "\n" << CLR_BOLD << "  Assignment Results:\n" << CLR_RESET;
    separator('-');
    print_flight_table(assigned);

    std::cout << "\n  " << CLR_GREEN << CLR_BOLD
              << "  Min total delay (DP): " << min_delay << " min\n"
              << CLR_RESET;

    // Persist to in-memory DB (BST)
    for (const auto& f : assigned) {
        db.store_flight({f.id, f.gate, f.arrival, f.departure, f.delay});
    }

    print_gate_map(scheduler.gates());

    // Show BFS traversal
    std::cout << "\n  " << CLR_CYAN
              << "[DSA] BFS gate traversal from A1:\n" << CLR_RESET;
    auto bfs = scheduler.bfs_from("A1");
    print_bfs_path(bfs);
}

static void module_weather(const DelayPredictor& predictor) {
    std::cout << CLR_BOLD << "\n[ Weather Delay Predictor ]\n" << CLR_RESET;
    std::cout << "  1. Manual weather input\n"
              << "  2. Run preset scenarios\n";
    int choice = read_int("  Choice: ", 1, 2);

    if (choice == 1) {
        WeatherInput w;
        w.wind_speed = read_double("  Wind speed  (0–100 km/h): ", 0, 100);
        w.visibility = read_double("  Visibility  (0–10 km):    ", 0, 10);
        w.rain       = read_double("  Rain        (0–50 mm/h):  ", 0, 50);
        w.snow       = read_double("  Snow        (0–30 cm/h):  ", 0, 30);

        separator('-');
        double delay = predictor.predict(w);
        std::cout << CLR_GREEN << "  Predicted delay: " << delay << " min\n" << CLR_RESET;
        std::cout << predictor.explain(w);
    } else {
        struct Scenario { std::string name; WeatherInput w; };
        std::vector<Scenario> scenarios = {
            {"Clear sky",        {5,  10, 0, 0}},
            {"Windy",            {40, 8,  0, 0}},
            {"Heavy rain",       {20, 5, 15, 0}},
            {"Snowstorm",        {30, 1,  0, 5}},
            {"Severe weather",   {60, 0.5, 20, 3}},
        };

        std::cout << "\n" << CLR_BOLD
                  << std::left
                  << std::setw(20) << "Scenario"
                  << std::setw(12) << "Wind(km/h)"
                  << std::setw(10) << "Vis(km)"
                  << std::setw(10) << "Rain"
                  << std::setw(8)  << "Snow"
                  << std::setw(12) << "Delay(min)"
                  << CLR_RESET << "\n";
        separator('-');
        for (auto& s : scenarios) {
            double d = predictor.predict(s.w);
            std::string colour = d > 30 ? CLR_RED : d > 10 ? CLR_YELLOW : CLR_GREEN;
            std::cout << colour
                      << std::left
                      << std::setw(20) << s.name
                      << std::setw(12) << s.w.wind_speed
                      << std::setw(10) << s.w.visibility
                      << std::setw(10) << s.w.rain
                      << std::setw(8)  << s.w.snow
                      << std::setw(12) << d
                      << CLR_RESET << "\n";
        }
    }
}

static void module_database(AirportDB& db) {
    std::cout << CLR_BOLD << "\n[ In-Memory Database (AVL BST + Linked List) ]\n" << CLR_RESET;
    std::cout << "  1. Show all flight records (sorted – BST inorder)\n"
              << "  2. Search flight by ID (BST O(log n))\n"
              << "  3. Show latest plane positions (Linked List)\n"
              << "  4. Simulate live position log\n";
    int choice = read_int("  Choice: ", 1, 4);

    if (choice == 1) {
        auto records = db.all_flights_sorted();
        if (records.empty()) {
            std::cout << CLR_YELLOW << "  No records yet. Run the scheduler first.\n" << CLR_RESET;
            return;
        }
        std::cout << "\n" << CLR_BOLD
                  << std::left
                  << std::setw(10) << "FlightID"
                  << std::setw(8)  << "Gate"
                  << std::setw(10) << "Arrival"
                  << std::setw(12) << "Departure"
                  << std::setw(8)  << "Delay"
                  << CLR_RESET << "\n";
        separator('-');
        for (auto& r : records) {
            std::cout << CLR_GREEN
                      << std::left
                      << std::setw(10) << r.flight_id
                      << std::setw(8)  << r.assigned_gate
                      << std::setw(10) << time_str(r.arrival)
                      << std::setw(12) << time_str(r.departure)
                      << std::setw(8)  << (std::to_string(r.delay) + " min")
                      << CLR_RESET << "\n";
        }
        std::cout << "\n  Total records: " << db.flight_count() << "\n";

    } else if (choice == 2) {
        std::string id;
        std::cout << CLR_YELLOW << "  Enter flight ID: " << CLR_RESET;
        std::cin >> id;
        FlightRecord* rec = db.find_flight(id);
        if (rec) {
            std::cout << CLR_GREEN << "  Found: " << rec->flight_id
                      << " → Gate " << rec->assigned_gate
                      << " | Arrival: "   << time_str(rec->arrival)
                      << " | Departure: " << time_str(rec->departure)
                      << " | Delay: "     << rec->delay << " min\n" << CLR_RESET;
        } else {
            std::cout << CLR_RED << "  Flight " << id << " not found.\n" << CLR_RESET;
        }

    } else if (choice == 3) {
        auto positions = db.get_recent_positions();
        if (positions.empty()) {
            std::cout << CLR_YELLOW << "  No positions logged. Run simulation first.\n"
                      << CLR_RESET;
            return;
        }
        std::cout << "\n" << CLR_BOLD
                  << std::left
                  << std::setw(10) << "FlightID"
                  << std::setw(12) << "Latitude"
                  << std::setw(14) << "Longitude"
                  << "Timestamp\n" << CLR_RESET;
        separator('-');
        for (auto& p : positions) {
            std::cout << CLR_CYAN
                      << std::left
                      << std::setw(10) << p.flight_id
                      << std::fixed << std::setprecision(4)
                      << std::setw(12) << p.lat
                      << std::setw(14) << p.lng
                      << p.timestamp
                      << CLR_RESET << "\n";
        }

    } else {
        // Simulate 4 live flights updating positions
        std::vector<std::pair<std::string, std::pair<double,double>>> live = {
            {"PK301", {33.9425, -118.4081}},
            {"PK502", {33.9450, -118.4100}},
            {"EK201", {33.9400, -118.4050}},
            {"TK101", {33.9380, -118.4020}},
        };
        std::mt19937 rng{42};
        std::uniform_real_distribution<double> jitter(-0.0005, 0.0005);

        std::cout << CLR_CYAN << "  Simulating 5 position ticks...\n" << CLR_RESET;
        for (int tick = 0; tick < 5; ++tick) {
            std::cout << "  Tick " << (tick+1) << ": ";
            for (auto& [id, pos] : live) {
                pos.first  += jitter(rng);
                pos.second += jitter(rng);
                db.log_position(id, pos.first, pos.second);
                std::cout << id << " ";
            }
            std::cout << "\n";
            std::this_thread::sleep_for(std::chrono::milliseconds(300));
        }
        std::cout << CLR_GREEN << "  Logged " << db.position_count()
                  << " position records.\n" << CLR_RESET;
    }
}

static void module_dsa_demo(const GateScheduler& scheduler) {
    std::cout << CLR_BOLD << "\n[ DSA Concepts Demo ]\n" << CLR_RESET;
    std::cout << "  1. Min-Heap walkthrough\n"
              << "  2. BFS gate search from each terminal start\n"
              << "  3. Dynamic programming – delay minimisation\n"
              << "  4. Hash map performance info\n";
    int choice = read_int("  Choice: ", 1, 4);

    if (choice == 1) {
        std::cout << CLR_CYAN << "\n  Min-Heap Priority Queue Demo\n" << CLR_RESET;
        separator('-');
        std::cout << "  Inserting flights into min-heap by arrival time:\n\n";

        MinHeap<std::pair<int,std::string>,
                std::less<std::pair<int,std::string>>> h;
        std::vector<std::pair<int,std::string>> inserts = {
            {600,"PK502"}, {480,"PK301"}, {720,"QR011"},
            {510,"TK101"}, {500,"EK201"}
        };
        for (auto& [t, id] : inserts) {
            h.push({t, id});
            std::cout << CLR_YELLOW << "  push(" << id << ", t=" << time_str(t)
                      << ")  → top = " << h.top().second
                      << " (" << time_str(h.top().first) << ")\n" << CLR_RESET;
        }
        std::cout << "\n  Popping in priority order:\n\n";
        while (!h.empty()) {
            auto [t, id] = h.top(); h.pop();
            std::cout << CLR_GREEN << "  pop → " << id
                      << " (arrival " << time_str(t) << ")\n" << CLR_RESET;
        }
        std::cout << "\n  Each push/pop: O(log n)\n";

    } else if (choice == 2) {
        for (const std::string start : {"A1", "B1", "C1"}) {
            std::cout << CLR_CYAN << "\n  BFS from " << start << ":\n" << CLR_RESET;
            auto path = scheduler.bfs_from(start);
            print_bfs_path(path);
        }
        std::cout << "\n  BFS time complexity: O(V + E)\n";
        std::cout << "  V = " << 9 << " gates, E = "
                  << 10 << " edges\n";

    } else if (choice == 3) {
        std::cout << CLR_CYAN << "\n  DP Delay Minimisation Demo\n" << CLR_RESET;
        separator('-');
        auto flights = sample_flights_small();
        int n = flights.size();
        std::cout << "  n = " << n << " flights\n\n";
        std::cout << CLR_BOLD
                  << std::setw(4)  << "i"
                  << std::setw(10) << "Flight"
                  << std::setw(10) << "Delay_i"
                  << std::setw(10) << "dp[i]"
                  << CLR_RESET << "\n";
        separator('-');
        std::vector<int> dp(n + 1, 0);
        for (int i = 1; i <= n; ++i) {
            int delay = std::max(0, flights[i-1].arrival - flights[i-1].departure);
            dp[i] = std::min(dp[i-1], dp[i-1] + delay);
            std::cout << CLR_GREEN
                      << std::setw(4)  << i
                      << std::setw(10) << flights[i-1].id
                      << std::setw(10) << delay
                      << std::setw(10) << dp[i]
                      << CLR_RESET << "\n";
        }
        std::cout << "\n  " << CLR_BOLD << "Minimum total delay = dp[" << n
                  << "] = " << dp[n] << " min" << CLR_RESET << "\n";
        std::cout << "  Time: O(n)  Space: O(n)\n";

    } else {
        std::cout << CLR_CYAN << "\n  Hash Map Performance\n" << CLR_RESET;
        separator('-');
        const auto& gates = scheduler.gates();
        std::cout << "  " << gates.size() << " gates stored in hash map\n"
                  << "  Lookup complexity: O(1) average\n\n";
        for (const std::string id : {"A1","B2","C3"}) {
            if (gates.contains(id)) {
                const Gate& g = gates.get(id);
                std::cout << CLR_GREEN << "  gates[\"" << id << "\"] → "
                          << "cap=" << g.capacity
                          << " occupied=" << (g.occupied ? "true" : "false")
                          << " free_at=" << time_str(g.free_at)
                          << CLR_RESET << "\n";
            }
        }
    }
}

// ── Main menu ────────────────────────────────────────────────

int main() {
    banner();
    std::cout << CLR_BOLD << "\n  Welcome to the C++ Airport Management System\n"
              << "  All core operations use hand-rolled DSA components.\n\n"
              << CLR_RESET;

    GateScheduler  scheduler;
    DelayPredictor predictor;
    AirportDB      db;

    while (true) {
        std::cout << "\n" << CLR_BOLD << "  MAIN MENU\n" << CLR_RESET;
        separator();
        std::cout << "  " << CLR_CYAN  << "[1]" << CLR_RESET << " Flight Gate Scheduler\n"
                  << "  " << CLR_CYAN  << "[2]" << CLR_RESET << " Weather Delay Predictor\n"
                  << "  " << CLR_CYAN  << "[3]" << CLR_RESET << " Database Viewer\n"
                  << "  " << CLR_CYAN  << "[4]" << CLR_RESET << " DSA Concepts Demo\n"
                  << "  " << CLR_CYAN  << "[5]" << CLR_RESET << " Show Gate Map\n"
                  << "  " << CLR_RED   << "[0]" << CLR_RESET << " Exit\n";
        separator();
        int opt = read_int("  Select option: ", 0, 5);

        switch (opt) {
            case 1: module_schedule(scheduler, db);           break;
            case 2: module_weather(predictor);                 break;
            case 3: module_database(db);                       break;
            case 4: module_dsa_demo(scheduler);                break;
            case 5: print_gate_map(scheduler.gates());         break;
            case 0:
                std::cout << CLR_GREEN << "\n  Goodbye! Safe travels. ✈\n\n"
                          << CLR_RESET;
                return 0;
        }
    }
}
