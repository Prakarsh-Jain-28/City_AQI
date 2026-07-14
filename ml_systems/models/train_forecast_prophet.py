"""
Prophet baseline forecaster, for comparison against the XGBoost model.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from prophet import Prophet
from sklearn.metrics import mean_squared_error, mean_absolute_error
import warnings
warnings.filterwarnings("ignore")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = PROJECT_ROOT / "clean_aqi_dataset.csv"
TARGET = "pm25"


def main():
    df = pd.read_csv(INPUT_FILE)
    df["datetime_hour"] = pd.to_datetime(df["datetime_hour"]).dt.tz_localize(None)

    counts = df.groupby("location_id")[TARGET].count().sort_values(ascending=False)
    best_station = counts.index[0]
    print(f"Station {best_station} ({counts.iloc[0]} readings)")

    station_df = df[df["location_id"] == best_station][["datetime_hour", TARGET]].dropna()
    station_df = station_df.rename(columns={"datetime_hour": "ds", TARGET: "y"}).sort_values("ds")

    split_idx = int(len(station_df) * 0.8)
    train_df = station_df.iloc[:split_idx]
    test_df = station_df.iloc[split_idx:]

    model = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=False)
    model.fit(train_df)

    forecast = model.predict(test_df[["ds"]])
    preds = np.clip(forecast["yhat"].values, 0, None)
    actual = test_df["y"].values

    rmse = np.sqrt(mean_squared_error(actual, preds))
    mae = mean_absolute_error(actual, preds)

    baseline_preds = station_df["y"].shift(1).iloc[split_idx:].values
    valid = ~np.isnan(baseline_preds)
    baseline_rmse = np.sqrt(mean_squared_error(actual[valid], baseline_preds[valid]))

    print(f"Prophet RMSE={rmse:.2f} MAE={mae:.2f}")
    print(f"Baseline RMSE={baseline_rmse:.2f}")


if __name__ == "__main__":
    main()