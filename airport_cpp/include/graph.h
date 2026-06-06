#pragma once
#include <string>
#include <unordered_map>
#include <vector>
#include <queue>
#include <unordered_set>
#include <functional>
#include <stdexcept>

// ============================================================
//  DSA: Undirected Graph – Adjacency List representation
//  Vertices: gate IDs (strings)
//  Edges:    physical proximity between gates
//
//  Provides:
//   • add_edge   – O(1)
//   • bfs        – O(V + E) breadth-first search
//   • find_nearest – BFS with a predicate, returns first match
// ============================================================
class GateGraph {
public:
    using Predicate = std::function<bool(const std::string&)>;

    // Add a bidirectional edge between two gates
    void add_edge(const std::string& a, const std::string& b) {
        adj_[a].push_back(b);
        adj_[b].push_back(a);
        // make sure isolated nodes still appear in the map
        adj_.try_emplace(a);
        adj_.try_emplace(b);
    }

    // Returns all vertices reachable from 'start' in BFS order
    std::vector<std::string> bfs(const std::string& start) const {
        if (adj_.find(start) == adj_.end()) return {};

        std::vector<std::string>   order;
        std::unordered_set<std::string> visited;
        std::queue<std::string>    q;

        visited.insert(start);
        q.push(start);

        while (!q.empty()) {
            std::string curr = q.front(); q.pop();
            order.push_back(curr);
            for (const auto& nb : neighbors(curr)) {
                if (!visited.count(nb)) {
                    visited.insert(nb);
                    q.push(nb);
                }
            }
        }
        return order;
    }

    // BFS from 'start', return the FIRST vertex satisfying 'pred'.
    // Returns "" if none found.
    std::string find_nearest(const std::string& start, Predicate pred) const {
        if (adj_.find(start) == adj_.end()) return "";

        std::unordered_set<std::string> visited;
        std::queue<std::string>         q;

        visited.insert(start);
        q.push(start);

        while (!q.empty()) {
            std::string curr = q.front(); q.pop();
            if (pred(curr)) return curr;
            for (const auto& nb : neighbors(curr)) {
                if (!visited.count(nb)) {
                    visited.insert(nb);
                    q.push(nb);
                }
            }
        }
        return "";
    }

    // Return all neighbour IDs of a given vertex
    const std::vector<std::string>& neighbors(const std::string& v) const {
        static const std::vector<std::string> empty;
        auto it = adj_.find(v);
        return it != adj_.end() ? it->second : empty;
    }

    std::vector<std::string> vertices() const {
        std::vector<std::string> vs;
        vs.reserve(adj_.size());
        for (auto& [k, _] : adj_) vs.push_back(k);
        return vs;
    }

private:
    // DSA: adjacency list – each key maps to its neighbour list
    std::unordered_map<std::string, std::vector<std::string>> adj_;
};
