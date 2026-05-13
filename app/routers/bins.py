from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.models import BinCreate, BinResponse, BinHistoryResponse, RouteResponse, FleetConfig, BinPrediction, SeedHistoryRequest
from app.services import bin_service, routing, config_service
from app.services.prediction import predict_future_fill_level

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
def get_optimal_collection_route(mode: str = "static"):
    """
    Calculate and return the optimized waste collection route.
    If mode='dynamic', uses live operator locations.
    """
    return routing.calculate_optimal_route(mode=mode)


@router.get("/api/routes/predict", response_model=RouteResponse)
def get_predicted_collection_route(hours_ahead: int = 12, mode: str = "static"):
    """
    Calculate and return the optimized waste collection route based on future predicted fill levels.
    """
    return routing.calculate_optimal_route(mode=mode, predict_hours=hours_ahead)


@router.get("/api/bins/{bin_id}/predict", response_model=BinPrediction)
def get_bin_prediction(bin_id: str, hours_ahead: int = 12):
    """Predict the future fill level of a specific bin."""
    b = bin_service.get_bin_by_id(bin_id)
    if not b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dustbin with ID '{bin_id}' not found.",
        )
    return predict_future_fill_level(bin_id, hours_ahead)


@router.get("/api/bins/predict_all/batch", response_model=List[BinPrediction])
def get_all_bins_prediction(hours_ahead: int = 12):
    """Predict the future fill level of all bins."""
    all_bins = bin_service.get_all_bins()
    predictions = []
    for b in all_bins:
        predictions.append(predict_future_fill_level(b["bin_id"], hours_ahead))
    return predictions


@router.post("/api/bins/seed", response_model=List[BinResponse])
def seed_database():
    """
    Seed the database with default IoT dustbin locations and simulated fill levels
    for testing the routing engine immediately.
    """
    return bin_service.seed_initial_bins()


@router.post("/api/bins/seed_history", response_model=Dict[str, Any])
def seed_database_history(request: SeedHistoryRequest):
    """
    Seed the database with synthetic time-series historical data for ML model training.
    """
    return bin_service.seed_bin_history(request.bin_ids, request.hours)


@router.post("/api/bins/randomize")
def randomize_database():
    """
    Randomize the fill levels of all bins to simulate live urban activity for demonstration purposes.
    """
    bin_service.randomize_all_bins()
    return {"message": "All bins have been successfully randomized."}
