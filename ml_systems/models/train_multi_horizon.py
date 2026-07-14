"""
Trains 1h/6h/24h XGBoost forecast models.
Output: outputs/models/forecast_1h.json, forecast_6h.json, forecast_24h.json,
        feature_cols.json, metrics.json
"""

import pandas as pd
import numpy as np
import json
import os
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error, r2_score

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = PROJECT_ROOT / "clean_aqi_dataset.csv"
MODEL_DIR = PROJECT_ROOT / "outputs" / "models"
HORIZONS = [1, 6, 24]

FEATURE_COLS = [
    "hour", "dayofweek", "month", "is_weekend",
    "lag_1h", "lag_24h", "rolling_mean_6h", "rolling_mean_24h",
    "wind_speed", "temperature", "relativehumidity",
    "latitude", "longitude",
]


def categorize(v):
    if v <= 50: return "Good"
    if v <= 100: return "Satisfactory"
    if v <= 200: return "Moderate"
    if v <= 300: return "Poor"
    if v <= 400: return "Very Poor"
    return "Severe"


def build_base_features(df):
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


def train_one_horizon(df, horizon):
    d = df.copy()
    d["target"] = d.groupby("location_id")["pm25"].shift(-horizon)
    d = d.dropna(subset=["target"] + FEATURE_COLS).sort_values("datetime_hour").reset_index(drop=True)

    split = int(len(d) * 0.8)
    X = d[FEATURE_COLS]
    y_log = np.log1p(d["target"])
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train_log, y_test_log = y_log.iloc[:split], y_log.iloc[split:]
    y_test = np.expm1(y_test_log)

    model = XGBRegressor(
        n_estimators=400, max_depth=4, learning_rate=0.04,
        subsample=0.7, colsample_bytree=0.7, min_child_weight=5,
        reg_lambda=2.0, early_stopping_rounds=30, eval_metric="rmse",
        random_state=42,
    )
    model.fit(X_train, y_train_log, eval_set=[(X_test, y_test_log)], verbose=False)

    preds = np.clip(np.expm1(model.predict(X_test)), 0, None)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    r2 = float(r2_score(y_test, preds))
    baseline_rmse = float(np.sqrt(mean_squared_error(y_test, X_test["lag_1h"])))
    improvement = float((1 - rmse / baseline_rmse) * 100)

    actual_cat = y_test.apply(categorize)
    pred_cat = pd.Series(preds, index=y_test.index).apply(categorize)
    cat_acc = float((actual_cat.values == pred_cat.values).mean())

    metrics = {
        "horizon_hours": horizon,
        "rmse": round(rmse, 2),
        "r2": round(r2, 3),
        "baseline_rmse": round(baseline_rmse, 2),
        "improvement_over_baseline_pct": round(improvement, 1),
        "category_accuracy_pct": round(cat_acc * 100, 1),
        "n_test_samples": int(len(y_test)),
    }
    return model, metrics


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    df = pd.read_csv(INPUT_FILE)
    print(f"Loaded {len(df)} rows")
    df = build_base_features(df)

    all_metrics = {}
    for horizon in HORIZONS:
        model, metrics = train_one_horizon(df, horizon)
        model.save_model(MODEL_DIR / f"forecast_{horizon}h.json")
        all_metrics[f"{horizon}h"] = metrics
        print(f"{horizon}h: RMSE={metrics['rmse']} R2={metrics['r2']} "
              f"improvement={metrics['improvement_over_baseline_pct']}% "
              f"category_acc={metrics['category_accuracy_pct']}%")

    with open(MODEL_DIR / "feature_cols.json", "w") as f:
        json.dump(FEATURE_COLS, f)
    with open(MODEL_DIR / "metrics.json", "w") as f:
        json.dump(all_metrics, f, indent=2)

    print(f"Saved to {MODEL_DIR}")


if __name__ == "__main__":
    main()