# OmniBin: AI-Based Smart Waste Management Backend

**OmniBin** is an advanced AI-driven smart waste management backend service designed to ingest real-time fill-level telemetry from IoT-enabled smart dustbins (e.g., ESP32 nodes), maintain real-time and historical analytics databases using **MongoDB**, and calculate optimal collection routes dynamically using **NetworkX** and **Numpy**.

---

## 🚀 Features

1. **IoT Data Ingestion**: Robust MQTT subscription service (`mqtt_listener.py`) listening for JSON payloads from field hardware sensors.
2. **Database Integration**: Synchronous PyMongo interface managing realtime dustbin states and a persistent time-series audit trail of fill levels.
3. **Optimization Engine**: Graph-theoretic route optimization using **NetworkX** Traveling Salesperson Problem (TSP) approximation and **Numpy** Haversine distance computations.
4. **RESTful API Layer**: High-performance **FastAPI** application featuring automatic interactive OpenAPI documentation.

---

## 📋 Prerequisites

- **Python**: Version 3.10 or higher.
- **MongoDB**: Running locally on `localhost:27017` or via an accessible remote cluster URI.
- **MQTT Broker**: Eclipse Mosquitto running locally on port `1883`, or a public cloud test broker.

---

## 🛠️ Setup & Installation

1. **Clone or Open the Repository**:
   Navigate to the project workspace directory (`d:\omnibin`).

2. **Create a Virtual Environment** (Recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate      # Linux/macOS
   .\venv\Scripts\activate       # Windows
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configuration**:
   Default parameters are set in `app/config.py`. You can override them by creating a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=omnibin
   MQTT_BROKER_HOST=localhost
   MQTT_BROKER_PORT=1883
   MQTT_TOPIC=omnibin/bins/fill_level
   ```

---

## 🚦 Running the Application Services

The system operates via two decoupled concurrent services:

### 1. REST API Server (FastAPI)
Start the web backend server using `uvicorn`:
```bash
uvicorn app.main:app --reload
```
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Docs**: `http://127.0.0.1:8000/redoc`

### 2. IoT Telemetry Listener (MQTT)
In a separate terminal, launch the subscriber loop to process device events:
```bash
python mqtt_listener.py
```

---

## 🌐 REST API Reference

### Seed Initial Testing Data
Populate default simulated bins so you can test routing immediately:
```bash
curl -X POST http://127.0.0.1:8000/api/bins/seed
```

### List All Bins
```bash
curl http://127.0.0.1:8000/api/bins
```

### Retrieve Optimal Routing Path
Trigger the NetworkX analysis engine to generate an ordered TSP cycle starting from the Central Depot:
```bash
curl http://127.0.0.1:8000/api/routes/optimal
```

### Retrieve Specific Bin History Logs
```bash
curl http://127.0.0.1:8000/api/bins/bin_001/history
```

---

## 📡 Simulating IoT Hardware Ingestion

Simulate an ESP32 publishing sensor data using the `mosquitto_pub` CLI tool:

```bash
mosquitto_pub -h localhost -p 1883 -t "omnibin/bins/fill_level" -m '{"bin_id": "bin_001", "fill_percentage": 88.5}'
```

Watch the terminal running `mqtt_listener.py` to observe real-time status adjustments, status triggers (e.g., transition to `Needs Collection` or `Critical`), and continuous background history saving.
