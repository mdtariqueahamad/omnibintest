from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.database import bins_collection, history_collection
from app.models import BinCreate


def _serialize(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if doc:
        doc.pop("_id", None)
    return doc


def get_all_bins() -> List[Dict[str, Any]]:
    cursor = bins_collection.find({})
    return [_serialize(doc) for doc in cursor if doc]


def get_bin_by_id(bin_id: str) -> Optional[Dict[str, Any]]:
    doc = bins_collection.find_one({"bin_id": bin_id})
    return _serialize(doc)


def create_bin(bin_data: BinCreate) -> Dict[str, Any]:
    doc = bin_data.model_dump()
    doc["fill_percentage"] = 0.0
    doc["status"] = "OK"
    doc["last_updated"] = datetime.now(timezone.utc).isoformat()

    # Upsert or Insert
    bins_collection.update_one(
        {"bin_id": doc["bin_id"]}, {"$set": doc}, upsert=True
    )
    return doc


def update_bin_fill_level(bin_id: str, fill_percentage: float) -> Optional[Dict[str, Any]]:
    # Determine status based on thresholds
    if fill_percentage >= 90.0:
        status = "Critical"
    elif fill_percentage >= 70.0:
        status = "Needs Collection"
    else:
        status = "OK"

    timestamp = datetime.now(timezone.utc).isoformat()

    update_fields = {
        "fill_percentage": fill_percentage,
        "status": status,
        "last_updated": timestamp,
    }

    # Update bin state
    result = bins_collection.update_one(
        {"bin_id": bin_id}, {"$set": update_fields}
    )

    if result.matched_count == 0:
        # If bin doesn't exist, let's create a placeholder basic record
        placeholder = {
            "bin_id": bin_id,
            "location": f"Unknown Location ({bin_id})",
            "latitude": 0.0,
            "longitude": 0.0,
            "capacity": 100.0,
            "priority": 1,
            **update_fields
        }
        bins_collection.insert_one(placeholder)

    # Record historical log
    history_record = {
        "bin_id": bin_id,
        "timestamp": timestamp,
        "fill_percentage": fill_percentage,
    }
    history_collection.insert_one(history_record)

    return get_bin_by_id(bin_id)


def get_bin_history(bin_id: str) -> List[Dict[str, Any]]:
    cursor = history_collection.find({"bin_id": bin_id}).sort("timestamp", 1)
    return [_serialize(doc) for doc in cursor if doc]


def seed_initial_bins() -> List[Dict[str, Any]]:
    """Seed initial dummy IoT dustbins with realistic lat/long coordinates."""
    initial_bins = [
        {
            "bin_id": "bin_001",
            "location": "MP Nagar Zone 1",
            "latitude": 23.2333,
            "longitude": 77.4344,
            "capacity": 120.0,
            "priority": 3,
            "fill_percentage": 85.5,
            "status": "Needs Collection",
        },
        {
            "bin_id": "bin_002",
            "location": "DB City Mall Entrance",
            "latitude": 23.2322,
            "longitude": 77.4299,
            "capacity": 100.0,
            "priority": 2,
            "fill_percentage": 42.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_003",
            "location": "Rani Kamlapati Railway Station",
            "latitude": 23.2265,
            "longitude": 77.4330,
            "capacity": 150.0,
            "priority": 2,
            "fill_percentage": 94.0,
            "status": "Critical",
        },
        {
            "bin_id": "bin_004",
            "location": "Arera Colony E-3",
            "latitude": 23.2160,
            "longitude": 77.4285,
            "capacity": 80.0,
            "priority": 1,
            "fill_percentage": 73.0,
            "status": "Needs Collection",
        },
        {
            "bin_id": "bin_005",
            "location": "Govindpura Industrial Area",
            "latitude": 23.2500,
            "longitude": 77.4500,
            "capacity": 100.0,
            "priority": 3,
            "fill_percentage": 15.0,
            "status": "OK",
        },
    ]

    seeded = []
    timestamp = datetime.now(timezone.utc).isoformat()
    for b in initial_bins:
        b["last_updated"] = timestamp
        # Update/insert
        bins_collection.update_one(
            {"bin_id": b["bin_id"]}, {"$set": b}, upsert=True
        )
        # Add initial history entry if not already present
        if history_collection.count_documents({"bin_id": b["bin_id"]}) == 0:
            history_collection.insert_one({
                "bin_id": b["bin_id"],
                "timestamp": timestamp,
                "fill_percentage": b["fill_percentage"]
            })
        seeded.append(b)

    return [_serialize(b) for b in seeded]
