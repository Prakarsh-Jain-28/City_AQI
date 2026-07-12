import os
import sqlite3
import datetime
import random
import math
import pandas as pd
import numpy as np
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), "aqi_data.db")

STATIONS = [
    # Delhi (3 stations)
    {"id": "DL001", "name": "Anand Vihar DPCC", "city": "Delhi", "lat": 28.6476, "lon": 77.3158, "is_industrial": 1},
    {"id": "DL002", "name": "ITO DPCC", "city": "Delhi", "lat": 28.6284, "lon": 77.2400, "is_industrial": 0},
    {"id": "DL003", "name": "RK Puram DPCC", "city": "Delhi", "lat": 28.5660, "lon": 77.1862, "is_industrial": 0},
    # Mumbai (3 stations)
    {"id": "MH001", "name": "Bandra MPCB", "city": "Mumbai", "lat": 19.0620, "lon": 72.8276, "is_industrial": 0},
    {"id": "MH002", "name": "Colaba MPCB", "city": "Mumbai", "lat": 18.9067, "lon": 72.8147, "is_industrial": 0},
    {"id": "MH003", "name": "Kurla MPCB", "city": "Mumbai", "lat": 19.0726, "lon": 72.8808, "is_industrial": 1},
    # Kolkata (2 stations)
    {"id": "WB001", "name": "Victoria WBPCB", "city": "Kolkata", "lat": 22.5448, "lon": 88.3426, "is_industrial": 0},
    {"id": "WB002", "name": "Ballygunge WBPCB", "city": "Kolkata", "lat": 22.5280, "lon": 88.3659, "is_industrial": 0},
    # Chennai (2 stations)
    {"id": "TN001", "name": "Alandur TNPCB", "city": "Chennai", "lat": 13.0033, "lon": 80.2011, "is_industrial": 1},
    {"id": "TN002", "name": "Velachery TNPCB", "city": "Chennai", "lat": 12.9802, "lon": 80.2224, "is_industrial": 0},
    # Bengaluru (3 stations)
    {"id": "KA001", "name": "Silk Board KSPCB", "city": "Bengaluru", "lat": 12.9172, "lon": 77.6228, "is_industrial": 0},
    {"id": "KA002", "name": "Peenya KSPCB", "city": "Bengaluru", "lat": 13.0285, "lon": 77.5197, "is_industrial": 1},
    {"id": "KA003", "name": "City Railway Station KSPCB", "city": "Bengaluru", "lat": 12.9779, "lon": 77.5724, "is_industrial": 0},
    # Hyderabad (2 stations)
    {"id": "TS001", "name": "Sanathnagar TSPCB", "city": "Hyderabad", "lat": 17.4578, "lon": 78.4412, "is_industrial": 1},
    {"id": "TS002", "name": "Bolaram TSPCB", "city": "Hyderabad", "lat": 17.5161, "lon": 78.5080, "is_industrial": 1},
    # Pune (2 stations)
    {"id": "PN001", "name": "Shivajinagar MPCB", "city": "Pune", "lat": 18.5308, "lon": 73.8475, "is_industrial": 0},
    {"id": "PN002", "name": "Karve Road MPCB", "city": "Pune", "lat": 18.5074, "lon": 73.8340, "is_industrial": 0},
    # Ahmedabad (2 stations)
    {"id": "GJ001", "name": "Maninagar GPCB", "city": "Ahmedabad", "lat": 22.9978, "lon": 72.6125, "is_industrial": 1},
    {"id": "GJ002", "name": "Gyaspur GPCB", "city": "Ahmedabad", "lat": 22.9641, "lon": 72.5694, "is_industrial": 1},
    # Lucknow (2 stations)
    {"id": "UP001", "name": "Lalbagh UPPCB", "city": "Lucknow", "lat": 26.8496, "lon": 80.9388, "is_industrial": 0},
    {"id": "UP002", "name": "Talkatora UPPCB", "city": "Lucknow", "lat": 26.8285, "lon": 80.8931, "is_industrial": 1}
]

