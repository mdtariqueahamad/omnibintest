# 🗑️ OmniBin — Smart Waste Management Platform

> **A full-stack, AI-powered smart city waste management system built for Bhopal, India.**
> This document walks through every feature of the project step-by-step, ideal for live demos, college presentations, and project showcases.

---

## 📦 Tech Stack at a Glance

| Layer | Technology |
|---|---|
| **Backend** | FastAPI (Python) |
| **Database** | MongoDB Atlas |
| **IoT Layer** | MQTT over HiveMQ Cloud (TLS) |
| **AI / LLM** | LLaMA 3.3 70B + LLaMA 3.2 Vision (via OpenRouter) |
| **Routing Engine** | Google OR-Tools (CVRP Solver) + OSRM (Road-Snapped Geometry) |
| **ML Prediction** | Scikit-learn Linear Regression on historical IoT data |
| **Frontend** | React 19 + Vite + Tailwind CSS |
| **Maps** | Leaflet + React-Leaflet |
| **Graph Engine** | NetworkX (Haversine TSP fallback) |

---

## 🗺️ Feature Walkthrough

---

### Step 1 — The Login Page (Role-Based Access Control)

**URL:** `http://localhost:5173/`

Three distinct roles are supported:

| Role | Access Level | How to Log In |
|---|---|---|
| **Admin** | Full system control — dashboard, routing, fleet config, complaints | Click **Admin Login** → enter credentials |
| **Van Operator** | Personal route view, mark self as live/offline | Click **Operator Login** → enter `operator1 / password123` |
| **Citizen (Guest)** | Public map & complaint form only | Click **Continue Without Login** / **Report Garbage** |

**What to show:**
- Switch between all three roles to demonstrate RBAC
- Notice the route `/dashboard` is protected — trying to access it without admin auth redirects to login

---

### Step 2 — Admin Dashboard (Command Center)

**URL:** `http://localhost:5173/dashboard`

The main control panel. Divided into 5 panels:

#### 2a. Overview Cards
Real-time KPI tiles at the top of the dashboard showing:
- **Total Bins** registered in the system
- **Critical Bins** (fill ≥ 90%) — highlighted in red
- **Needs Collection** (fill ≥ 70%) — highlighted in amber
- **OK Bins** — green

> These numbers are **live from MongoDB** and update every time you refresh.

#### 2b. Bin Status Cards (Zone Grid)
Below the KPIs, each IoT dustbin is shown as a card with:
- 📍 Location name (e.g., "MP Nagar Zone 1", "DB City Mall Entrance")
- 📊 Animated fill-level progress bar (color changes: green → amber → red)
- 🕐 Last MQTT update timestamp
- 🔢 Confidence percentage (sensor reliability score)
- 🏷️ Priority badge (Low / Medium / High)
- Status pill: **OK / Needs Collection / Critical**

**What to show:**
- Click **Randomize Bins** (Quick Actions panel) to simulate live urban activity — watch all the cards animate and update simultaneously.

#### 2c. Quick Actions Panel
One-click operational controls:
- **Seed Bins** — Populates the DB with 4 realistic Bhopal bin locations if empty
- **Seed History** — Generates 48 hours of synthetic IoT time-series data for all bins (used by the ML prediction engine)
- **Randomize Bins** — Randomizes all fill levels to simulate live data

---

### Step 3 — Interactive Map View

**Tab: Map** on the Admin Dashboard sidebar

A full Leaflet.js map centered on Bhopal showing:
- **Bin Markers** — Color-coded by status (green/amber/red). Click any marker to see a popup with bin ID, fill %, and location.
- **Optimized Route Overlay** — After generating a route (Step 4), the actual road-snapped polyline appears on the map, drawn using OSRM road geometry.
- **Van Operator Markers** — When operators are live, their real-time GPS positions appear as distinct van icons.
- **Waste Disposal Facilities** — Adampur, Bhanpur, and Danapani GTS are marked.

**What to show:**
- Click a bin marker to show its popup details
- After generating a route (Step 4), switch to the map to see the route drawn on real Bhopal roads

---

### Step 4 — AI-Powered Route Optimization (CVRP Engine)

**Tab: Route Panel** on the Admin Dashboard sidebar

This is the most technically impressive feature.

#### How it works (under the hood):
1. **Filters bins** that need collection (fill ≥ 70%, status = Critical/Needs Collection, or High Priority ≥ 50%)
2. **Builds a cost matrix** using vectorized Haversine + fuel cost (configurable)
3. **Solves a Capacitated Vehicle Routing Problem (CVRP)** using Google OR-Tools with:
   - Van capacity constraints
   - Multi-objective: minimize total distance AND number of vans dispatched (fixed penalty)
   - Guided Local Search metaheuristic (5-second time budget)
   - Intermediate dump site nodes at Adampur / Bhanpur / Danapani for large routes
