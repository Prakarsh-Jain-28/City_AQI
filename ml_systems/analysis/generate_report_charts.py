"""
Generates all model performance and analysis charts as PNG files.
Requires train_multi_horizon.py, cluster_source_attribution.py, and
detect_anomalies.py to have already been run.
Output: outputs/charts/*.png
"""

import pandas as pd
import numpy as np
import json
import os
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from xgboost import XGBRegressor

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = PROJECT_ROOT / "clean_aqi_dataset.csv"
MODEL_DIR = PROJECT_ROOT / "outputs" / "models"
RESULTS_DIR = PROJECT_ROOT / "outputs" / "results"
CHART_DIR = PROJECT_ROOT / "outputs" / "charts"
os.makedirs(CHART_DIR, exist_ok=True)

plt.rcParams.update({
    "figure.facecolor": "#0b1210",
    "axes.facecolor": "#111b18",
    "axes.edgecolor": "#1e2b27",
    "text.color": "#e8ede9",
    "axes.labelcolor": "#e8ede9",
    "xtick.color": "#8fa39a",
    "ytick.color": "#8fa39a",
    "grid.color": "#1e2b27",
    "font.size": 10,
})
ACCENT = "#35d6a3"


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


def chart_accuracy_summary():
    with open(MODEL_DIR / "metrics.json") as f:
        metrics = json.load(f)

    horizons = list(metrics.keys())
    cat_acc = [metrics[h]["category_accuracy_pct"] for h in horizons]
    improvement = [metrics[h]["improvement_over_baseline_pct"] for h in horizons]

    fig, ax = plt.subplots(1, 2, figsize=(11, 4.5))
    bars1 = ax[0].bar(horizons, cat_acc, color=ACCENT, width=0.5)
    ax[0].set_title("Category Accuracy by Horizon", fontsize=11)
    ax[0].set_ylabel("% correct category")
    ax[0].set_ylim(0, 100)
    for b, v in zip(bars1, cat_acc):
        ax[0].text(b.get_x() + b.get_width()/2, v + 2, f"{v}%", ha="center", color="#e8ede9")

    bars2 = ax[1].bar(horizons, improvement, color="#a8d635", width=0.5)
    ax[1].set_title("RMSE Improvement vs Baseline", fontsize=11)
    ax[1].set_ylabel("% improvement")
    ax[1].set_ylim(0, max(improvement) * 1.3)
    for b, v in zip(bars2, improvement):
        ax[1].text(b.get_x() + b.get_width()/2, v + 1, f"{v}%", ha="center", color="#e8ede9")

    plt.tight_layout()
    plt.savefig(CHART_DIR / "01_accuracy_summary.png", dpi=140)
    plt.close()


def chart_actual_vs_predicted():
    with open(MODEL_DIR / "feature_cols.json") as f:
        feature_cols = json.load(f)

    df = pd.read_csv(DATA_FILE)
    df = build_features(df)

    fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))
    for ax, horizon in zip(axes, [1, 6, 24]):
        d = df.copy()
        d["target"] = d.groupby("location_id")["pm25"].shift(-horizon)
        d = d.dropna(subset=["target"] + feature_cols).sort_values("datetime_hour").reset_index(drop=True)
        split = int(len(d) * 0.8)
        X_test = d[feature_cols].iloc[split:]
        y_test = d["target"].iloc[split:]

        model = XGBRegressor()
        model.load_model(MODEL_DIR / f"forecast_{horizon}h.json")
        preds = np.clip(np.expm1(model.predict(X_test)), 0, None)

        ax.scatter(y_test, preds, s=6, alpha=0.35, color=ACCENT)
        max_val = max(y_test.max(), preds.max())
        ax.plot([0, max_val], [0, max_val], color="#8fa39a", linestyle="--", linewidth=1)
        ax.set_xlabel("Actual pm25")
        ax.set_ylabel("Predicted pm25")
        ax.set_title(f"{horizon}h ahead (n={len(y_test)})", fontsize=11)

    plt.tight_layout()
    plt.savefig(CHART_DIR / "02_actual_vs_predicted.png", dpi=140)
    plt.close()


def chart_feature_importance():
    with open(MODEL_DIR / "feature_cols.json") as f:
        feature_cols = json.load(f)

    model = XGBRegressor()
    model.load_model(MODEL_DIR / "forecast_24h.json")
    importance = pd.Series(model.feature_importances_, index=feature_cols).sort_values()

    fig, ax = plt.subplots(figsize=(8, 6))
    ax.barh(importance.index, importance.values, color=ACCENT)
    ax.set_title("Feature Importance - 24h Model", fontsize=11)
    plt.tight_layout()
    plt.savefig(CHART_DIR / "03_feature_importance.png", dpi=140)
    plt.close()


