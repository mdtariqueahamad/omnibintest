from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.database import bins_collection, history_collection
from app.models import BinCreate
import statistics


def _serialize(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if doc:
        doc.pop("_id", None)
    return doc


def _calculate_confidence(recent_readings: List[Dict[str, Any]], new_fill: float, old_fill: Optional[float]) -> float:
    confidence = 100.0
    
    # 1. Rate of change penalty (Spikes)
    if old_fill is not None:
        delta = abs(new_fill - old_fill)
        if delta > 25.0:
            confidence -= (delta - 25.0) * 1.5
            
    # 2. Jitter / Randomness penalty
    if len(recent_readings) >= 3:
        fills = [r["fill_percentage"] for r in recent_readings[-4:]] + [new_fill]
        try:
            stdev = statistics.stdev(fills)
            if stdev > 10.0:
                confidence -= (stdev - 10.0) * 2.5
        except Exception:
            pass

    return max(0.0, min(100.0, round(confidence, 1)))


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
    doc["confidence_percent"] = 100.0
    doc["recent_readings"] = [{"timestamp": doc["last_updated"], "fill_percentage": 0.0}]

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

    # Fetch old bin to calculate confidence and update recent_readings
    old_bin = bins_collection.find_one({"bin_id": bin_id})
    recent_readings = old_bin.get("recent_readings", []) if old_bin else []
    old_fill = old_bin.get("fill_percentage") if old_bin else None
    
    confidence_percent = _calculate_confidence(recent_readings, fill_percentage, old_fill)
    
    timestamp = datetime.now(timezone.utc).isoformat()
    
    recent_readings.append({"timestamp": timestamp, "fill_percentage": fill_percentage})
    if len(recent_readings) > 5:
        recent_readings = recent_readings[-5:]

    update_fields = {
        "fill_percentage": fill_percentage,
        "status": status,
        "last_updated": timestamp,
        "confidence_percent": confidence_percent,
        "recent_readings": recent_readings
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
        "confidence_percent": confidence_percent
    }
    history_collection.insert_one(history_record)

    return get_bin_by_id(bin_id)

def get_bin_history(bin_id: str) -> List[Dict[str, Any]]:
    cursor = history_collection.find({"bin_id": bin_id}).sort("timestamp", 1)
    return [_serialize(doc) for doc in cursor if doc]

from typing import List, Dict, Any
from datetime import datetime, timezone

def seed_initial_bins() -> List[Dict[str, Any]]:
    """Seed initial dummy IoT dustbins with realistic lat/long coordinates for Bhopal."""
    initial_bins = [
        # Original 5 Nodes
        {
            "bin_id": "bin_001",
            "location": "MP Nagar Zone 1",
            "latitude": 23.2333,
            "longitude": 77.4344,
            "capacity": 120.0,
            "priority": 1,
            "fill_percentage": 95.5,
            "status": "Critical",
        },
        {
            "bin_id": "bin_002",
            "location": "DB City Mall Entrance",
            "latitude": 23.2322,
            "longitude": 77.4299,
            "capacity": 100.0,
            "priority": 3,
            "fill_percentage": 42.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_003",
            "location": "Rani Kamlapati Railway Station",
            "latitude": 23.2265,
            "longitude": 77.4330,
            "capacity": 150.0,
            "priority": 1,
            "fill_percentage": 98.0,
            "status": "Critical",
        },
        {
            "bin_id": "bin_004",
            "location": "Arera Colony E-3",
            "latitude": 23.2160,
            "longitude": 77.4285,
            "capacity": 80.0,
            "priority": 1,
            "fill_percentage": 92.5,
            "status": "Critical",
        },
        
    ]

    seeded = []
    timestamp = datetime.now(timezone.utc).isoformat()
    for b in initial_bins:
        b["last_updated"] = timestamp
        b["confidence_percent"] = 98.5
        b["recent_readings"] = [
            {"timestamp": timestamp, "fill_percentage": max(0.0, b["fill_percentage"] - 2.0)},
            {"timestamp": timestamp, "fill_percentage": max(0.0, b["fill_percentage"] - 1.0)},
            {"timestamp": timestamp, "fill_percentage": b["fill_percentage"]}
        ]
        
        # Update/insert
        bins_collection.update_one(
            {"bin_id": b["bin_id"]}, {"$set": b}, upsert=True
        )
        # Add initial history entry if not already present
        if history_collection.count_documents({"bin_id": b["bin_id"]}) == 0:
            history_collection.insert_one({
                "bin_id": b["bin_id"],
                "timestamp": timestamp,
                "fill_percentage": b["fill_percentage"],
                "confidence_percent": b["confidence_percent"]
            })
        seeded.append(b)

    return [_serialize(b) for b in seeded]

import random

def randomize_all_bins() -> None:
    """Randomize the fill levels of all bins to simulate live activity."""
    all_bins = list(bins_collection.find({}))
    timestamp = datetime.now(timezone.utc).isoformat()
    
    for b in all_bins:
        new_fill = round(random.uniform(10.0, 100.0), 1)
        
        if new_fill >= 90.0:
            status = "Critical"
        elif new_fill >= 70.0:
            status = "Needs Collection"
        else:
            status = "OK"
            
        recent_readings = b.get("recent_readings", [])
        old_fill = b.get("fill_percentage")
        confidence_percent = _calculate_confidence(recent_readings, new_fill, old_fill)
        
        recent_readings.append({"timestamp": timestamp, "fill_percentage": new_fill})
        if len(recent_readings) > 5:
            recent_readings = recent_readings[-5:]
            
        bins_collection.update_one(
            {"_id": b["_id"]},
            {"$set": {
                "fill_percentage": new_fill, 
                "status": status, 
                "last_updated": timestamp,
                "confidence_percent": confidence_percent,
                "recent_readings": recent_readings
            }}
        )
        
        history_collection.insert_one({
            "bin_id": b["bin_id"],
            "timestamp": timestamp,
            "fill_percentage": new_fill,
            "confidence_percent": confidence_percent
        })


from datetime import timedelta

def seed_bin_history(bin_ids: List[str], hours: int = 48) -> Dict[str, Any]:
    """Seed synthetic history for a list of bins to aid in ML prediction testing."""
    now = datetime.now(timezone.utc)
    seeded_count = 0
    
    for bin_id in bin_ids:
        # Clear existing history for clean seeding
        history_collection.delete_many({"bin_id": bin_id})
        
        # We simulate a steady increase over `hours`
        fill_level = random.uniform(5.0, 15.0)
        fill_rate_per_hour = random.uniform(1.0, 3.5)
        
        history_docs = []
        for h in range(hours, -1, -1):
            past_time = now - timedelta(hours=h)
            
            # Reset if it hits 100
            if fill_level > 95.0:
                fill_level = random.uniform(0.0, 5.0)
                
            history_docs.append({
                "bin_id": bin_id,
                "timestamp": past_time.isoformat(),
                "fill_percentage": round(fill_level, 2),
                "confidence_percent": 100.0
            })
            
            # Add normal growth
            fill_level += fill_rate_per_hour + random.uniform(-0.5, 0.5)
            
        if history_docs:
            history_collection.insert_many(history_docs)
            seeded_count += len(history_docs)
            
            # Update the main bin record to match the last history state
            last_state = history_docs[-1]
            bins_collection.update_one(
                {"bin_id": bin_id},
                {"$set": {
                    "fill_percentage": last_state["fill_percentage"],
                    "last_updated": last_state["timestamp"]
                }}
            )
            
    return {"message": f"Successfully seeded {seeded_count} historical records across {len(bin_ids)} bins."}

