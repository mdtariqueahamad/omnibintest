
# pyrefly: ignore [missing-import]
from pymongo import MongoClient, ASCENDING
from app.config import settings

# Initialize synchronous MongoClient
client = MongoClient(settings.mongodb_uri)
db = client[settings.mongodb_db_name]

# Expose collections
bins_collection = db["bins"]
history_collection = db["bin_history"]
config_collection = db["fleet_config"]
operators_collection = db["operators"]


def init_db_indexes():
    """Create indexes to ensure unique bin IDs and optimize queries."""
    try:
        bins_collection.create_index([("bin_id", ASCENDING)], unique=True)
        history_collection.create_index([("bin_id", ASCENDING), ("timestamp", ASCENDING)])
        operators_collection.create_index([("username", ASCENDING)], unique=True)
    except Exception as e:
        # Gracefully handle if DB connection is unavailable during startup
        pass
