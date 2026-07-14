"""
Unsupervised clustering for pollution source attribution. No labeled ground
truth exists for this task, so clusters are discovered from real pollutant
ratios, then interpreted using documented domain signatures.
Output: outputs/results/clustered_data.csv
"""

import pandas as pd
import numpy as np
import os
from pathlib import Path
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = PROJECT_ROOT / "clean_aqi_dataset.csv"
OUTPUT_DIR = PROJECT_ROOT / "outputs" / "results"
N_CLUSTERS = 4


def engineer_attribution_features(df):
    df = df.copy()
    df["datetime_hour"] = pd.to_datetime(df["datetime_hour"])
    df["hour"] = df["datetime_hour"].dt.hour

    safe_pm25 = df["pm25"].where(df["pm25"] > 2, np.nan)
    df["pm_ratio"] = (df["pm10"] / safe_pm25).clip(upper=10)
    df["no2_to_pm25"] = (df["no2"] / safe_pm25).clip(upper=5)

    df["is_morning_peak"] = df["hour"].between(7, 10).astype(int)
    df["is_evening_peak"] = df["hour"].between(17, 21).astype(int)
    df["is_night"] = (~df["hour"].between(6, 20)).astype(int)
    return df


def interpret_cluster(row):
    if row["no2_to_pm25"] > row["no2_to_pm25_median"] and (row["is_morning_peak"] or row["is_evening_peak"]):
        return "traffic-dominated"
    elif row["pm_ratio"] > row["pm_ratio_median"]:
        return "dust/construction-dominated"
    elif row["is_night"] and row["pm25"] > row["pm25_median"]:
        return "biomass-burning-likely"
    else:
        return "background/mixed"


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df = pd.read_csv(INPUT_FILE)
    df = engineer_attribution_features(df)

    feature_cols = ["pm_ratio", "no2_to_pm25", "hour", "wind_speed", "temperature"]
    cluster_df = df.dropna(subset=feature_cols).copy()
    print(f"Rows: {len(cluster_df)}")

    X = cluster_df[feature_cols]
    X_scaled = StandardScaler().fit_transform(X)

    kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init=10)
    cluster_df["cluster"] = kmeans.fit_predict(X_scaled)

    print(cluster_df.groupby("cluster")[feature_cols + ["pm25", "pm10"]].mean().round(2))
    print(cluster_df["cluster"].value_counts().sort_index())

    cluster_df["no2_to_pm25_median"] = cluster_df["no2_to_pm25"].median()
    cluster_df["pm_ratio_median"] = cluster_df["pm_ratio"].median()
    cluster_df["pm25_median"] = cluster_df["pm25"].median()
    cluster_df["likely_source"] = cluster_df.apply(interpret_cluster, axis=1)

    print(cluster_df["likely_source"].value_counts())

    cluster_df.to_csv(OUTPUT_DIR / "clustered_data.csv", index=False)
    print(f"Saved to {OUTPUT_DIR / 'clustered_data.csv'}")


if __name__ == "__main__":
    main()