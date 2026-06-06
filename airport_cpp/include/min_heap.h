#pragma once
#include <vector>
#include <stdexcept>
#include <functional>

// ============================================================
//  DSA: Generic Min-Heap Priority Queue
//  Time:  push O(log n), pop O(log n), top O(1)
//  Space: O(n)
//
//  Used by GateScheduler to order flights by arrival time so
//  the earliest-arriving flight is always processed first.
// ============================================================
template <typename T, typename Compare = std::less<T>>
class MinHeap {
public:
    explicit MinHeap(Compare cmp = Compare()) : cmp_(cmp) {}

    void push(const T& val) {
        data_.push_back(val);
        sift_up(static_cast<int>(data_.size()) - 1);
    }

    void pop() {
        if (data_.empty()) throw std::runtime_error("Heap is empty");
        data_[0] = data_.back();
        data_.pop_back();
        if (!data_.empty()) sift_down(0);
    }

    const T& top() const {
        if (data_.empty()) throw std::runtime_error("Heap is empty");
        return data_[0];
    }

    bool  empty() const { return data_.empty(); }
    int   size()  const { return static_cast<int>(data_.size()); }
    void  clear()       { data_.clear(); }

    // Expose raw storage so we can iterate without destroying the heap
    const std::vector<T>& raw() const { return data_; }

private:
    std::vector<T> data_;
    Compare        cmp_;

    // parent / children index helpers
    static int parent(int i)      { return (i - 1) / 2; }
    static int left_child(int i)  { return 2 * i + 1; }
    static int right_child(int i) { return 2 * i + 2; }

    void sift_up(int i) {
        while (i > 0) {
            int p = parent(i);
            // cmp_(a,b) means a < b for min-heap; swap when child is "less"
            if (cmp_(data_[i], data_[p])) {
                std::swap(data_[i], data_[p]);
                i = p;
            } else break;
        }
    }

    void sift_down(int i) {
        int n = static_cast<int>(data_.size());
        while (true) {
            int smallest = i;
            int l = left_child(i);
            int r = right_child(i);
            if (l < n && cmp_(data_[l], data_[smallest])) smallest = l;
            if (r < n && cmp_(data_[r], data_[smallest])) smallest = r;
            if (smallest == i) break;
            std::swap(data_[i], data_[smallest]);
            i = smallest;
        }
    }
};
