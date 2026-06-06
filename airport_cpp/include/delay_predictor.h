#pragma once
#include <cmath>
#include <random>
#include <string>
#include <sstream>
#include <iomanip>

#include "types.h"

// ============================================================
//  DelayPredictor
//
//  Mirrors the PyTorch-based ai_model.py using a rule-based
//  engine (no external ML library needed for C++).
//
//  For educational purposes the class also ships a tiny
//  two-layer perceptron implemented from scratch with:
//    • forward pass using tanh activations
//    • random weight initialisation (Xavier)
//  demonstrating that neural nets are just linear algebra.
// ============================================================

// ── Tiny MLP (2 layers) ────────────────────────────────────
struct Matrix {
    int rows, cols;
    std::vector<double> data;

    Matrix(int r, int c) : rows(r), cols(c), data(r * c, 0.0) {}

    double& at(int r, int c)       { return data[r * cols + c]; }
    double  at(int r, int c) const { return data[r * cols + c]; }
};

// Matrix × vector
static std::vector<double> mat_vec(const Matrix& M, const std::vector<double>& x) {
    std::vector<double> out(M.rows, 0.0);
    for (int i = 0; i < M.rows; ++i)
        for (int j = 0; j < M.cols; ++j)
            out[i] += M.at(i, j) * x[j];
    return out;
}

static std::vector<double> vec_add(const std::vector<double>& a,
                                   const std::vector<double>& b) {
    std::vector<double> out(a.size());
    for (size_t i = 0; i < a.size(); ++i) out[i] = a[i] + b[i];
    return out;
}

static std::vector<double> tanh_act(const std::vector<double>& x) {
    std::vector<double> out(x.size());
    for (size_t i = 0; i < x.size(); ++i) out[i] = std::tanh(x[i]);
    return out;
}

// ── Predictor class ────────────────────────────────────────
class DelayPredictor {
public:
    DelayPredictor() {
        // Xavier initialisation: uniform(-sqrt(6/(fan_in+fan_out)), ...)
        init_weights(W1_, b1_, 4, 8);   // 4 inputs → 8 hidden
        init_weights(W2_, b2_, 8, 4);   // 8 hidden → 4 hidden
        init_weights(W3_, b3_, 4, 1);   // 4 hidden → 1 output
    }

    // Rule-based prediction (deterministic, interpretable)
    double predict_rule_based(const WeatherInput& w) const {
        double delay = 0.0;
        if (w.wind_speed  > 30.0) delay += 15.0;
        if (w.visibility  <  3.0) delay += 20.0;
        if (w.rain        >  5.0) delay += 10.0;
        if (w.snow        >  0.0) delay += 30.0;
        // Severity scaling
        if (w.wind_speed  > 50.0) delay += 10.0;
        if (w.visibility  <  1.0) delay += 15.0;
        return delay;
    }

    // MLP forward pass (trained only on synthetic data here;
    // weights are random — illustrates the architecture)
    double predict_mlp(const WeatherInput& w) const {
        std::vector<double> x = {
            w.wind_speed / 60.0,
            w.visibility / 10.0,
            w.rain       / 20.0,
            w.snow       / 10.0
        };
        auto h1  = tanh_act(vec_add(mat_vec(W1_, x),  b1_));
        auto h2  = tanh_act(vec_add(mat_vec(W2_, h1), b2_));
        auto out = vec_add(mat_vec(W3_, h2), b3_);
        // Output in [0,1]; scale to realistic delay range (0–60 min)
        return std::max(0.0, out[0] * 60.0);
    }

    // Combined prediction (rule-based primary + MLP secondary)
    double predict(const WeatherInput& w) const {
        double rule  = predict_rule_based(w);
        double mlp   = predict_mlp(w);
        // Weighted average + small noise
        static std::mt19937 rng{42};
        std::uniform_real_distribution<double> noise(0.0, 5.0);
        return std::round((rule * 0.7 + mlp * 0.3 + noise(rng)) * 10.0) / 10.0;
    }

    std::string explain(const WeatherInput& w) const {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(1);
        oss << "Delay breakdown:\n";
        if (w.wind_speed  > 30.0) oss << "  Wind speed   +" << 15.0 << " min\n";
        if (w.visibility  <  3.0) oss << "  Low vis      +" << 20.0 << " min\n";
        if (w.rain        >  5.0) oss << "  Rain         +" << 10.0 << " min\n";
        if (w.snow        >  0.0) oss << "  Snow         +" << 30.0 << " min\n";
        oss << "  Predicted    = " << predict(w) << " min\n";
        return oss.str();
    }

private:
    Matrix W1_{4, 4}, W2_{4, 4}, W3_{4, 4};  // placeholder dims before init
    std::vector<double> b1_, b2_, b3_;

    void init_weights(Matrix& W, std::vector<double>& b, int rows, int cols) {
        W = Matrix(rows, cols);
        b.assign(rows, 0.0);
        double limit = std::sqrt(6.0 / (rows + cols));
        std::mt19937 rng{std::random_device{}()};
        std::uniform_real_distribution<double> dist(-limit, limit);
        for (auto& v : W.data) v = dist(rng);
    }
};
