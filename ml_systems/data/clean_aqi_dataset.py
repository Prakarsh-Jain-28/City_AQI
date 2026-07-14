"""
Cleans real_aqi_dataset.csv into a model-ready dataset: pivots parameters
into columns, filters to a date range, removes invalid values.
Output: clean_aqi_dataset.csv
"""

import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = PROJECT_ROOT / "real_aqi_dataset.csv"
OUTPUT_FILE = PROJECT_ROOT / "clean_aqi_dataset.csv"

DATE_FROM = "2025-01-01"
DATE_TO = "2025-12-31"

NON_NEGATIVE_PARAMS = ["pm25", "pm10", "no2", "no", "nox", "o3", "co", "so2"]


def main():
    df = pd.read_csv(INPUT_FILE)
    print(f"Loaded {len(df)} raw rows")

    df["datetime_utc"] = pd.to_datetime(df["datetime_utc"], utc=True, errors="coerce")
    df = df.dropna(subset=["datetime_utc"])

    mask = (df["datetime_utc"] >= DATE_FROM) & (df["datetime_utc"] <= DATE_TO)
    df = df[mask]
    print(f"After date filter ({DATE_FROM} to {DATE_TO}): {len(df)} rows")

    if len(df) == 0:
        print(f"No rows in this range. Data spans {df['datetime_utc'].min()} to {df['datetime_utc'].max()}.")
        return

    before = len(df)
    invalid_mask = df["parameter"].isin(NON_NEGATIVE_PARAMS) & (df["value"] < 0)
    df = df[~invalid_mask]
    print(f"Dropped {before - len(df)} invalid negative rows")

    df["datetime_hour"] = df["datetime_utc"].dt.floor("h")

    pivot = df.pivot_table(
        index=["city", "location_id", "location_name", "latitude", "longitude", "datetime_hour"],
        columns="parameter",
        values="value",
        aggfunc="mean",
    ).reset_index()
    pivot.columns.name = None

    print(f"Pivoted shape: {pivot.shape}")
    print("Missing value % per column:")
    print((pivot.isna().mean() * 100).round(1))

    pivot.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved to {OUTPUT_FILE}")
    print(pivot.groupby("city").size())


if __name__ == "__main__":
    main()