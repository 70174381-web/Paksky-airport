#pragma once
#include <string>
#include <vector>
#include <memory>
#include <sstream>
#include <iomanip>
#include <ctime>
#include <algorithm>

#include "types.h"

// ============================================================
//  DSA: In-Memory Database using two structures:
//
//  1. Doubly Linked List  – stores PositionRecord log in
//     insertion order; O(1) append, O(n) scan.
//
//  2. BST (AVL-balanced)  – stores FlightRecord keyed by
//     flight ID for O(log n) search / insert.
// ============================================================

// ── 1. Doubly Linked List ─────────────────────────────────

template <typename T>
class LinkedList {
public:
    struct Node {
        T data;
        std::shared_ptr<Node> next;
        std::weak_ptr<Node>   prev;
    };

    void push_back(const T& val) {
        auto node = std::make_shared<Node>();
        node->data = val;
        if (!tail_) {
            head_ = tail_ = node;
        } else {
            node->prev  = tail_;
            tail_->next = node;
            tail_       = node;
        }
        ++size_;
    }

    // Keep only the most recent 'max_size' entries
    void trim(int max_size) {
        while (size_ > max_size && head_) {
            head_ = head_->next;
            if (head_) head_->prev.reset();
            else tail_.reset();
            --size_;
        }
    }

    // Collect all values into a vector (O(n))
    std::vector<T> to_vector() const {
        std::vector<T> out;
        out.reserve(size_);
        auto cur = head_;
        while (cur) { out.push_back(cur->data); cur = cur->next; }
        return out;
    }

    // Latest entry per flight_id (mimics QuestDB LATEST ON)
    // Works in O(n) — fine for our small log
    template <typename KeyFn>
    std::vector<T> latest_by(KeyFn key_fn) const {
        std::unordered_map<std::string, T> latest_map;
        auto cur = head_;
        while (cur) {
            latest_map[key_fn(cur->data)] = cur->data;
            cur = cur->next;
        }
        std::vector<T> out;
        for (auto& [_, v] : latest_map) out.push_back(v);
        return out;
    }

    int  size()  const { return size_; }
    bool empty() const { return size_ == 0; }

private:
    std::shared_ptr<Node> head_, tail_;
    int size_ = 0;
};

// ── 2. AVL BST for flight records ────────────────────────

struct FlightRecord {
    std::string flight_id;
    std::string assigned_gate;
    int         arrival;
    int         departure;
    int         delay;
};

class FlightBST {
public:
    void insert(const FlightRecord& rec) {
        root_ = insert_node(std::move(root_), rec);
    }

    // O(log n) search
    FlightRecord* search(const std::string& id) {
        return search_node(root_, id);
    }

    // In-order traversal → sorted by flight_id
    std::vector<FlightRecord> inorder() const {
        std::vector<FlightRecord> out;
        inorder_(root_, out);
        return out;
    }

    int size() const { return size_; }

private:
    struct Node {
        FlightRecord data;
        int          height = 1;
        std::unique_ptr<Node> left, right;
    };

    std::unique_ptr<Node> root_;
    int size_ = 0;

    int height(const std::unique_ptr<Node>& n) {
        return n ? n->height : 0;
    }
    int balance_factor(const std::unique_ptr<Node>& n) {
        return n ? height(n->left) - height(n->right) : 0;
    }
    void update_height(std::unique_ptr<Node>& n) {
        n->height = 1 + std::max(height(n->left), height(n->right));
    }

    std::unique_ptr<Node> rotate_right(std::unique_ptr<Node> y) {
        auto x  = std::move(y->left);
        y->left = std::move(x->right);
        update_height(y);
        x->right = std::move(y);
        update_height(x);
        return x;
    }
    std::unique_ptr<Node> rotate_left(std::unique_ptr<Node> x) {
        auto y   = std::move(x->right);
        x->right = std::move(y->left);
        update_height(x);
        y->left  = std::move(x);
        update_height(y);
        return y;
    }

    std::unique_ptr<Node> balance(std::unique_ptr<Node> n) {
        update_height(n);
        int bf = balance_factor(n);
        if (bf > 1) {
            if (balance_factor(n->left) < 0)
                n->left = rotate_left(std::move(n->left));
            return rotate_right(std::move(n));
        }
        if (bf < -1) {
            if (balance_factor(n->right) > 0)
                n->right = rotate_right(std::move(n->right));
            return rotate_left(std::move(n));
        }
        return n;
    }

    std::unique_ptr<Node> insert_node(std::unique_ptr<Node> n,
                                       const FlightRecord& rec) {
        if (!n) {
            ++size_;
            auto node    = std::make_unique<Node>();
            node->data   = rec;
            return node;
        }
        if (rec.flight_id < n->data.flight_id)
            n->left  = insert_node(std::move(n->left), rec);
        else if (rec.flight_id > n->data.flight_id)
            n->right = insert_node(std::move(n->right), rec);
        else
            n->data = rec;   // update existing
        return balance(std::move(n));
    }

    FlightRecord* search_node(const std::unique_ptr<Node>& n,
                               const std::string& id) const {
        if (!n) return nullptr;
        if (id == n->data.flight_id) return const_cast<FlightRecord*>(&n->data);
        if (id  < n->data.flight_id) return search_node(n->left, id);
        return search_node(n->right, id);
    }

    void inorder_(const std::unique_ptr<Node>& n,
                  std::vector<FlightRecord>& out) const {
        if (!n) return;
        inorder_(n->left, out);
        out.push_back(n->data);
        inorder_(n->right, out);
    }
};

// ── Public database facade ────────────────────────────────

class AirportDB {
public:
    static constexpr int MAX_LOG = 500;   // keep last 500 position entries

    void log_position(const std::string& flight_id, double lat, double lng) {
        // Get current timestamp string
        std::time_t now = std::time(nullptr);
        char buf[32];
        std::strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", std::localtime(&now));

        position_log_.push_back({flight_id, lat, lng, std::string(buf)});
        position_log_.trim(MAX_LOG);
    }

    std::vector<PositionRecord> get_recent_positions() const {
        // Latest position per flight (mimics QuestDB LATEST ON)
        return position_log_.latest_by(
            [](const PositionRecord& r){ return r.flight_id; });
    }

    void store_flight(const FlightRecord& rec) {
        flight_index_.insert(rec);
    }

    FlightRecord* find_flight(const std::string& id) {
        return flight_index_.search(id);
    }

    std::vector<FlightRecord> all_flights_sorted() const {
        return flight_index_.inorder();
    }

    int flight_count()   const { return flight_index_.size();   }
    int position_count() const { return position_log_.size();   }

private:
    LinkedList<PositionRecord> position_log_;
    FlightBST                  flight_index_;
};
