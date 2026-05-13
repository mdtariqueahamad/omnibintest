from datetime import datetime
from typing import List, Optional, Dict, Any
# pyrefly: ignore [missing-import]
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
    confidence_percent: float = Field(100.0, description="Confidence metric for the latest reading")
    recent_readings: List[Dict[str, Any]] = Field(default_factory=list, description="Last 5 readings to calculate jitter")


class BinHistoryItem(BaseModel):
    timestamp: str
    fill_percentage: float
    confidence_percent: float = Field(100.0)


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
    operator_id: Optional[str] = None
    route: List[str]
    details: List[RouteStep]
    distance_km: float
    fuel_liters: float
    cost_inr: float
    total_volume: float
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


class FleetConfig(BaseModel):
    van_capacity: float = Field(500.0, description="Max load capacity per van in liters")
    mileage_kmpl: float = Field(5.5, description="Average fuel consumption mileage in km/L")
    fuel_price: float = Field(95.0, description="Fuel cost per liter in INR")


class OperatorBase(BaseModel):
    username: str = Field(..., description="Unique username for the van operator")
    state: str = Field("offline", description="'live' or 'offline'")
    latitude: Optional[float] = Field(None, description="Current live latitude")
    longitude: Optional[float] = Field(None, description="Current live longitude")


class OperatorCreate(OperatorBase):
    password: str = Field(..., description="Operator password")


class OperatorResponse(OperatorBase):
    operator_id: str


class OperatorLogin(BaseModel):
    username: str
    password: str


class OperatorLocationUpdate(BaseModel):
    latitude: float
    longitude: float