4. **Fetches real road-snapped geometry** concurrently via the OSRM public API
5. Falls back to **NetworkX TSP approximation** if OSRM is unavailable

#### What to show:
1. Click **Generate Optimal Route** (Static Mode — routes from Bhopal Nagar Nigam depot)
2. Watch the route appear with:
   - Van-by-van breakdown (Van 1, Van 2, …)
   - Step-by-step bin collection order with fill levels
   - 📏 Distance in km
   - ⛽ Fuel consumption in liters
   - 💰 Estimated cost in INR
   - Total fleet summary at the top

**Predicted Route Mode:**
Click **Predicted Route (12h)** to run the routing engine on **ML-predicted future fill levels** instead of current readings. The system will route to bins that aren't critical yet, but will be in 12 hours.

---

### Step 5 — ML Fill-Level Prediction

**API:** `GET /api/bins/{bin_id}/predict?hours_ahead=12`

Each bin has a dedicated ML endpoint that:
1. Fetches the last 100 historical MQTT readings from MongoDB
2. Detects the last emptying event (a drop > 10% = bin was just emptied)
3. Isolates the **current filling segment** since last emptying
4. Trains a **Scikit-learn Linear Regression** model on the time-elapsed vs. fill-level data
5. Predicts the fill level `N` hours in the future
6. Calculates **hours until full** (if fill rate > 0)
7. Returns a confidence flag (`error_rate_high`) if < 3 data points were available

**Returns:**
```json
{
  "bin_id": "bin_001",
  "predicted_fill_percentage": 87.4,
  "hours_until_full": 3,
  "error_rate_high": false,
  "data_points_used": 48,
  "target_future_timestamp": "2026-05-15T10:00:00Z"
}
```

**Batch prediction** for all bins at once: `GET /api/bins/predict_all/batch?hours_ahead=12`

---

### Step 6 — AI Chat Assistant (LLM-Powered)

**Floating button (bottom-right corner) on Admin Dashboard**

An AI chatbot powered by **LLaMA 3.3 70B** via OpenRouter. It is context-aware — the live state of all bins is injected into the system prompt automatically.

**Try these questions:**
- *"Which bins are most critical right now?"*
- *"How many bins need collection today?"*
- *"Which zone should I prioritize first?"*
- *"What's the fill level at DB City Mall?"*

The AI answers based exclusively on real-time DB state — not hallucinated data.

---

### Step 7 — Fleet Configuration (Dynamic Parameters)

**Button: Fleet Config** (top-right of Route Panel)

A modal that lets you update fleet parameters on the fly, which **directly affect the routing cost calculations**:

| Parameter | Default | Effect |
|---|---|---|
| Van Capacity | 500 L | Determines how many bins per van before a disposal trip |
| Mileage (km/L) | 5.5 km/L | Used to calculate fuel consumption |
| Fuel Price | ₹95/L | Used to calculate route cost in INR |

Changes persist in the DB and immediately affect the next route generation.

---

### Step 8 — Complaints System (Citizen Reporting with AI Vision)

**URL:** `http://localhost:5173/complaint`
**Admin View:** Complaints Panel on the Admin Dashboard sidebar

Citizens can submit a garbage dumping complaint with:
- 📝 Description text
- 📍 Location name + GPS coordinates
- 📷 Photo upload (camera/gallery)

**AI Vision Analysis (LLaMA 3.2 Vision 11B):**
When a photo is attached, the backend sends it to a vision LLM which analyzes it and returns:
- **Garbage Quantity:** `critical` / `moderate` / `normal`
- **Confidence Score:** percentage (0–100%)

**Admin Complaint Panel shows:**
- All submitted complaints sorted by newest
- AI severity tag and confidence score per complaint
- Status management: **Pending → In Progress → Resolved**

---

### Step 9 — Bottle Scanner / Plastic Detection

**Tab: Bottle Scanner** on Admin Dashboard (or standalone)

An AI-powered tool that detects plastic bottles in photos. Upload or capture an image and the system uses **LLaMA 3.2 Vision 11B** to classify:
- ✅ `is_plastic_bottle: true` with confidence score
- ❌ `is_plastic_bottle: false`

Useful for automated sorting/recycling compliance checks at smart bins.

**API:** `POST /api/detection/plastic-bottle`

---

### Step 10 — Operator Dashboard (Field View)

**URL:** `http://localhost:5173/operator-dashboard`
**Login:** `operator1 / password123` (or operator2, operator3)

A simplified, mobile-friendly dashboard for van drivers:
- View their assigned route and bin collection order
- **Go Live** button — sets their GPS location in the DB and activates dynamic routing mode
- **Mark Offline** when shift ends
- Location is tracked and visible on the Admin Map in real time

