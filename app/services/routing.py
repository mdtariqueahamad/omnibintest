from typing import Dict, Any, List
import networkx as nx
import numpy as np
import requests
import logging
from app.services.bin_service import get_all_bins

# Fixed coordinates for the Starting Depot (Bhopal Nagar Nigam Building)
DEPOT_ID = "depot"
DEPOT_LOCATION = "Bhopal Nagar Nigam Building"
DEPOT_LAT = 23.2244
DEPOT_LON = 77.4027

# Fixed coordinates for the Ending Solid Waste Dump Site
END_ID = "waste_facility"
END_LOCATION = "Solid Waste Management Facility"
END_LAT = 23.2524
END_LON = 77.5404

logger = logging.getLogger(__name__)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers using Numpy."""
    R = 6371.0
    lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon / 2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(a))
    return float(R * c)


def _calculate_osrm_route(target_bins: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Attempts to calculate an optimal road-snapped route using the Open Source Routing Machine (OSRM) API.
    """
    # 1. Format coordinates: lon,lat;lon,lat;...
    locations = [f"{DEPOT_LON},{DEPOT_LAT}"]
    node_ids = [DEPOT_ID]
    
    for b in target_bins:
        # Validate coordinates exist
        if b.get("longitude") is not None and b.get("latitude") is not None:
            locations.append(f"{b['longitude']},{b['latitude']}")
            node_ids.append(b["bin_id"])
            
    # Append the END coordinates to strictly end at the Waste Facility
    locations.append(f"{END_LON},{END_LAT}")
    node_ids.append(END_ID)
            
    coords_str = ";".join(locations)
    
    # OSRM Trip API request
    # source=first ensures we start at the depot
    # destination=last ensures we end at the waste facility
    # roundtrip=false guarantees an open path
    url = f"http://router.project-osrm.org/trip/v1/driving/{coords_str}?source=first&destination=last&roundtrip=false&geometries=geojson"
    
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    data = response.json()
    
    if data.get("code") != "Ok":
        raise ValueError(f"OSRM API returned non-Ok code: {data.get('code')}")
        
    trip = data["trips"][0]
    waypoints = data["waypoints"]
    
    # Total distance in km
    total_dist = trip["distance"] / 1000.0
    
    # 2. Extract road-snapped GeoJSON geometry
    # OSRM returns GeoJSON coordinates as [lon, lat], Leaflet expects [lat, lon]
    geometry = trip["geometry"]["coordinates"]
    road_geometry = [[coord[1], coord[0]] for coord in geometry]
    
    # 3. Order the nodes according to the OSRM TSP waypoint_index
    ordered_ids = [None] * len(waypoints)
    for idx, wp in enumerate(waypoints):
        w_index = wp["waypoint_index"]
        ordered_ids[w_index] = node_ids[idx]
        
    # Build open path (starts at depot, ends at facility)
    tsp_cycle = ordered_ids
    
    # 4. Build details metadata
    details = []
    step_counter = 1
    bin_lookup = {b["bin_id"]: b for b in target_bins}
    
    for b_id in ordered_ids:
        if b_id in (DEPOT_ID, END_ID):
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
        "roadGeometry": road_geometry,
        "message": f"Successfully calculated optimal OSRM road network route covering {len(details)} bins."
    }


def _calculate_networkx_fallback_route(target_bins: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Fallback method using NetworkX Euclidean (Haversine) distances when OSRM fails.
    """
    G = nx.Graph()
    G.add_node(DEPOT_ID, location=DEPOT_LOCATION, lat=DEPOT_LAT, lon=DEPOT_LON, fill_percentage=0.0, priority=0)
    G.add_node(END_ID, location=END_LOCATION, lat=END_LAT, lon=END_LON, fill_percentage=0.0, priority=0)

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

    if tsp_cycle[0] != DEPOT_ID:
        depot_index = tsp_cycle.index(DEPOT_ID)
        tsp_cycle = tsp_cycle[depot_index:-1] + tsp_cycle[:depot_index]
    else:
        # Remove loop-back logic
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

        if v not in (DEPOT_ID, END_ID) and v not in visited_bins:
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
        "roadGeometry": None, # Signal frontend to use straight dashed lines
        "message": f"Successfully calculated fallback straight-line route covering {len(details)} bins."
    }


def calculate_optimal_route() -> Dict[str, Any]:
    """
    Analyzes bin fill levels, filters candidate bins, and generates an optimal TSP route.
    Prefers high-level OSRM API, falls back to local NetworkX approximation on failure.
    """
    all_bins = get_all_bins()

    target_bins = []
    for b in all_bins:
        fill = b.get("fill_percentage", 0.0)
        prio = b.get("priority", 1)
        status = b.get("status", "OK")

        if fill >= 70.0 or status in ["Needs Collection", "Critical"] or (prio == 3 and fill >= 50.0):
            target_bins.append(b)

    if not target_bins:
        return {
            "route": [DEPOT_ID],
            "details": [],
            "total_distance": 0.0,
            "roadGeometry": None,
            "message": "No bins require collection at this time."
        }

    # Attempt high-level OSRM route
    try:
        return _calculate_osrm_route(target_bins)
    except Exception as e:
        logger.error(f"OSRM routing failed: {str(e)}. Falling back to NetworkX Euclidean solver.")
        return _calculate_networkx_fallback_route(target_bins)