def chart_multi_city_forecast():
    with open(MODEL_DIR / "feature_cols.json") as f:
        feature_cols = json.load(f)

    df = pd.read_csv(DATA_FILE)
    df = build_features(df)
    cities = sorted(df["city"].unique())

    fig, ax = plt.subplots(figsize=(10, 5))
    width = 0.25
    x = np.arange(len(cities))

    for i, horizon in enumerate([1, 6, 24]):
        model = XGBRegressor()
        model.load_model(MODEL_DIR / f"forecast_{horizon}h.json")
        preds_per_city = []
        for city in cities:
            city_df = df[df["city"] == city].dropna(subset=feature_cols)
            if city_df.empty:
                preds_per_city.append(0)
                continue
            latest = city_df.sort_values("datetime_hour").iloc[[-1]][feature_cols]
            pred = float(np.clip(np.expm1(model.predict(latest)[0]), 0, None))
            preds_per_city.append(pred)
        ax.bar(x + i * width, preds_per_city, width, label=f"{horizon}h ahead")

    ax.set_xticks(x + width)
    ax.set_xticklabels(cities)
    ax.set_ylabel("Predicted PM2.5")
    ax.set_title("Multi-Horizon Forecast by City", fontsize=11)
    ax.legend()
    plt.tight_layout()
    plt.savefig(CHART_DIR / "04_multi_city_forecast.png", dpi=140)
    plt.close()


def chart_clusters():
    cluster_file = RESULTS_DIR / "clustered_data.csv"
    if not cluster_file.exists():
        return
    cdf = pd.read_csv(cluster_file)

    fig, ax = plt.subplots(figsize=(8, 6))
    colors = plt.cm.viridis(np.linspace(0, 1, cdf["cluster"].nunique()))
    for i, cl in enumerate(sorted(cdf["cluster"].unique())):
        sub = cdf[cdf["cluster"] == cl]
        ax.scatter(sub["pm_ratio"], sub["no2_to_pm25"], s=8, alpha=0.4,
                   color=colors[i], label=f"Cluster {cl} ({sub['likely_source'].mode()[0]})")

    ax.set_xlabel("PM10:PM2.5 ratio")
    ax.set_ylabel("NO2:PM2.5 ratio")
    ax.set_title("Source Clusters", fontsize=11)
    ax.legend(fontsize=8)
    plt.tight_layout()
    plt.savefig(CHART_DIR / "05_source_clusters.png", dpi=140)
    plt.close()


def chart_anomalies():
    anomaly_file = RESULTS_DIR / "anomaly_flagged_data.csv"
    if not anomaly_file.exists():
        return
    adf = pd.read_csv(anomaly_file)
    adf["datetime_hour"] = pd.to_datetime(adf["datetime_hour"])

    top_station = adf[adf["is_anomaly"]]["location_name"].mode()
    if top_station.empty:
        return
    station_df = adf[adf["location_name"] == top_station.iloc[0]].sort_values("datetime_hour")

    fig, ax = plt.subplots(figsize=(11, 4.5))
    ax.plot(station_df["datetime_hour"], station_df["pm25"], color=ACCENT, linewidth=1)
    anomalies = station_df[station_df["is_anomaly"]]
    ax.scatter(anomalies["datetime_hour"], anomalies["pm25"], color="#e0503a", s=25, zorder=5)
    ax.set_title(f"Anomaly Detection - {top_station.iloc[0]}", fontsize=11)
    plt.tight_layout()
    plt.savefig(CHART_DIR / "06_anomaly_timeline.png", dpi=140)
    plt.close()


def chart_data_completeness():
    df = pd.read_csv(DATA_FILE)
    completeness = df.groupby("city")[["pm25", "pm10", "no2", "wind_speed", "temperature"]].apply(
        lambda g: g.notna().mean() * 100
    )

    fig, ax = plt.subplots(figsize=(9, 5))
    completeness.plot(kind="bar", ax=ax, colormap="viridis", width=0.75)
    ax.set_ylabel("% complete")
    ax.set_title("Data Completeness by City", fontsize=11)
    ax.legend(bbox_to_anchor=(1.02, 1), loc="upper left", fontsize=8)
    plt.tight_layout()
    plt.savefig(CHART_DIR / "07_data_completeness.png", dpi=140)
    plt.close()


if __name__ == "__main__":
    chart_accuracy_summary()
    chart_actual_vs_predicted()
    chart_feature_importance()
    chart_multi_city_forecast()
    chart_clusters()
    chart_anomalies()
    chart_data_completeness()
    print(f"Saved to {CHART_DIR}")