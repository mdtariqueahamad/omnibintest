from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models import BinCreate, BinResponse, BinHistoryResponse, RouteResponse, FleetConfig
from app.services import bin_service, routing, config_service

router = APIRouter(tags=["Waste Management"])


@router.get("/api/config", response_model=FleetConfig)
def get_config():
    """Retrieve dynamic fleet constraints and global cost weights."""
    return config_service.get_fleet_config()


@router.put("/api/config", response_model=FleetConfig)
def update_config(config_data: FleetConfig):
    """Update dynamic fleet constraints on the fly."""
    return config_service.update_fleet_config(config_data)


@router.get("/api/bins", response_model=List[BinResponse])
def get_all_bins():
    """Retrieve all monitored IoT smart dustbins and their current real-time state."""
    return bin_service.get_all_bins()


@router.post("/api/bins", response_model=BinResponse, status_code=status.HTTP_201_CREATED)
def register_new_bin(bin_data: BinCreate):
    """Register a new IoT dustbin node into the system."""
    return bin_service.create_bin(bin_data)


@router.get("/api/bins/{bin_id}", response_model=BinResponse)
def get_bin(bin_id: str):
    """Retrieve detailed real-time state of a specific dustbin."""
    b = bin_service.get_bin_by_id(bin_id)
    if not b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dustbin with ID '{bin_id}' not found.",
        )
    return b


@router.get("/api/bins/{bin_id}/history", response_model=BinHistoryResponse)
def get_bin_history_logs(bin_id: str):
    """Retrieve historical time-series logs of fill levels for a specific dustbin."""
    # Verify bin exists
    b = bin_service.get_bin_by_id(bin_id)
    if not b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dustbin with ID '{bin_id}' not found.",
        )
    history = bin_service.get_bin_history(bin_id)
    return {"bin_id": bin_id, "history": history}


@router.get("/api/routes/optimal", response_model=RouteResponse)
def get_optimal_collection_route():
    """
    Calculate and return the optimized waste collection route using NetworkX TSP.
    Considers bin fill levels, priority levels, and physical distances.
    """
    return routing.calculate_optimal_route()


@router.post("/api/bins/seed", response_model=List[BinResponse])
def seed_database():
    """
    Seed the database with default IoT dustbin locations and simulated fill levels
    for testing the routing engine immediately.
    """
    return bin_service.seed_initial_bins()


@router.post("/api/bins/randomize")
def randomize_database():
    """
    Randomize the fill levels of all bins to simulate live urban activity for demonstration purposes.
    """
    bin_service.randomize_all_bins()
    return {"message": "All bins have been successfully randomized."}
