from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class BinBase(BaseModel):
    location: str = Field(..., description="Descriptive location name of the dustbin")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    capacity: float = Field(100.0, description="Total volume/capacity of the bin in liters")
    priority: int = Field(1, description="Priority level: 1 (Low), 2 (Medium), 3 (High)")


class BinCreate(BinBase):
    bin_id: str = Field(..., description="Unique hardware identifier for the bin")


class BinResponse(BinBase):
    bin_id: str
    fill_percentage: float = Field(0.0, description="Current fill level percentage (0 to 100)")
    status: str = Field("OK", description="Status: 'OK', 'Needs Collection', or 'Critical'")
    last_updated: Optional[str] = None


class BinHistoryItem(BaseModel):
    timestamp: str
    fill_percentage: float


class BinHistoryResponse(BaseModel):
    bin_id: str
    history: List[BinHistoryItem]


class RouteStep(BaseModel):
    step_order: int
    bin_id: str
    location: str
    fill_percentage: float
    priority: int


class FleetRoute(BaseModel):
    van_id: int
    route: List[str]
    details: List[RouteStep]
    distance_km: float
    fuel_liters: float
    cost_inr: float
    roadGeometry: Optional[List[List[float]]] = None


class FleetTotals(BaseModel):
    total_vans: int
    total_distance: float
    total_fuel: float
    total_cost: float


class RouteResponse(BaseModel):
    fleet_routes: List[FleetRoute]
    fleet_totals: FleetTotals
    message: str
