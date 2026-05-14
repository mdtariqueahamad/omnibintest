from datetime import datetime, timedelta, timezone
import numpy as np
from sklearn.linear_model import LinearRegression
from app.database import history_collection, bins_collection
from app.models import BinPrediction


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
            hours_until_full=0 if current_fill >= 99.0 else -1,
            error_rate_high=True,
            data_points_used=0,
            target_future_timestamp=target_future_timestamp
        )

    # 2. Find the last time the bin was emptied to get the current filling segment
    last_drop_idx = 0
    for i in range(1, len(history_docs)):
        if history_docs[i-1]["fill_percentage"] - history_docs[i]["fill_percentage"] > 10.0:
            last_drop_idx = i

    recent_docs = history_docs[last_drop_idx:]
    data_points_used = len(recent_docs)
    error_rate_high = data_points_used < 3

    # 3. Extract Features for Linear Regression
    X = []
    y = []
    base_time = datetime.fromisoformat(recent_docs[0]["timestamp"].replace('Z', '+00:00'))
    for doc in recent_docs:
        dt = datetime.fromisoformat(doc["timestamp"].replace('Z', '+00:00'))
        elapsed = (dt - base_time).total_seconds() / 3600.0
        X.append([elapsed])
        y.append(doc["fill_percentage"])

    X = np.array(X)
    y = np.array(y)

    # 4. Train Model and Calculate Fill Rate
    fill_rate = 0.0
    if len(recent_docs) >= 2:
        model = LinearRegression()
        model.fit(X, y)
        fill_rate = float(model.coef_[0])

    bin_doc = bins_collection.find_one({"bin_id": bin_id})
    current_fill = bin_doc.get("fill_percentage", 0.0) if bin_doc else (y[-1] if len(y) > 0 else 0.0)

    # 5. Predict Fill Level `hours_ahead`
    if fill_rate > 0.0:
        predicted_fill = current_fill + (fill_rate * hours_ahead)
    else:
        predicted_fill = current_fill
        
    predicted_fill = max(0.0, min(100.0, float(predicted_fill)))

    # 6. Calculate hours until full
    hours_until_full = -1
    if current_fill >= 99.0:
        hours_until_full = 0
    elif fill_rate > 0.01:
        hours_to_full_float = (100.0 - current_fill) / fill_rate
        if hours_to_full_float <= 168.0:
            hours_until_full = int(hours_to_full_float)

    return BinPrediction(
        bin_id=bin_id,
        predicted_fill_percentage=round(predicted_fill, 2),
        hours_until_full=hours_until_full,
        error_rate_high=error_rate_high,
        data_points_used=data_points_used,
        target_future_timestamp=target_future_timestamp
    )
