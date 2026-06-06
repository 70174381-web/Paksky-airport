#pragma once
#include <string>
#include <vector>
#include <limits>
#include <algorithm>

#include "types.h"
#include "min_heap.h"
#include "graph.h"
#include "hash_map.h"

// ============================================================
//  GateScheduler – orchestrates all DSA components:
//
//  1. MinHeap      – priority queue ordered by flight arrival
//  2. HashMap      – O(1) gate lookup by ID
//  3. GateGraph    – adjacency-list graph of gate proximity
//  4. BFS          – nearest available gate search (via graph)
//  5. Dynamic Prog – minimise total delay across all flights
//  6. Greedy       – best-fit gate assignment
// ============================================================
class GateScheduler {
public:
    GateScheduler() {
        build_gate_graph();
        add_default_gates();
    }

    // ── Public API ────────────────────────────────────────────

    void add_flight(const Flight& f) {
        // DSA: push onto min-heap keyed by arrival time → O(log n)
        flight_heap_.push({f.arrival, f});
    }

    // Assign gates to all queued flights; returns list of assignments
    std::vector<Flight> assign_gates() {
        std::vector<Flight> assigned;

        // Take a snapshot so we don't destroy the heap for later queries
        MinHeap<HeapEntry, HeapCmp> tmp = flight_heap_;

        while (!tmp.empty()) {
            auto [arrival, flight] = tmp.top(); tmp.pop();   // O(log n)

            std::string gate_id = find_best_gate(flight);

            if (gate_id.empty()) {
                // DSA: BFS on gate graph to find nearest available gate
                gate_id = gate_graph_.find_nearest("A1",
                    [&](const std::string& gid) {
                        if (!gates_.contains(gid)) return false;
                        const Gate& g = gates_.get(gid);
                        return !g.occupied && g.capacity >= flight.size;
                    });
            }

            if (!gate_id.empty()) {
                flight.gate = gate_id;
                Gate& g = gates_.get(gate_id);
                g.free_at  = flight.departure;
                g.occupied = true;
                assigned.push_back(flight);
            } else {
                // No gate available – record unassigned
                flight.gate = "UNASSIGNED";
                assigned.push_back(flight);
            }
        }
        return assigned;
    }

    // ── DSA: Dynamic Programming ──────────────────────────────
    //
    //  Problem: given n flights, each with a potential delay,
    //  find the schedule ordering that minimises total delay.
    //
    //  dp[i] = min total delay using the first i flights
    //  dp[i] = min(dp[i-1],  dp[i-1] + delay_i)
    //
    //  Here delay_i = max(0, arrival_i - departure_i)
    //  (a flight is delayed when it arrives after its scheduled departure)
    //
    //  Time:  O(n)   Space: O(n)
    int minimize_delay(const std::vector<Flight>& flights) {
        int n = static_cast<int>(flights.size());
        if (n == 0) return 0;

        std::vector<int> dp(n + 1, 0);
        for (int i = 1; i <= n; ++i) {
            int delay = std::max(0, flights[i-1].arrival - flights[i-1].departure);
            dp[i] = std::min(dp[i-1], dp[i-1] + delay);
        }
        return dp[n];
    }

    // ── DP: Optimal gate-assignment using interval scheduling ──
    //
    //  Sort flights by departure time (EDF).
    //  dp[i] = minimum number of gate-conflicts when scheduling
    //          flights 0..i.  Builds a 1-D DP table.
    //
    //  Time: O(n log n) sort + O(n²) DP
    int optimal_assignment_cost(std::vector<Flight> flights) {
        std::sort(flights.begin(), flights.end(),
            [](const Flight& a, const Flight& b){
                return a.departure < b.departure;
            });

        int n = static_cast<int>(flights.size());
        std::vector<int> dp(n, 0);   // dp[i] = conflicts scheduling 0..i

        for (int i = 1; i < n; ++i) {
            dp[i] = dp[i-1];  // base: no new conflict
            // Check every previous flight for a gate conflict
            for (int j = 0; j < i; ++j) {
                if (flights[j].gate == flights[i].gate &&
                    flights[j].departure > flights[i].arrival) {
                    dp[i] = std::min(dp[i], dp[j] + 1);
                }
            }
        }
        return dp[n - 1];
    }

    // ── Accessors ─────────────────────────────────────────────

    void reset() {
        flight_heap_.clear();
        for (auto& [id, gate] : gates_) {
            gate.occupied = false;
            gate.free_at  = 0;
        }
    }

    const HashMap<Gate>& gates()      const { return gates_; }
    const GateGraph&     gate_graph() const { return gate_graph_; }

    // Return BFS traversal order from a starting gate
    std::vector<std::string> bfs_from(const std::string& start) const {
        return gate_graph_.bfs(start);
    }

private:
    // ── Internal types ────────────────────────────────────────
    using HeapEntry = std::pair<int, Flight>;
    struct HeapCmp {
        bool operator()(const HeapEntry& a, const HeapEntry& b) const {
            return a.first < b.first;   // min by arrival time
        }
    };

    MinHeap<HeapEntry, HeapCmp> flight_heap_;  // DSA: min-heap
    HashMap<Gate>               gates_;         // DSA: hash map
    GateGraph                   gate_graph_;    // DSA: graph (adj. list)

    // ── Greedy best-gate selection ────────────────────────────
    //  Picks the gate that:
    //    1. Can handle the aircraft size (capacity >= size)
    //    2. Becomes free before the flight arrives
    //    3. Has the smallest capacity (best-fit to reduce waste)
    std::string find_best_gate(const Flight& f) {
        std::string best_id;
        int         best_cap = std::numeric_limits<int>::max();

        for (auto& [id, gate] : gates_) {
            if (gate.capacity >= f.size && gate.free_at <= f.arrival) {
                if (gate.capacity < best_cap) {
                    best_cap = gate.capacity;
                    best_id  = id;
                }
            }
        }
        return best_id;
    }

    // ── Graph construction ────────────────────────────────────
    void build_gate_graph() {
        // Terminal A
        gate_graph_.add_edge("A1", "A2");
        gate_graph_.add_edge("A2", "A3");
        gate_graph_.add_edge("A1", "A3");
        // Terminal A → B connector
        gate_graph_.add_edge("A2", "B1");
        gate_graph_.add_edge("A3", "B1");
        // Terminal B
        gate_graph_.add_edge("B1", "B2");
        gate_graph_.add_edge("B2", "B3");
        // Terminal B → C connector
        gate_graph_.add_edge("B3", "C1");
        // Terminal C
        gate_graph_.add_edge("C1", "C2");
        gate_graph_.add_edge("C2", "C3");
    }

    // ── Default gate data ─────────────────────────────────────
    void add_default_gates() {
        // {id, capacity}
        std::vector<std::pair<std::string,int>> defs = {
            {"A1", 3}, {"A2", 2}, {"A3", 1},
            {"B1", 3}, {"B2", 2}, {"B3", 1},
            {"C1", 3}, {"C2", 2}, {"C3", 1},
        };
        for (auto& [id, cap] : defs) {
            gates_.put(id, Gate{id, cap, false, 0});
        }
    }
};