def calculate_sub_aqi_pm25(val):
    if val is None or math.isnan(val): return None
    if val <= 30: return val * (50 / 30)
    elif val <= 60: return 50 + (val - 30) * (50 / 30)
    elif val <= 90: return 100 + (val - 60) * (100 / 30)
    elif val <= 120: return 200 + (val - 90) * (100 / 30)
    elif val <= 250: return 300 + (val - 120) * (100 / 130)
    else: return 400 + (val - 250) * (100 / 100)

def calculate_sub_aqi_pm10(val):
    if val is None or math.isnan(val): return None
    if val <= 50: return val
    elif val <= 100: return 50 + (val - 50) * (50 / 50)
    elif val <= 250: return 100 + (val - 100) * (100 / 150)
    elif val <= 350: return 200 + (val - 250) * (100 / 100)
    elif val <= 430: return 300 + (val - 350) * (100 / 80)
    else: return 400 + (val - 430) * (100 / 100)

def calculate_sub_aqi_no2(val):
    if val is None or math.isnan(val): return None
    if val <= 40: return val * (50 / 40)
    elif val <= 80: return 50 + (val - 40) * (50 / 40)
    elif val <= 180: return 100 + (val - 80) * (100 / 100)
    elif val <= 280: return 200 + (val - 180) * (100 / 100)
    elif val <= 400: return 300 + (val - 280) * (100 / 120)
    else: return 400 + (val - 400) * (100 / 100)

def get_aqi_category(aqi):
    if aqi is None or math.isnan(aqi): return "Unknown"
    aqi = round(aqi)
    if aqi <= 50: return "Good"
    elif aqi <= 100: return "Satisfactory"
    elif aqi <= 200: return "Moderate"
    elif aqi <= 300: return "Poor"
    elif aqi <= 400: return "Very Poor"
    else: return "Severe"

def compute_cpcb_aqi(pm25, pm10, no2):
    sub_aqis = [
        calculate_sub_aqi_pm25(pm25),
        calculate_sub_aqi_pm10(pm10),
        calculate_sub_aqi_no2(no2)
    ]
    valid_sub_aqis = [x for x in sub_aqis if x is not None]
    if not valid_sub_aqis:
        return None, "Unknown"
    
    aqi = max(valid_sub_aqis)
    category = get_aqi_category(aqi)
    return round(aqi), category

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        is_industrial_zone INTEGER
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_id TEXT,
        timestamp TEXT,
        pm25 REAL,
        pm10 REAL,
        no2 REAL,
        so2 REAL,
        co REAL,
        o3 REAL,
        aqi INTEGER,
        aqi_category TEXT,
        FOREIGN KEY (station_id) REFERENCES stations (id)
    )
    """)
    
    for st in STATIONS:
        cursor.execute("""
        INSERT OR REPLACE INTO stations (id, name, city, latitude, longitude, is_industrial_zone)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (st["id"], st["name"], st["city"], st["lat"], st["lon"], st["is_industrial"]))
        
    conn.commit()
    conn.close()

