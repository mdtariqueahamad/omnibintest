import math
from typing import Dict, Any, List
import networkx as nx
import numpy as np
import requests
import logging
import concurrent.futures
from app.services.bin_service import get_all_bins

# Import OR-Tools for advanced CVRP multi-objective solving
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

logger = logging.getLogger(__name__)

# Configuration Constants
VAN_MAX_CAPACITY = 500.0  # Liters
FUEL_CONSUMPTION_KM_PER_LITER = 5.5
FUEL_PRICE_PER_LITER = 95.0
FUEL_COST_PER_KM = FUEL_PRICE_PER_LITER / FUEL_CONSUMPTION_KM_PER_LITER  # ~17.27 INR/km
VAN_DISPATCH_FIXED_COST = 500.0  # Flat synthetic penalty to force solver to minimize van usage

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

    # 1. Prepare Nodes for OR-Tools
    # Node 0: Depot
    # Node 1 to N: Target Bins
    # Node N+1: Dummy End Node representing the closest Dump Site
    
    num_bins = len(target_bins)
    num_nodes = num_bins + 2
    depot_index = 0
    dummy_end_index = num_nodes - 1
    
    # Pre-calculate coordinates
    coords = [START_DEPOT] + target_bins
    
    # Extract latitudes and longitudes
    lats = np.array([c.get("latitude", c.get("lat")) for c in coords])
    lons = np.array([c.get("longitude", c.get("lon")) for c in coords])
    
    # 2. Build Distance/Cost Matrix (Vectorized)
    COST_MULTIPLIER = 1000
    
    lat1 = np.radians(lats[:, np.newaxis])
    lon1 = np.radians(lons[:, np.newaxis])
    lat2 = np.radians(lats[np.newaxis, :])
    lon2 = np.radians(lons[np.newaxis, :])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(a))
    dist_matrix_km = 6371.0 * c
    
    # Initialize the full distance matrix
    distance_matrix = np.zeros((num_nodes, num_nodes), dtype=int)
    
    # Assign costs between Depot and Bins
    edge_costs = dist_matrix_km * FUEL_COST_PER_KM * COST_MULTIPLIER
    distance_matrix[:num_bins + 1, :num_bins + 1] = edge_costs.astype(int)
    
    # Clear diagonal
    np.fill_diagonal(distance_matrix, 0)
    
    # Connect bins to the Dummy End Node
    end_lats = np.array([ef["lat"] for ef in END_FACILITIES])
    end_lons = np.array([ef["lon"] for ef in END_FACILITIES])
    
    # Compute distances from each node (0 to num_bins) to all end facilities
    node_lat_rad = np.radians(lats[:, np.newaxis])
    node_lon_rad = np.radians(lons[:, np.newaxis])
    end_lat_rad = np.radians(end_lats[np.newaxis, :])
    end_lon_rad = np.radians(end_lons[np.newaxis, :])
    
    dlat_end = end_lat_rad - node_lat_rad
    dlon_end = end_lon_rad - node_lon_rad
    a_end = np.sin(dlat_end / 2.0)**2 + np.cos(node_lat_rad) * np.cos(end_lat_rad) * np.sin(dlon_end / 2.0)**2
    c_end = 2.0 * np.arcsin(np.sqrt(a_end))
    dist_to_ends_km = 6371.0 * c_end
    
    # Min distance to any end facility for each node
    min_dist_to_end = np.min(dist_to_ends_km, axis=1)
    
    # Only bins (1 to num_bins) connect to dummy end node
    distance_matrix[1:num_bins + 1, dummy_end_index] = (min_dist_to_end[1:] * FUEL_COST_PER_KM * COST_MULTIPLIER).astype(int)
    
    # The Dummy End Node is a sink; leaving it costs 0
    distance_matrix[dummy_end_index, :] = 0

    # 3. Build Demands Array
    demands = [0] * num_nodes
    for i, b in enumerate(target_bins, start=1):
        volume = (b.get("fill_percentage", 0) / 100.0) * b.get("capacity", 100.0)
        demands[i] = int(volume * 10)  # Scale by 10 for integer precision
        
    scaled_van_capacity = int(VAN_MAX_CAPACITY * 10)
    
    # Max vehicles we could possibly use
    num_vehicles = num_bins

    # 4. Initialize OR-Tools Routing Model
    manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, [depot_index] * num_vehicles, [dummy_end_index] * num_vehicles)
    routing = pywrapcp.RoutingModel(manager)

    # Register transit callback for Cost
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Multi-Objective: Add a Fixed Dispatch Penalty to heavily penalize using unnecessary vans
    routing.SetFixedCostOfAllVehicles(int(VAN_DISPATCH_FIXED_COST * COST_MULTIPLIER))

    # Register demand callback for Capacity
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        [scaled_van_capacity] * num_vehicles,  # vehicle maximum capacities
        True,  # start cumul to zero
        'Capacity'
    )

    # 5. Solve the CVRP
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_parameters.time_limit.FromSeconds(3) # Max 3 seconds of solving
    
    solution = routing.SolveWithParameters(search_parameters)

    if not solution:
        logger.error("OR-Tools failed to find a valid CVRP solution.")
        return {"fleet_routes": [], "fleet_totals": {"total_vans": 0, "total_distance": 0.0, "total_fuel": 0.0, "total_cost": 0.0}, "message": "Routing solver failed."}

    # 6. Parse Solution & Execute Real Routes via OSRM
    fleet_routes = []
    tot_dist = 0.0
    tot_fuel = 0.0
    tot_cost = 0.0
    
    # Gather all route sequences first
    route_tasks = []
    van_id = 1
    
    for vehicle_id in range(num_vehicles):
        index = routing.Start(vehicle_id)
        if routing.IsEnd(solution.Value(routing.NextVar(index))):
            continue  # Empty route
            
        route_nodes = []
        while not routing.IsEnd(index):
            node_idx = manager.IndexToNode(index)
            if node_idx != depot_index and node_idx != dummy_end_index:
                route_nodes.append(target_bins[node_idx - 1])
            index = solution.Value(routing.NextVar(index))
            
        if not route_nodes:
            continue
            
        last_bin = route_nodes[-1]
        lat = last_bin.get("latitude")
        lon = last_bin.get("longitude")
        closest_end = min(END_FACILITIES, key=lambda ef: haversine_distance(lat, lon, ef["lat"], ef["lon"]))
        
        route_tasks.append((van_id, route_nodes, closest_end))
        van_id += 1

    # Fetch OSRM geometry concurrently
    def fetch_route_data(task):
        vid, r_nodes, cend = task
        try:
            r_data = _calculate_osrm_route(r_nodes, cend)
        except Exception as e:
            logger.error(f"OSRM failed for van {vid}, falling back: {e}")
            r_data = _calculate_networkx_fallback_route(r_nodes, cend)
        return vid, r_nodes, cend, r_data

    fleet_routes = []
    tot_dist = 0.0
    tot_fuel = 0.0
    tot_cost = 0.0

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(10, len(route_tasks) if route_tasks else 1)) as executor:
        future_to_task = {executor.submit(fetch_route_data, task): task for task in route_tasks}
        
        for future in concurrent.futures.as_completed(future_to_task):
            vid, r_nodes, cend, route_data = future.result()
            
            dist = route_data["total_distance"]
            fuel = dist / FUEL_CONSUMPTION_KM_PER_LITER
            cost = (fuel * FUEL_PRICE_PER_LITER) + VAN_DISPATCH_FIXED_COST
            total_volume = sum((b.get("fill_percentage", 0) / 100.0) * b.get("capacity", 100.0) for b in r_nodes)
            
            fleet_routes.append({
                "van_id": vid,
                "route": route_data["route"],
                "details": route_data["details"],
                "distance_km": round(dist, 2),
                "fuel_liters": round(fuel, 2),
                "cost_inr": round(cost, 2),
                "total_volume": round(total_volume, 2),
                "roadGeometry": route_data["roadGeometry"]
            })
            
            tot_dist += dist
            tot_fuel += fuel
            tot_cost += cost

    # Ensure fleet_routes are ordered by van_id for consistency
    fleet_routes.sort(key=lambda x: x["van_id"])
        
    return {
        "fleet_routes": fleet_routes,
        "fleet_totals": {
            "total_vans": len(fleet_routes),
            "total_distance": round(tot_dist, 2),
            "total_fuel": round(tot_fuel, 2),
            "total_cost": round(tot_cost, 2)
        },
        "message": f"Successfully planned {len(fleet_routes)} CVRP van routes optimizing capacity & dispatch cost."
    }
