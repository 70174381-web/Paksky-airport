#pragma once
#include <unordered_map>
#include <string>
#include <vector>
#include <stdexcept>

// ============================================================
//  DSA: Hash Map – O(1) average-case lookup / insert / delete
//
//  Wraps std::unordered_map with a clean interface.
//  Used to store Gate objects keyed by gate ID, giving
//  O(1) random access by name (e.g. "A1", "B3").
// ============================================================
template <typename V>
class HashMap {
public:
    // Insert or overwrite
    void put(const std::string& key, const V& value) {
        map_[key] = value;
    }

    // O(1) lookup — throws if not found
    V& get(const std::string& key) {
        auto it = map_.find(key);
        if (it == map_.end())
            throw std::out_of_range("Key not found: " + key);
        return it->second;
    }

    const V& get(const std::string& key) const {
        auto it = map_.find(key);
        if (it == map_.end())
            throw std::out_of_range("Key not found: " + key);
        return it->second;
    }

    bool contains(const std::string& key) const {
        return map_.count(key) != 0;
    }

    void remove(const std::string& key) { map_.erase(key); }

    std::vector<std::string> keys() const {
        std::vector<std::string> ks;
        ks.reserve(map_.size());
        for (auto& [k, _] : map_) ks.push_back(k);
        return ks;
    }

    std::vector<V*> values() {
        std::vector<V*> vs;
        vs.reserve(map_.size());
        for (auto& [_, v] : map_) vs.push_back(&v);
        return vs;
    }

    int  size()  const { return static_cast<int>(map_.size()); }
    bool empty() const { return map_.empty(); }

    // Allow range-based for loops
    auto begin() { return map_.begin(); }
    auto end()   { return map_.end();   }
    auto begin() const { return map_.begin(); }
    auto end()   const { return map_.end();   }

private:
    std::unordered_map<std::string, V> map_;
};
