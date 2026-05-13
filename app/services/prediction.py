from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from app.database import history_collection, bins_collection
from app.models import BinPrediction


def _extract_features(timestamp_str: str, base_time: datetime) -> list:
    """Extract hour, day of week, and elapsed hours as ML features."""
    dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    elapsed_hours = (dt - base_time).total_seconds() / 3600.0
    return [dt.hour, dt.weekday(), elapsed_hours]


def predict_future_fill_level(bin_id: str, hours_ahead: int) -> BinPrediction:
    # 1. Fetch historical data for this bin (limit to last 100 readings for speed & relevance)
    # Sorting by timestamp descending to get the most recent, then reverse for chronological
    cursor = history_collection.find({"bin_id": bin_id}).sort("timestamp", -1).limit(100)
    history_docs = list(cursor)
    history_docs.reverse()

    target_future_dt = datetime.utcnow() + timedelta(hours=hours_ahead)
    target_future_timestamp = target_future_dt.isoformat() + "Z"

    if not history_docs:
        # Fallback to current fill level if no history
        bin_doc = bins_collection.find_one({"bin_id": bin_id})
        current_fill = bin_doc.get("fill_percentage", 0.0) if bin_doc else 0.0
        return BinPrediction(
            bin_id=bin_id,
            predicted_fill_percentage=current_fill,
            error_rate_high=True,
            data_points_used=0,
            target_future_timestamp=target_future_timestamp
        )

    data_points_used = len(history_docs)
    error_rate_high = data_points_used < 10

    # 2. Extract Features
    base_time = datetime.fromisoformat(history_docs[0]["timestamp"].replace('Z', '+00:00'))
    
    X = []
    y = []
    
    for doc in history_docs:
        features = _extract_features(doc["timestamp"], base_time)
        X.append(features)
        y.append(doc["fill_percentage"])

    X = np.array(X)
    y = np.array(y)

    # 3. Train Model
    # Using a simple Random Forest Regressor
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)

    # 4. Predict
    future_features = _extract_features(target_future_timestamp, base_time)
    X_pred = np.array([future_features])
    
    predicted_fill = model.predict(X_pred)[0]
    
    # 5. Sanitize Output (0 to 100%)
    predicted_fill = max(0.0, min(100.0, float(predicted_fill)))

    # If it predicts it goes down without a collection event being obvious,
    # or if we want to ensure monotonic increase, we could enforce logic here.
    # For now, trust the model's pattern recognition.
    
    return BinPrediction(
        bin_id=bin_id,
        predicted_fill_percentage=round(predicted_fill, 2),
        error_rate_high=error_rate_high,
        data_points_used=data_points_used,
        target_future_timestamp=target_future_timestamp
    )
