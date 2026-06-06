#pragma once
#include <string>
#include <vector>

// ============================================================
//  Core domain types
// ============================================================

struct Flight {
    std::string id;
    int    arrival;     // minutes from midnight
    int    departure;   // minutes from midnight
    int    size;        // 1 = small, 2 = medium, 3 = large
    std::string gate;   // assigned gate (filled by scheduler)
    int    delay = 0;   // predicted/calculated delay (minutes)
};

struct Gate {
    std::string id;
    int  capacity;      // max aircraft size it can handle
    bool occupied = false;
    int  free_at  = 0;  // minute when gate becomes available
};

struct WeatherInput {
    double wind_speed  = 0.0;
    double visibility  = 10.0;
    double rain        = 0.0;
    double snow        = 0.0;
};

struct ScheduleResult {
    std::vector<Flight> assigned;
    int                 minimum_total_delay = 0;
};

struct PositionRecord {
    std::string flight_id;
    double lat, lng;
    std::string timestamp;
};
