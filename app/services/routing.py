import math
from typing import Dict, Any, List
import networkx as nx
import numpy as np
import requests
import logging
from sklearn.cluster import KMeans
from app.services.bin_service import get_all_bins

logger = logging.getLogger(__name__)

# Configuration Constants
VAN_CAPACITY_LITERS = 500.0
FUEL_CONSUMPTION_KM_PER_LITER = 5.5
FUEL_PRICE_PER_LITER = 95.0

START_DEPOT = {"lat": 23.2244, "lon": 77.4027, "id": "depot", "location": "Bhopal Nagar Nigam Building"}
END_FACILITIES = [
    {"lat": 23.2524, "lon": 77.5404, "id": "dump_east", "location": "Solid Waste Management Facility (East)"},
    {"lat": 23.2800, "lon": 77.4000, "id": "dump_north", "location": "Solid Waste Management Facility (North)"}
]

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers using Numpy."""
    R = 6371.0
    lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon / 2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(a))
    return float(R * c)


def _calculate_osrm_route(target_bins: List[Dict[str, Any]], end_facility: Dict[str, Any]) -> Dict[str, Any]:
    """
    Attempts to calculate an optimal road-snapped route using the Open Source Routing Machine (OSRM) API.
    """
    locations = [f"{START_DEPOT['lon']},{START_DEPOT['lat']}"]
    node_ids = [START_DEPOT['id']]
    
    for b in target_bins:
        if b.get("longitude") is not None and b.get("latitude") is not None:
            locations.append(f"{b['longitude']},{b['latitude']}")
            node_ids.append(b["bin_id"])
            
    locations.append(f"{end_facility['lon']},{end_facility['lat']}")
    node_ids.append(end_facility["id"])
            
    coords_str = ";".join(locations)
    url = f"http://router.project-osrm.org/trip/v1/driving/{coords_str}?source=first&destination=last&roundtrip=false&geometries=geojson"
    
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    data = response.json()
    
    if data.get("code") != "Ok":
        raise ValueError(f"OSRM API returned non-Ok code: {data.get('code')}")
        
    trip = data["trips"][0]
    waypoints = data["waypoints"]
    total_dist = trip["distance"] / 1000.0
    
    geometry = trip["geometry"]["coordinates"]
    road_geometry = [[coord[1], coord[0]] for coord in geometry]
    
    ordered_ids = [None] * len(waypoints)
    for idx, wp in enumerate(waypoints):
        w_index = wp["waypoint_index"]
        ordered_ids[w_index] = node_ids[idx]
        
    tsp_cycle = ordered_ids
    
    details = []
    step_counter = 1
    bin_lookup = {b["bin_id"]: b for b in target_bins}
    
    for b_id in ordered_ids:
        if b_id in (START_DEPOT['id'], end_facility['id']):
            continue
            
        b_info = bin_lookup[b_id]
        details.append({
            "step_order": step_counter,
            "bin_id": b_id,
            "location": b_info.get("location", ""),
            "fill_percentage": b_info.get("fill_percentage", 0.0),
            "priority": b_info.get("priority", 1)
        })
        step_counter += 1
        
    return {
        "route": tsp_cycle,
        "details": details,
        "total_distance": round(total_dist, 3),
        "roadGeometry": road_geometry
    }


def _calculate_networkx_fallback_route(target_bins: List[Dict[str, Any]], end_facility: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback method using NetworkX Euclidean (Haversine) distances when OSRM fails.
    """
    G = nx.Graph()
    G.add_node(START_DEPOT['id'], location=START_DEPOT['location'], lat=START_DEPOT['lat'], lon=START_DEPOT['lon'], fill_percentage=0.0, priority=0)
    G.add_node(end_facility['id'], location=end_facility['location'], lat=end_facility['lat'], lon=end_facility['lon'], fill_percentage=0.0, priority=0)

    bin_lookup = {}
    for b in target_bins:
        b_id = b["bin_id"]
        bin_lookup[b_id] = b
        G.add_node(
            b_id,
            location=b.get("location", "Unknown"),
            lat=b.get("latitude", 0.0),
            lon=b.get("longitude", 0.0),
            fill_percentage=b.get("fill_percentage", 0.0),
            priority=b.get("priority", 1)
        )

    nodes = list(G.nodes(data=True))
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            u_id, u_data = nodes[i][0], nodes[i][1]
            v_id, v_data = nodes[j][0], nodes[j][1]
            dist = haversine_distance(u_data["lat"], u_data["lon"], v_data["lat"], v_data["lon"])
            G.add_edge(u_id, v_id, weight=dist)

    tsp_cycle = nx.approximation.traveling_salesman_problem(G, weight="weight", cycle=True)

    if tsp_cycle[0] != START_DEPOT['id']:
        depot_index = tsp_cycle.index(START_DEPOT['id'])
        tsp_cycle = tsp_cycle[depot_index:-1] + tsp_cycle[:depot_index]
    else:
        tsp_cycle = tsp_cycle[:-1]

    total_dist = 0.0
    details = []
    step_counter = 1
    visited_bins = set()

    for idx in range(len(tsp_cycle) - 1):
        u = tsp_cycle[idx]
        v = tsp_cycle[idx + 1]
        edge_data = G.get_edge_data(u, v)
        total_dist += edge_data["weight"]

        if v not in (START_DEPOT['id'], end_facility['id']) and v not in visited_bins:
            visited_bins.add(v)
            b_info = bin_lookup[v]
            details.append({
                "step_order": step_counter,
                "bin_id": v,
                "location": b_info.get("location", ""),
                "fill_percentage": b_info.get("fill_percentage", 0.0),
                "priority": b_info.get("priority", 1)
            })
            step_counter += 1

    details.sort(key=lambda x: x["step_order"])

    return {
        "route": tsp_cycle,
        "details": details,
        "total_distance": round(total_dist, 3),
        "roadGeometry": None
    }


