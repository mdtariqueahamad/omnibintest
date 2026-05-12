from typing import Dict, Any, List
import networkx as nx
import numpy as np
from app.services.bin_service import get_all_bins

# Fixed coordinates for the Central Waste Collection Depot
DEPOT_ID = "depot"
DEPOT_LOCATION = "Central Collection Depot"
DEPOT_LAT = 37.7700
DEPOT_LON = -122.4100


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers using Numpy."""
    # Radius of the Earth in km
    R = 6371.0

    # Convert degrees to radians
    lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(np.radians, [lat1, lon1, lat2, lon2])

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    # Haversine formula
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon / 2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(a))
    
    return float(R * c)


def calculate_optimal_route() -> Dict[str, Any]:
    """
    Analyzes bin fill levels, filters candidate bins for collection,
    constructs a routing graph using NetworkX, and solves the TSP.
    """
    all_bins = get_all_bins()

    # Filter bins requiring collection
    # Criteria: fill >= 70% OR status is Critical OR (priority == 3 and fill >= 50%)
    target_bins = []
    for b in all_bins:
        fill = b.get("fill_percentage", 0.0)
        prio = b.get("priority", 1)
        status = b.get("status", "OK")

        if fill >= 70.0 or status in ["Needs Collection", "Critical"] or (prio == 3 and fill >= 50.0):
            target_bins.append(b)

    # If no bins need collection, return early
    if not target_bins:
        return {
            "route": [DEPOT_ID],
            "details": [],
            "total_distance": 0.0,
            "message": "No bins require collection at this time."
        }

    # Initialize complete undirected graph
    G = nx.Graph()

    # Add depot node
    G.add_node(
        DEPOT_ID,
        location=DEPOT_LOCATION,
        lat=DEPOT_LAT,
        lon=DEPOT_LON,
        fill_percentage=0.0,
        priority=0
    )

    # Add bin nodes
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

    # Populate edge weights (distances) for every pair of nodes
    nodes = list(G.nodes(data=True))
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            u_id, u_data = nodes[i][0], nodes[i][1]
            v_id, v_data = nodes[j][0], nodes[j][1]

            dist = haversine_distance(
                u_data["lat"], u_data["lon"], v_data["lat"], v_data["lon"]
            )
            
            # To ensure the TSP solver prioritizes higher priority bins if cost modification is desired,
            # we use raw geographical distance as the edge weight to preserve triangle inequality.
            G.add_edge(u_id, v_id, weight=dist)

    # Solve the Traveling Salesperson Problem approximation
    # Since G is a complete graph with metric weights, TSP approximation gives a high-quality valid cycle.
    tsp_cycle = nx.approximation.traveling_salesman_problem(G, weight="weight", cycle=True)

    # Ensure the cycle starts at the DEPOT
    if tsp_cycle[0] != DEPOT_ID:
        depot_index = tsp_cycle.index(DEPOT_ID)
        # Re-align cycle to start and end at depot
        tsp_cycle = tsp_cycle[depot_index:-1] + tsp_cycle[:depot_index] + [DEPOT_ID]

    # Calculate precise total distance and prepare step metadata
    total_dist = 0.0
    details = []
    
    step_counter = 1
    # Avoid adding depot to the details list, only map bins
    visited_bins = set()

    for idx in range(len(tsp_cycle) - 1):
        u = tsp_cycle[idx]
        v = tsp_cycle[idx + 1]
        edge_data = G.get_edge_data(u, v)
        total_dist += edge_data["weight"]

        if v != DEPOT_ID and v not in visited_bins:
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

    # Sort details by step_order just to be certain
    details.sort(key=lambda x: x["step_order"])

    return {
        "route": tsp_cycle,
        "details": details,
        "total_distance": round(total_dist, 3),
        "message": f"Successfully calculated optimal route covering {len(details)} bins."
    }
