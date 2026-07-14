"""
Weighted enforcement priority scoring - a documented, auditable formula,
not a trained model (no ground truth exists for enforcement priority).

priority_score = 0.50 * severity_score + 0.30 * anomaly_confidence + 0.20 * trend_score

Output: outputs/results/enforcement_priority_queue.csv
"""

import pandas as pd
import numpy as np
import json
import os
from pathlib import Path
from xgboost import XGBRegressor

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = PROJECT_ROOT / "clean_aqi_dataset.csv"
MODEL_DIR = PROJECT_ROOT / "outputs" / "models"
RESULTS_DIR = PROJECT_ROOT / "outputs" / "results"

WEIGHTS = {"severity": 0.50, "anomaly": 0.30, "trend": 0.20}
assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-6

SEVERITY_SCORE = {
    "Good": 0, "Satisfactory": 20, "Moderate": 40,
    "Poor": 60, "Very Poor": 80, "Severe": 100,
}


def categorize(v):
    if v <= 50: return "Good"
    if v <= 100: return "Satisfactory"
    if v <= 200: return "Moderate"
    if v <= 300: return "Poor"
    if v <= 400: return "Very Poor"
    return "Severe"


def build_features(df):
    df = df.sort_values(["location_id", "datetime_hour"]).copy()
    df["datetime_hour"] = pd.to_datetime(df["datetime_hour"])
    df["hour"] = df["datetime_hour"].dt.hour
    df["dayofweek"] = df["datetime_hour"].dt.dayofweek
    df["month"] = df["datetime_hour"].dt.month
    df["is_weekend"] = (df["dayofweek"] >= 5).astype(int)
    g = df.groupby("location_id")["pm25"]
    df["lag_1h"] = g.shift(1)
    df["lag_24h"] = g.shift(24)
    df["rolling_mean_6h"] = g.transform(lambda x: x.shift(1).rolling(6, min_periods=1).mean())
    df["rolling_mean_24h"] = g.transform(lambda x: x.shift(1).rolling(24, min_periods=1).mean())
    return df


def main():
    os.makedirs(RESULTS_DIR, exist_ok=True)

    with open(MODEL_DIR / "feature_cols.json") as f:
        feature_cols = json.load(f)

    model_24h = XGBRegressor()
    model_24h.load_model(MODEL_DIR / "forecast_24h.json")

    df = pd.read_csv(INPUT_FILE)
    df = build_features(df)

    anomaly_lookup = {}
    anomaly_file = RESULTS_DIR / "anomaly_flagged_data.csv"
    if anomaly_file.exists():
        adf = pd.read_csv(anomaly_file)
        adf["datetime_hour"] = pd.to_datetime(adf["datetime_hour"])
        for _, r in adf.iterrows():
            anomaly_lookup[(r["location_id"], r["datetime_hour"])] = {
                "score": r["anomaly_score"], "is_anomaly": r["is_anomaly"]
            }
        print(f"Loaded {len(adf)} anomaly-scored rows")
    else:
        print("No anomaly data found - run detect_anomalies.py first for the full signal")

    rows = []
    for (city, loc_id), g in df.groupby(["city", "location_id"]):
        valid = g.dropna(subset=["pm25"]).sort_values("datetime_hour")
        if valid.empty:
            continue
        latest = valid.iloc[-1]
        current_pm25 = latest["pm25"]
        current_cat = categorize(current_pm25)
        severity_score = SEVERITY_SCORE[current_cat]

        feat_row = g.dropna(subset=feature_cols).sort_values("datetime_hour")
        trend_score = 0
        forecast_24h_val = None
        if not feat_row.empty:
            X = feat_row.iloc[[-1]][feature_cols]
            forecast_24h_val = float(np.clip(np.expm1(model_24h.predict(X)[0]), 0, None))
            change_pct = (forecast_24h_val - current_pm25) / max(current_pm25, 1) * 100
            trend_score = float(np.clip(change_pct, -100, 100))
            trend_score = (trend_score + 100) / 2

        key = (loc_id, latest["datetime_hour"])
        anomaly_info = anomaly_lookup.get(key)
        anomaly_score = 100 if (anomaly_info and anomaly_info["is_anomaly"]) else 0

        priority = (
            WEIGHTS["severity"] * severity_score
            + WEIGHTS["anomaly"] * anomaly_score
            + WEIGHTS["trend"] * trend_score
        )

        rows.append({
            "city": city,
            "location_name": latest["location_name"],
            "datetime": str(latest["datetime_hour"]),
            "current_pm25": round(float(current_pm25), 1),
            "current_category": current_cat,
            "forecast_24h_pm25": round(forecast_24h_val, 1) if forecast_24h_val else None,
            "severity_score": round(severity_score, 1),
            "anomaly_flagged": bool(anomaly_info["is_anomaly"]) if anomaly_info else None,
            "trend_score": round(trend_score, 1),
            "priority_score": round(priority, 1),
        })

    queue = pd.DataFrame(rows).sort_values("priority_score", ascending=False)
    queue.to_csv(RESULTS_DIR / "enforcement_priority_queue.csv", index=False)

    print(f"Weights: {WEIGHTS}")
    print(queue.head(10).to_string(index=False))
    print(f"Saved to {RESULTS_DIR / 'enforcement_priority_queue.csv'} ({len(queue)} zones)")


if __name__ == "__main__":
    main()