"""
Fetches historical air quality data from the OpenAQ v3 API for multiple cities.
Requires OPENAQ_API_KEY in a .env file at the project root.
Output: real_aqi_dataset.csv
"""

import os
import requests
import pandas as pd
import time
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=PROJECT_ROOT / ".env")

API_KEY = os.environ.get("OPENAQ_API_KEY")
if not API_KEY:
    raise RuntimeError(f"OPENAQ_API_KEY not found. Expected a .env file at: {PROJECT_ROOT / '.env'}")

BASE_URL = "https://api.openaq.org/v3"
HEADERS = {"X-API-Key": API_KEY}

TARGET_CITIES = ["Delhi", "Mumbai", "Bengaluru", "Kolkata"]
DATE_FROM = "2026-04-01"
DATE_TO = "2026-07-08"
OUTPUT_FILE = PROJECT_ROOT / "real_aqi_dataset.csv"


def get_india_locations(limit=1000):
    url = f"{BASE_URL}/locations"
    params = {"iso": "IN", "limit": limit}
    resp = requests.get(url, headers=HEADERS, params=params)
    resp.raise_for_status()
    return resp.json()["results"]


def get_location_sensors(location_id):
    url = f"{BASE_URL}/locations/{location_id}/sensors"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()["results"]


def get_sensor_measurements(sensor_id, date_from, date_to, limit=1000):
    url = f"{BASE_URL}/sensors/{sensor_id}/measurements"
    params = {"date_from": date_from, "date_to": date_to, "limit": limit}
    resp = requests.get(url, headers=HEADERS, params=params)
    resp.raise_for_status()
    return resp.json()["results"]


def location_matches_city(location, target_cities):
    name = (location.get("name") or "").lower()
    locality = (location.get("locality") or "").lower()
    for city in target_cities:
        if city.lower() in name or city.lower() in locality:
            return city
    return None


if __name__ == "__main__":
    all_locations = get_india_locations()
    print(f"Total stations found: {len(all_locations)}")

    all_rows = []

    for loc in all_locations:
        matched_city = location_matches_city(loc, TARGET_CITIES)
        if not matched_city:
            continue

        loc_id = loc["id"]
        loc_name = loc["name"]
        lat = loc["coordinates"]["latitude"]
        lon = loc["coordinates"]["longitude"]

        print(f"Station: {loc_name} ({matched_city}) - id {loc_id}")

        try:
            sensors = get_location_sensors(loc_id)
        except Exception as e:
            print(f"  Skipping - could not fetch sensors: {e}")
            continue

        for sensor in sensors:
            param = sensor["parameter"]["name"]
            sensor_id = sensor["id"]
            try:
                measurements = get_sensor_measurements(sensor_id, DATE_FROM, DATE_TO)
            except Exception as e:
                print(f"  Skipping sensor {sensor_id} ({param}): {e}")
                continue

            print(f"  {param}: {len(measurements)} measurements")

            for m in measurements:
                all_rows.append({
                    "city": matched_city,
                    "location_id": loc_id,
                    "location_name": loc_name,
                    "latitude": lat,
                    "longitude": lon,
                    "parameter": param,
                    "value": m["value"],
                    "unit": m.get("unit"),
                    "datetime_utc": m["period"]["datetimeFrom"]["utc"],
                })

            time.sleep(0.5)

    df = pd.DataFrame(all_rows)
    print(f"Total rows collected: {len(df)}")

    if len(df) > 0:
        df.to_csv(OUTPUT_FILE, index=False)
        print(f"Saved to {OUTPUT_FILE}")
        print(df.groupby("city").size())
    else:
        print("No data collected. Check TARGET_CITIES names or date range.")