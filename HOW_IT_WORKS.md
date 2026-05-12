# OmniBin: Architectural Blueprint & System Lifecycle
**Team: The WittyBytes**  
*AI-Driven Next-Generation Urban Solid Waste Logistics & Fleet Optimization Platform*

---

## Executive Summary
Urban municipal bodies globally struggle with highly static, inefficient solid waste collection schedules. Waste collection vehicles routinely follow rigid paths regardless of real-time container fill states. This blind dispatch model leads to overflowing bins creating health hazards, empty bins being collected unnecessarily, excessive diesel consumption, inflated carbon emissions, and inflated municipal operating expenditures.

**OmniBin** solves this systemic operational gap by transforming solid waste management into a highly dynamic, self-optimizing system. By coupling physical **IoT telemetry** with a state-of-the-art **Multi-Objective Operations Research engine (Google OR-Tools)**, OmniBin calculates optimal collection sequences in real time. It clusters priority nodes, rigorously enforces multi-stop fleet capacity models, allows dynamic midway vehicle unloading, and mathematically penalizes unnecessary vehicle spawns to achieve absolute fleet minimization and shortest paths.

---

## Step 1: Data Ingestion (The IoT Layer)
The transformation of physical urban waste accumulation into digital actionable telemetry begins at the container lid.

* **Sensor Layer:** Custom-fabricated hardware mounts utilize high-precision **Ultrasonic Sensors** directed downwards into the waste cavity to calculate continuous acoustic distance thresholds.
* **Microcontroller Edge Processing:** Low-power edge boards (**Arduino / ESP32**) compute localized raw metrics into accurate volumetric percentages (`fill_percentage`).
* **Wireless Packetization:** Telemetry frames are assembled into lightweight, structured JSON payloads containing unique physical identifiers (`bin_id`), geo-coordinates, and operational flags.
* **Transport Layer:** Packets stream over local Wi-Fi interfaces via the asynchronous **MQTT Protocol** directly to a centralized, high-throughput **Mosquitto Message Broker**, ensuring minimal bandwidth overhead and reliable packet persistence.

---

## Step 2: Processing & Storage (Backend Layer)
Once the broker receives live frames, the backend ingestion pipeline routes, normalizes, and persists the telemetry streams for dispatch evaluation.

```
[IoT Sensor Nodes] ---> (MQTT / Mosquitto Broker) ---> [FastAPI Event Consumer] ---> (MongoDB Atlas Cloud)
```

* **FastAPI Orchestrator:** High-performance async Python endpoints validate incoming payloads instantly using strict **Pydantic schemas**, filtering erroneous distance spikes or uncalibrated readings.
* **Real-Time Classification Engine:** Containers are tagged with distinct actionable operational statuses:
  * **`< 50%`**: `OK` (Passive monitoring)
  * **`50% - 80%`**: `Needs Collection` (Scheduled queueing)
  * **`> 80%`**: `Critical` (Immediate preemptive dispatch override)
* **MongoDB Atlas Persistence:** The structured document store persists real-time states in the `bins` collection while appending historical timelines to a dedicated analytics history collection. This drives localized reporting trends and predictive cluster models.

---

## Step 3: The AI Routing Engine (The Core Math Innovation)
The primary breakthrough of OmniBin lies within `app/services/routing.py`. Standard routing algorithms solve simplistic short-path cycles (TSP). OmniBin implements a generalized **Multi-Objective Capacitated Vehicle Routing Problem (CVRP) with Intermediate Disposal Nodes** powered by **Google OR-Tools**.

### 1. Vectorized Matrix Formulation
Iterating over city networks in raw Python is computationally prohibitive. OmniBin extracts node coordinates (Depot, Bins, and Disposal Facilities) into flat **NumPy arrays** and applies advanced matrix broadcasting to calculate the complete Great-Circle (Haversine) distance array in a single CPU pass.

### 2. Multi-Objective Fleet Cost Penalty
To force the solver to prioritize packing vehicles to absolute capacity before dispatching additional drivers, we inject a flat synthetic constant: **`VAN_DISPATCH_FIXED_COST`**.
$$\text{Cost}_{\text{Total}} = \sum (\text{Distance}_{\text{Arc}} \times \text{FuelCost}) + (\text{Vans}_{\text{Active}} \times \text{FixedDispatchPenalty})$$
By heavily weighting the vehicle activation variable, the mathematical solver instantly discovers that routing an existing active vehicle a few extra kilometers is vastly cheaper than spawning a secondary vehicle.