---

### Step 11 — Real-Time IoT Data Ingestion (MQTT)

**File:** `mqtt_listener.py` (run separately)

The backend subscribes to a **HiveMQ Cloud MQTT broker** over **TLS (port 8883)**:
- Topic: `omnibin/bins/fill_level`
- Payload format: `{ "bin_id": "bin_001", "fill_percentage": 87.5 }`

When a message arrives:
1. The fill level is written to MongoDB
2. A **confidence score** is calculated based on sensor jitter and rate-of-change
3. A historical record is added to the `bin_history` collection
4. The bin's status is automatically updated (OK / Needs Collection / Critical)

Any real ESP32/Arduino board publishing to this MQTT topic will immediately appear in the dashboard.

---

### Step 12 — Sensor Confidence Scoring

Every fill-level reading is assigned an automatic **confidence score (0–100%)** based on:
1. **Rate-of-change penalty** — a jump > 25% in a single reading is penalized (sensor spike)
2. **Jitter/noise penalty** — if the standard deviation of the last 5 readings exceeds 10%, the confidence is reduced

This means the dashboard can show operators when a sensor is likely malfunctioning (e.g., 30% confidence) vs. reliable (100% confidence).

---

### Step 13 — Dynamic Routing Mode (Live Operator GPS)

In the Route Panel, there are two routing modes:

| Mode | Start Point | Use Case |
|---|---|---|
| **Static** | Bhopal Nagar Nigam depot | Standard daily planning |
| **Dynamic** | Each live operator's current GPS location | Real-time re-routing mid-shift |

In Dynamic Mode:
- The CVRP solver uses each live operator as a separate start node
- Each van gets its own optimal sub-route starting from their current position
- Bins are split between vans to minimize total fleet cost

---

## 🔗 Full API Reference

All endpoints are self-documented at: `http://localhost:8000/docs` (Swagger UI)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bins` | All bins with live state |
| `POST` | `/api/bins` | Register a new bin |
| `GET` | `/api/bins/{id}` | Single bin details |
| `GET` | `/api/bins/{id}/history` | Time-series fill history |
| `GET` | `/api/bins/{id}/predict` | ML fill-level prediction |
| `GET` | `/api/bins/predict_all/batch` | Batch prediction for all bins |
| `POST` | `/api/bins/seed` | Seed default Bhopal bins |
| `POST` | `/api/bins/seed_history` | Seed synthetic ML training data |
| `POST` | `/api/bins/randomize` | Randomize all fill levels (demo) |
| `GET` | `/api/routes/optimal` | Generate CVRP optimized route |
| `GET` | `/api/routes/predict` | Predicted-fill route (12h ahead) |
| `GET` | `/api/config` | Fleet configuration |
| `PUT` | `/api/config` | Update fleet config |
| `POST` | `/api/chat` | AI Chat (LLM context-aware) |
| `GET` | `/api/operators` | All operators |
| `POST` | `/api/operators/login` | Operator login |
| `PUT` | `/api/operators/{id}/live` | Set operator live + location |
| `PUT` | `/api/operators/{id}/offline` | Set operator offline |
| `PUT` | `/api/operators/{id}/location` | Update live GPS location |
| `POST` | `/api/operators/seed` | Seed sample operators |
| `POST` | `/api/complaints/` | Submit a citizen complaint |
| `GET` | `/api/complaints/` | All complaints (admin view) |
| `PUT` | `/api/complaints/{id}` | Update complaint status |
| `POST` | `/api/detection/plastic-bottle` | AI plastic bottle detection |

---

## ✅ Recommended Demo Order

1. Open `http://localhost:5173` — show the login page
2. Log in as **Admin**
3. On Dashboard: click **Seed Bins** → **Seed History** → **Randomize Bins** to populate live data
4. Walk through the bin cards, point out the color-coded status and confidence scores
5. Open the **Map** tab — show bin markers and disposal facility markers on Bhopal map
6. Go to **Route Panel** → click **Generate Optimal Route** (wait 3–5 seconds)
7. Show the fleet breakdown (van routes, distances, fuel, cost)
8. Switch to the **Map** tab — show the road-snapped route polyline on Bhopal roads
9. Click **Predicted Route (12h)** — explain ML-powered proactive routing
10. Open the **AI Chat** bubble — ask *"Which bins are most critical?"*
11. Open **Complaints Panel** → show the AI vision severity tagging
12. Log out → Log in as **Operator** → show the operator dashboard and **Go Live** button
13. Log out → click **Continue Without Login** → show the **Citizen Map** and **Report Garbage** form
14. Open `http://localhost:8000/docs` → show the full Swagger API documentation