def calculate_optimal_route() -> Dict[str, Any]:
    all_bins = get_all_bins()

    target_bins = []
    total_volume = 0.0
    for b in all_bins:
        fill = b.get("fill_percentage", 0.0)
        prio = b.get("priority", 1)
        status = b.get("status", "OK")
        cap = b.get("capacity", 100.0)

        if fill >= 70.0 or status in ["Needs Collection", "Critical"] or (prio == 3 and fill >= 50.0):
            target_bins.append(b)
            total_volume += (fill / 100.0) * cap

    if not target_bins:
        return {
            "fleet_routes": [],
            "fleet_totals": {
                "total_vans": 0,
                "total_distance": 0.0,
                "total_fuel": 0.0,
                "total_cost": 0.0
            },
            "message": "No bins require collection at this time."
        }

    num_vans = max(1, math.ceil(total_volume / VAN_CAPACITY_LITERS))
    
    # 1. Geographic Clustering via K-Means
    coords = np.array([[b.get("latitude", 0), b.get("longitude", 0)] for b in target_bins])
    
    if num_vans >= len(target_bins):
        clusters = {i: [target_bins[i]] for i in range(len(target_bins))}
    else:
        kmeans = KMeans(n_clusters=num_vans, random_state=42, n_init=10)
        labels = kmeans.fit_predict(coords)
        
        clusters = {i: [] for i in range(num_vans)}
        for i, label in enumerate(labels):
            clusters[label].append(target_bins[i])
            
        # Capacity Rebalancing
        overloaded = True
        iterations = 0
        while overloaded and iterations < 100:
            overloaded = False
            iterations += 1
            for c_id, bins_list in clusters.items():
                c_vol = sum((b.get("fill_percentage", 0)/100.0)*b.get("capacity", 100.0) for b in bins_list)
                if c_vol > VAN_CAPACITY_LITERS:
                    overloaded = True
                    underloaded = []
                    for uc_id, ubins_list in list(clusters.items()):
                        if uc_id != c_id:
                            uc_vol = sum((b.get("fill_percentage", 0)/100.0)*b.get("capacity", 100.0) for b in ubins_list)
                            if uc_vol < VAN_CAPACITY_LITERS:
                                underloaded.append((uc_id, VAN_CAPACITY_LITERS - uc_vol))
                    
                    if not underloaded:
                        new_c_id = len(clusters)
                        clusters[new_c_id] = []
                        underloaded.append((new_c_id, VAN_CAPACITY_LITERS))
                        num_vans += 1
                        
                    bin_to_move = bins_list.pop()
                    best_uc = underloaded[0][0]
                    clusters[best_uc].append(bin_to_move)
                    break 
                    
    # 2. VRP Routing and Fuel Calculation
    fleet_routes = []
    tot_dist = 0.0
    tot_fuel = 0.0
    tot_cost = 0.0
    
    van_id = 1
    for c_id, c_bins in clusters.items():
        if not c_bins:
            continue
            
        c_lat = np.mean([b["latitude"] for b in c_bins])
        c_lon = np.mean([b["longitude"] for b in c_bins])
        closest_end = min(END_FACILITIES, key=lambda ef: haversine_distance(c_lat, c_lon, ef["lat"], ef["lon"]))
        
        try:
            route_data = _calculate_osrm_route(c_bins, closest_end)
        except Exception as e:
            logger.error(f"OSRM failed for van {van_id}, falling back: {e}")
            route_data = _calculate_networkx_fallback_route(c_bins, closest_end)
            
        dist = route_data["total_distance"]
        fuel = dist / FUEL_CONSUMPTION_KM_PER_LITER
        cost = fuel * FUEL_PRICE_PER_LITER
        
        fleet_routes.append({
            "van_id": van_id,
            "route": route_data["route"],
            "details": route_data["details"],
            "distance_km": round(dist, 2),
            "fuel_liters": round(fuel, 2),
            "cost_inr": round(cost, 2),
            "roadGeometry": route_data["roadGeometry"]
        })
        
        tot_dist += dist
        tot_fuel += fuel
        tot_cost += cost
        van_id += 1
        
    return {
        "fleet_routes": fleet_routes,
        "fleet_totals": {
            "total_vans": len(fleet_routes),
            "total_distance": round(tot_dist, 2),
            "total_fuel": round(tot_fuel, 2),
            "total_cost": round(tot_cost, 2)
        },
        "message": f"Successfully planned {len(fleet_routes)} van routes for {len(target_bins)} bins."
    }