### 3. Intermediate Mid-Route Dumping Architecture
Traditional CVRP engines terminate a route immediately when maximum load limit is reached. OmniBin models urban logistics authentically:
* **Dummy Disposal Nodes:** The engine automatically crafts localized optional intermediate disposal nodes mapping directly to real physical processing centers (e.g., *Adampur Chhawani Landfill & Bio-CNG Plant*, *Bhanpur Trenching Ground*, *Danapani GTS*).
* **Optional Disjunctions:** These intermediate sites are registered using `routing.AddDisjunction([node_index], 0)`, signaling to the solver that mid-route visits are completely optional.
* **Capacity Dimension Reset:** Intermediate sites are assigned absorbing negative demands (`-scaled_van_capacity`) coupled with maximum slack absorption. If a vehicle approaches its physical limit (e.g., 500 Liters), the engine routes it to the localized disposal node. The load variable drops smoothly back to zero, allowing continuous round-trip collection along the remainder of the geographic cluster.

---

## Step 4: Real-Time Visualization (Frontend Layer)
The computed dispatch manifest sequences stream down to a **React.js + Tailwind CSS** dispatcher dashboard crafted with an immersive dark-mode glassmorphic interface.

* **High-Fidelity Leaflet Canvas:** Integration with `react-leaflet` establishes an interactive spatial mapping interface.
* **OSRM Geometry Snapping:** Abstract straight-line OR-Tools vectors are fed to the **Open Source Routing Machine (OSRM) API**, returning high-resolution road-snapped GeoJSON polylines.
* **Focus + Context UX Dimming:** To prevent map clutter during multi-vehicle runs, selecting a specific driver route triggers real-time Set evaluations. Unvisited physical bins instantly shed their bright pulsing warning rings and fall back to dark muted gray nodes, focusing dispatch attention squarely on active target stops.
* **Dynamic Settings Control:** Dispatchers can open an interactive modal setting drawer to manually tune constraints on the fly (`van_capacity`, `mileage_kmpl`, `fuel_price`), triggering real-time route matrix re-evaluations server-side.

---

## Step 5: The AI Dispatch Assistant
To assist human dispatch operators in tracking complex urban flows, OmniBin incorporates a persistent context-injected LLM layer.

* **Model Orchestration:** Leveraging **Claude 3.5 Sonnet / Llama 3** frameworks via OpenRouter APIs.
* **Live Database Context Injection:** Before executing conversational completions, the backend injects live diagnostic summaries directly from MongoDB Atlas (e.g., critical bin arrays, current active truck count, regional fuel burn totals).
* **Natural Language Command:** Operators can query plain-text operations: *"Which collection sector is experiencing the highest container saturation today?"* or *"Provide an audit trail of priority node alerts over the last 3 hours."* The AI responds instantly with precise spatial intelligence.

---

## Business Viability & Impact Metrics
Deploying OmniBin translates directly into measurable macro-economic and ecological sustainability wins for smart-city authorities.

### 💰 Direct Operating Cost Minimization
* **Fleet Rationalization:** Eliminating static blind sweeps reduces municipal active fleet vehicle sizes by an estimated **35% to 45%**.
* **Fuel & Wear Reductions:** Vector-optimized OSRM road paths ensure shortest possible drive times, saving thousands of liters of unburned diesel monthly and extending heavy vehicle service cycles.

### 🌍 Ecological & Carbon Footprint Abatement
* **CO2 Eradication:** Minimized engine idle times and fewer deployed vehicles immediately lower urban greenhouse gas footprints.
* **Sanitation Protection:** Preemptive collection of priority-tier containers prevents open toxic overflow, vector-borne illnesses, and soil leaching.

### 📈 Scalable Municipal Asset Deployment
* **Hardware Interoperability:** Low-cost edge processing modules enable highly scalable retrofitting across thousands of existing legacy metal or composite urban containers without heavy initial capital outlays.
* **Future-Proof Logistics:** The underlying OR-Tools VRP architecture easily scales up to accommodate hundreds of collection nodes, multi-depot configurations, time-window constraints, and mixed vehicle classes as urban borders expand.