def generate_synthetic_data():
    init_db()
    
    start_date = datetime.datetime(2024, 10, 1, 0, 0, 0)
    hours = 90 * 24 # 2160 hours
    
    records = []
    
    city_profiles = {
        "Delhi": {"base_pm25": 110, "winter_escalation": 2.2, "industrial_multiplier": 1.25},
        "Mumbai": {"base_pm25": 45, "winter_escalation": 1.4, "industrial_multiplier": 1.15},
        "Kolkata": {"base_pm25": 65, "winter_escalation": 1.7, "industrial_multiplier": 1.2},
        "Chennai": {"base_pm25": 30, "winter_escalation": 1.1, "industrial_multiplier": 1.1},
        "Bengaluru": {"base_pm25": 35, "winter_escalation": 1.15, "industrial_multiplier": 1.15},
        "Hyderabad": {"base_pm25": 48, "winter_escalation": 1.3, "industrial_multiplier": 1.2},
        "Pune": {"base_pm25": 42, "winter_escalation": 1.35, "industrial_multiplier": 1.15},
        "Ahmedabad": {"base_pm25": 70, "winter_escalation": 1.5, "industrial_multiplier": 1.25},
        "Lucknow": {"base_pm25": 90, "winter_escalation": 2.0, "industrial_multiplier": 1.2}
    }
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if we already have data
    cursor.execute("SELECT COUNT(*) FROM measurements")
    count = cursor.fetchone()[0]
    if count >= 40000:
        print(f"Database already populated with {count} records. Skipping generation.")
        conn.close()
        return
        
    print("Generating 43,200 hourly telemetry records...")
    
    for h in range(hours):
        current_time = start_date + datetime.timedelta(hours=h)
        timestamp_str = current_time.isoformat()
        
        hour = current_time.hour
        day_of_week = current_time.weekday()
        
        diurnal_factor = 1.0 + 0.35 * math.sin((hour - 4) * 2 * math.pi / 24)
        if 8 <= hour <= 10 or 18 <= hour <= 21:
            diurnal_factor += 0.25
            
        weekend_factor = 0.88 if day_of_week >= 5 else 1.0
        seasonal_factor = 1.0 + 0.8 * (h / hours)
        
        for st in STATIONS:
            if random.random() < 0.03:
                continue
                
            city = st["city"]
            prof = city_profiles[city]
            
            base = prof["base_pm25"]
            is_ind = st["is_industrial"]
            ind_mult = prof["industrial_multiplier"] if is_ind else 1.0
            
            expected_pm25 = base * diurnal_factor * weekend_factor * seasonal_factor * ind_mult
            if city in ["Delhi", "Lucknow", "Kolkata"]:
                expected_pm25 += (prof["winter_escalation"] - 1.0) * base * (h / hours) * 0.5
                
            noise = np.random.normal(0, expected_pm25 * 0.15)
            pm25 = max(5.0, expected_pm25 + noise)
            
            pm10 = pm25 * np.random.normal(1.6, 0.2)
            pm10 = max(pm25 + 5.0, pm10)
            
            no2 = np.random.normal(30, 8) * diurnal_factor * ind_mult
            no2 = max(2.0, no2)
            
            so2 = np.random.normal(12, 3) * (1.5 if is_ind else 1.0)
            so2 = max(1.0, so2)
            
            co = np.random.normal(0.8, 0.2) * diurnal_factor
            co = max(0.1, co)
            
            o3_diurnal = max(0.1, math.sin((hour - 8) * math.pi / 12)) if 6 <= hour <= 18 else 0.05
            o3 = np.random.normal(25, 6) * (1.0 + o3_diurnal)
            o3 = max(1.0, o3)
            
            aqi, category = compute_cpcb_aqi(pm25, pm10, no2)
            
            records.append((
                st["id"],
                timestamp_str,
                round(pm25, 2),
                round(pm10, 2),
                round(no2, 2),
                round(so2, 2),
                round(co, 2),
                round(o3, 2),
                aqi,
                category
            ))
            
    cursor.executemany("""
    INSERT INTO measurements (station_id, timestamp, pm25, pm10, no2, so2, co, o3, aqi, aqi_category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, records)
    
    conn.commit()
    conn.close()
    print(f"Data generation complete. Total measurements in DB: {len(records)} rows.")

def load_data_from_db():
    conn = sqlite3.connect(DB_PATH)
    query = """
    SELECT m.*, s.name, s.city, s.latitude, s.longitude, s.is_industrial_zone 
    FROM measurements m
    JOIN stations s ON m.station_id = s.id
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

if __name__ == "__main__":
    generate_synthetic_data()
