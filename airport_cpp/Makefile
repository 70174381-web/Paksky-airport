CXX      := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -O2 -I include
TARGET   := airport
SRC      := src/main.cpp

all: $(TARGET)

$(TARGET): $(SRC) include/*.h
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SRC)

clean:
	rm -f $(TARGET)

run: all
	./$(TARGET)

.PHONY: all clean run
