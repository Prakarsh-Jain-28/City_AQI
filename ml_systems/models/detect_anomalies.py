"""
Isolation Forest anomaly detection on real pollutant/weather readings.
Filters out stuck-sensor readings before scoring.
Output: outputs/results/anomaly_flagged_data.csv
"""

import pandas as pd
import numpy as np
import os
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = PROJECT_ROOT / "clean_aqi_dataset.csv"
OUTPUT_DIR = PROJECT_ROOT / "outputs" / "results"
CONTAMINATION = 0.05


def flag_stuck_sensors(df, value_col="pm25", min_repeat=4):
    df = df.sort_values(["location_id", "datetime_hour"]).copy()
    same_as_prev = df.groupby("location_id")[value_col].diff().eq(0)
    run_id = (~same_as_prev).cumsum()
    run_length = df.groupby(["location_id", run_id])[value_col].transform("size")
    df["is_stuck_sensor"] = same_as_prev & (run_length >= min_repeat)
    return df


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df = pd.read_csv(INPUT_FILE)
    df["datetime_hour"] = pd.to_datetime(df["datetime_hour"])
    df["hour"] = df["datetime_hour"].dt.hour
    df["dayofweek"] = df["datetime_hour"].dt.dayofweek

    df = flag_stuck_sensors(df, value_col="pm25", min_repeat=4)
    n_stuck = df["is_stuck_sensor"].sum()
    print(f"Stuck-sensor readings removed: {n_stuck}")
    df = df[~df["is_stuck_sensor"]].copy()

    feature_cols = ["pm25", "pm10", "no2", "wind_speed", "temperature", "hour"]
    model_df = df.dropna(subset=feature_cols).copy()
    print(f"Rows: {len(model_df)}")

    X = model_df[feature_cols]
    X_scaled = StandardScaler().fit_transform(X)

    model = IsolationForest(contamination=CONTAMINATION, n_estimators=200, random_state=42)
    model.fit(X_scaled)

    model_df["anomaly_score"] = model.decision_function(X_scaled)
    model_df["is_anomaly"] = model.predict(X_scaled) == -1

    n_flagged = model_df["is_anomaly"].sum()
    print(f"Flagged {n_flagged} anomalies ({n_flagged/len(model_df)*100:.1f}%)")
    print(model_df.groupby("is_anomaly")[["pm25", "pm10", "no2"]].mean().round(1))

    top = model_df.nsmallest(10, "anomaly_score")[
        ["city", "location_name", "datetime_hour", "pm25", "pm10", "no2", "anomaly_score"]
    ]
    print(top.to_string(index=False))

    model_df.to_csv(OUTPUT_DIR / "anomaly_flagged_data.csv", index=False)
    print(f"Saved to {OUTPUT_DIR / 'anomaly_flagged_data.csv'}")


if __name__ == "__main__":
    main()