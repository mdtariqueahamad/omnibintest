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
        {
            "bin_id": "bin_005",
            "location": "Govindpura Industrial Area",
            "latitude": 23.2500,
            "longitude": 77.4500,
            "capacity": 100.0,
            "priority": 1,
            "fill_percentage": 97.0,
            "status": "Critical",
        },
        # 30 New Nodes for Bhopal
        {
            "bin_id": "bin_006",
            "location": "Bhopal Junction Railway Station",
            "latitude": 23.2660,
            "longitude": 77.4140,
            "capacity": 200.0,
            "priority": 2,
            "fill_percentage": 55.2,
            "status": "OK",
        },
        {
            "bin_id": "bin_007",
            "location": "Upper Lake (Boat Club)",
            "latitude": 23.2505,
            "longitude": 77.3910,
            "capacity": 120.0,
            "priority": 3,
            "fill_percentage": 35.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_008",
            "location": "New Market",
            "latitude": 23.2335,
            "longitude": 77.4011,
            "capacity": 150.0,
            "priority": 2,
            "fill_percentage": 48.5,
            "status": "OK",
        },
        {
            "bin_id": "bin_009",
            "location": "AIIMS Bhopal",
            "latitude": 23.2045,
            "longitude": 77.4600,
            "capacity": 120.0,
            "priority": 3,
            "fill_percentage": 45.3,
            "status": "OK",
        },
        {
            "bin_id": "bin_010",
            "location": "MANIT Campus",
            "latitude": 23.2140,
            "longitude": 77.4055,
            "capacity": 100.0,
            "priority": 2,
            "fill_percentage": 26.1,
            "status": "OK",
        },
        {
            "bin_id": "bin_011",
            "location": "Sair Sapata",
            "latitude": 23.2105,
            "longitude": 77.3888,
            "capacity": 80.0,
            "priority": 3,
            "fill_percentage": 30.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_012",
            "location": "VIP Road",
            "latitude": 23.2690,
            "longitude": 77.3870,
            "capacity": 100.0,
            "priority": 2,
            "fill_percentage": 51.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_013",
            "location": "Kolar Road (Chuna Bhatti)",
            "latitude": 23.1895,
            "longitude": 77.4100,
            "capacity": 120.0,
            "priority": 3,
            "fill_percentage": 42.4,
            "status": "OK",
        },
        {
            "bin_id": "bin_014",
            "location": "Awadhpuri Square",
            "latitude": 23.2325,
            "longitude": 77.4810,
            "capacity": 80.0,
            "priority": 2,
            "fill_percentage": 22.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_015",
            "location": "Indrapuri C-Sector",
            "latitude": 23.2560,
            "longitude": 77.4655,
            "capacity": 100.0,
            "priority": 1,
            "fill_percentage": 96.5,
            "status": "Critical",
        },
        {
            "bin_id": "bin_016",
            "location": "Ashoka Garden",
            "latitude": 23.2680,
            "longitude": 77.4285,
            "capacity": 150.0,
            "priority": 3,
            "fill_percentage": 38.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_017",
            "location": "Habibganj Naka",
            "latitude": 23.2205,
            "longitude": 77.4360,
            "capacity": 120.0,
            "priority": 2,
            "fill_percentage": 58.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_018",
            "location": "Misrod (Hoshangabad Road)",
            "latitude": 23.1855,
            "longitude": 77.4680,
            "capacity": 100.0,
            "priority": 3,
            "fill_percentage": 49.9,
            "status": "OK",
        },
        {
            "bin_id": "bin_019",
            "location": "Barkatullah University",
            "latitude": 23.2005,
            "longitude": 77.4475,
            "capacity": 80.0,
            "priority": 2,
            "fill_percentage": 40.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_020",
            "location": "ISBT (Chetak Bridge)",
            "latitude": 23.2425,
            "longitude": 77.4455,
            "capacity": 200.0,
            "priority": 1,
            "fill_percentage": 99.1,
            "status": "Critical",
        },
        {
            "bin_id": "bin_021",
            "location": "TT Nagar Stadium",
            "latitude": 23.2315,
            "longitude": 77.3985,
            "capacity": 150.0,
            "priority": 3,
            "fill_percentage": 12.5,
            "status": "OK",
        },
        {
            "bin_id": "bin_022",
            "location": "Taj-ul-Masajid",
            "latitude": 23.2605,
            "longitude": 77.3940,
            "capacity": 120.0,
            "priority": 2,
            "fill_percentage": 34.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_023",
            "location": "Karond Chauraha",
            "latitude": 23.3005,
            "longitude": 77.4150,
            "capacity": 100.0,
            "priority": 3,
            "fill_percentage": 42.5,
            "status": "OK",
        },
        {
            "bin_id": "bin_024",
            "location": "Bairagarh Main Road",
            "latitude": 23.2755,
            "longitude": 77.3325,
            "capacity": 120.0,
            "priority": 2,
            "fill_percentage": 47.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_025",
            "location": "Vallabh Bhawan (Mantralaya)",
            "latitude": 23.2405,
            "longitude": 77.4160,
            "capacity": 100.0,
            "priority": 3,
            "fill_percentage": 35.5,
            "status": "OK",
        },
        {
            "bin_id": "bin_026",
            "location": "Shahpura Lake Promenade",
            "latitude": 23.2055,
            "longitude": 77.4245,
            "capacity": 80.0,
            "priority": 2,
            "fill_percentage": 36.2,
            "status": "OK",
        },
        {
            "bin_id": "bin_027",
            "location": "Ayodhya Bypass Road",
            "latitude": 23.2845,
            "longitude": 77.4560,
            "capacity": 100.0,
            "priority": 3,
            "fill_percentage": 40.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_028",
            "location": "Bittan Market",
            "latitude": 23.2215,
            "longitude": 77.4170,
            "capacity": 150.0,
            "priority": 1,
            "fill_percentage": 94.0,
            "status": "Critical",
        },
        {
            "bin_id": "bin_029",
            "location": "Jinsi Chauraha",
            "latitude": 23.2610,
            "longitude": 77.4125,
            "capacity": 100.0,
            "priority": 2,
            "fill_percentage": 41.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_030",
            "location": "Lalghati Square",
            "latitude": 23.2740,
            "longitude": 77.3755,
            "capacity": 120.0,
            "priority": 3,
            "fill_percentage": 44.4,
            "status": "OK",
        },
        {
            "bin_id": "bin_031",
            "location": "Jahangirabad",
            "latitude": 23.2545,
            "longitude": 77.4090,
            "capacity": 100.0,
            "priority": 2,
            "fill_percentage": 58.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_032",
            "location": "Mata Mandir Square",
            "latitude": 23.2260,
            "longitude": 77.4020,
            "capacity": 120.0,
            "priority": 3,
            "fill_percentage": 47.5,
            "status": "OK",
        },
        {
            "bin_id": "bin_033",
            "location": "10 No. Market",
            "latitude": 23.2175,
            "longitude": 77.4150,
            "capacity": 150.0,
            "priority": 1,
            "fill_percentage": 93.0,
            "status": "Critical",
        },
        {
            "bin_id": "bin_034",
            "location": "BHEL Township (Piplani)",
            "latitude": 23.2515,
            "longitude": 77.4720,
            "capacity": 100.0,
            "priority": 2,
            "fill_percentage": 18.0,
            "status": "OK",
        },
        {
            "bin_id": "bin_035",
            "location": "Van Vihar Gate",
            "latitude": 23.2381,
            "longitude": 77.3698,
            "capacity": 80.0,
            "priority": 3,
            "fill_percentage": 25.0,
            "status": "OK",
        }
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
            
        bins_collection.update_one(
            {"_id": b["_id"]},
            {"$set": {"fill_percentage": new_fill, "status": status, "last_updated": timestamp}}
        )
        
        history_collection.insert_one({
            "bin_id": b["bin_id"],
            "timestamp": timestamp,
            "fill_percentage": new_fill
        })
