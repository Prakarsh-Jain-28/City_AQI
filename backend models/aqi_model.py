import os
import sqlite3
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
import lightgbm as lgb
import xgboost as xgb
import matplotlib.pyplot as plt
import pickle
import math

DB_PATH = os.path.join(os.path.dirname(__file__), "aqi_data.db")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
PLOTS_DIR = os.path.join(os.path.dirname(__file__), "plots")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(PLOTS_DIR, exist_ok=True)

def load_data():
    conn = sqlite3.connect(DB_PATH)
    query = """
    SELECT m.*, s.name as station_name, s.city, s.latitude, s.longitude, s.is_industrial_zone
    FROM measurements m
    JOIN stations s ON m.station_id = s.id
    ORDER BY m.station_id, m.timestamp
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    # Parse timestamp
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df

def add_weather_features(df):
    """
    Simulates weather variables based on station city, coordinates, and timestamp
    to enrich features as planned for Sprint 3.
    """
    # Group by station to ensure sorting and continuous time
    df = df.sort_values(by=["station_id", "timestamp"]).reset_index(drop=True)
    
    timestamps = df["timestamp"]
    hours = timestamps.dt.hour
    months = timestamps.dt.month
    doy = timestamps.dt.dayofyear
    
    # Temperature: diurnal cycle (warmest at 2pm, coolest at 5am) + seasonal trend
    # High base in Chennai/Mumbai, lower in Delhi/Lucknow during winter
    temp_base = []
    for city in df["city"]:
        if city in ["Chennai", "Mumbai"]:
            temp_base.append(28.0)
        elif city in ["Bengaluru", "Hyderabad", "Pune"]:
            temp_base.append(22.0)
        else: # Delhi, Lucknow, Kolkata, Ahmedabad
            temp_base.append(17.0)
            
    temp_base = np.array(temp_base)
    # Winter cooling: temperature drops from Oct (doy 274) to Dec (doy 365)
    winter_cool = -6.0 * (doy - 274) / 90.0
    # Diurnal wave
    diurnal_temp = 5.0 * np.sin((hours - 8) * 2 * np.pi / 24)
    
    df["temperature"] = temp_base + winter_cool + diurnal_temp + np.random.normal(0, 1.0, len(df))
    
    # Humidity: inversely correlated with temp, higher near coast (Mumbai, Chennai)
    coastal_mult = np.array([1.2 if c in ["Mumbai", "Chennai"] else 0.85 for c in df["city"]])
    humidity_base = 65.0 - (df["temperature"] - 20.0) * 1.5
    df["humidity"] = np.clip(humidity_base * coastal_mult + np.random.normal(0, 3.0, len(df)), 15.0, 98.0)
    
    # Wind Speed: random walk + day peak (due to heating/convection)
    df["wind_speed"] = np.clip(2.5 + 1.2 * np.sin((hours - 10) * 2 * np.pi / 24) + np.random.exponential(1.5, len(df)), 0.2, 15.0)
    
    # Wind Direction: mock degrees (0-360)
    df["wind_direction"] = (doy * 3.5 + hours * 15.0 + np.random.normal(0, 30.0, len(df))) % 360
    
    # Rainfall: mostly dry in winter except Chennai (NE monsoon peaks in Nov/Dec)
    rain = []
    for city, m, hr in zip(df["city"], months, hours):
        if city == "Chennai" and m in [10, 11, 12]:
            # higher probability of rain
            rain.append(np.random.choice([0.0, 0.0, 0.5, 2.0, 8.0], p=[0.7, 0.15, 0.08, 0.05, 0.02]))
        else:
            rain.append(np.random.choice([0.0, 0.2], p=[0.98, 0.02]))
    df["rainfall"] = rain
    
    return df

def engineer_features(df):
    df = add_weather_features(df)
    
    # Sort and group by station for lag and rolling calculations
    df = df.sort_values(by=["station_id", "timestamp"]).reset_index(drop=True)
    
    # Lags of target pollutant (PM2.5)
    pm25_lags = [1, 2, 3, 6, 12, 24, 48]
    for lag in pm25_lags:
        df[f"pm25_lag_{lag}h"] = df.groupby("station_id")["pm25"].shift(lag)
        
    # Rolling Statistics
    rolling_windows = [3, 6, 12, 24]
    for w in rolling_windows:
        # Note: we use shift(1) to avoid data leakage since rolling includes the current row
        df[f"pm25_roll_mean_{w}h"] = df.groupby("station_id")["pm25"].shift(1).rolling(window=w).mean()
        df[f"pm25_roll_std_{w}h"] = df.groupby("station_id")["pm25"].shift(1).rolling(window=w).std()
        df[f"pm25_roll_max_{w}h"] = df.groupby("station_id")["pm25"].shift(1).rolling(window=w).max()
        
    # Exponential Weighted Means
    df["pm25_ewm_6h"] = df.groupby("station_id")["pm25"].shift(1).ewm(span=6, adjust=False).mean()
    df["pm25_ewm_24h"] = df.groupby("station_id")["pm25"].shift(1).ewm(span=24, adjust=False).mean()
    
    # Difference Features
    df["pm25_diff_1h"] = df.groupby("station_id")["pm25"].shift(1).diff(1)
    df["pm25_diff_24h"] = df.groupby("station_id")["pm25"].shift(1).diff(24)
    
    # Cross-pollutant lags (t-1h)
    df["pm10_lag_1h"] = df.groupby("station_id")["pm10"].shift(1)
    df["no2_lag_1h"] = df.groupby("station_id")["no2"].shift(1)
    df["o3_lag_1h"] = df.groupby("station_id")["o3"].shift(1)
    
    # Cyclic Time Features
    hours = df["timestamp"].dt.hour
    dow = df["timestamp"].dt.dayofweek
    months = df["timestamp"].dt.month
    
    df["hour_sin"] = np.sin(2 * np.pi * hours / 24)
    df["hour_cos"] = np.cos(2 * np.pi * hours / 24)
    df["dow_sin"] = np.sin(2 * np.pi * dow / 7)
    df["dow_cos"] = np.cos(2 * np.pi * dow / 7)
    df["month_sin"] = np.sin(2 * np.pi * months / 12)
    df["month_cos"] = np.cos(2 * np.pi * months / 12)
    df["is_weekend"] = (dow >= 5).astype(int)
    df["is_morning_peak"] = ((hours >= 8) & (hours <= 10)).astype(int)
    df["is_evening_peak"] = ((hours >= 18) & (hours <= 21)).astype(int)
    
    # Cyclical Wind Direction
    df["wind_dir_sin"] = np.sin(2 * np.pi * df["wind_direction"] / 360)
    df["wind_dir_cos"] = np.cos(2 * np.pi * df["wind_direction"] / 360)
    
    # Encodings for Categoricals
    le_city = LabelEncoder()
    df["city_enc"] = le_city.fit_transform(df["city"])
    
    le_station = LabelEncoder()
    df["station_enc"] = le_station.fit_transform(df["station_id"])
    
    # Save encoders
    with open(os.path.join(MODELS_DIR, "city_encoder.pkl"), "wb") as f:
        pickle.dump(le_city, f)
    with open(os.path.join(MODELS_DIR, "station_encoder.pkl"), "wb") as f:
        pickle.dump(le_station, f)
        
    # Target Variable: 24h future PM2.5
    df["target"] = df.groupby("station_id")["pm25"].shift(-24)
    
    # Drop rows without targets (last 24 hours of each station) or with empty features
    # (first 48 hours because of lag_48h)
    df_clean = df.dropna(subset=["target"]).copy()
    
    # Handle missing features in models that require complete data
    # (First we fill feature NaNs using ffill and bfill per station)
    feature_cols = [c for c in df_clean.columns if c not in ["id", "station_id", "timestamp", "station_name", "city", "aqi_category", "target"]]
    df_clean[feature_cols] = df_clean.groupby("station_id")[feature_cols].ffill().bfill()
    
    # Any remaining NaNs globally (should be none) are filled with column median
    for col in feature_cols:
        if df_clean[col].isna().any():
            df_clean[col] = df_clean[col].fillna(df_clean[col].median())
            
    return df_clean, feature_cols

def train_and_evaluate():
    print("Loading data from database...")
    raw_df = load_data()
    
    print("Engineering features...")
    df, feature_cols = engineer_features(raw_df)
    
    # Temporal Train/Test split (80/20 by time)
    # Sort chronologically
    df = df.sort_values(by="timestamp").reset_index(drop=True)
    split_idx = int(len(df) * 0.8)
    
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    
    X_train = train_df[feature_cols]
    y_train = train_df["target"]
    X_test = test_df[feature_cols]
    y_test = test_df["target"]
    
    print(f"Features dimension: {X_train.shape[1]}")
    print(f"Train samples: {X_train.shape[0]}, Test samples: {X_test.shape[0]}")
    
    # Define models
    models = {
        "LightGBM": lgb.LGBMRegressor(
            n_estimators=500,
            learning_rate=0.04,
            num_leaves=63,
            max_depth=7,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbose=-1
        ),
        "XGBoost": xgb.XGBRegressor(
            n_estimators=500,
            learning_rate=0.04,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        ),
        "Random Forest": RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            max_features=0.8,
            random_state=42,
            n_jobs=-1
        ),
        "Ridge Regression": Ridge(alpha=10.0)
    }
    
    # Baseline: Persistence (predicts t+24 using current pm25)
    # Persistence baseline target predicted value is pm25_lag_0 (current pm25)
    y_pred_persistence = X_test["pm25"]
    
    results = {}
    
    # Evaluate Persistence Baseline
    rmse_p = math.sqrt(mean_squared_error(y_test, y_pred_persistence))
    mae_p = mean_absolute_error(y_test, y_pred_persistence)
    mape_p = np.mean(np.abs((y_test - y_pred_persistence) / y_test)) * 100
    r2_p = r2_score(y_test, y_pred_persistence)
    
    results["Persistence (baseline)"] = {"RMSE": rmse_p, "MAE": mae_p, "MAPE": mape_p, "R2": r2_p}
    
    # Train and evaluate other models
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        rmse = math.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)
        mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
        r2 = r2_score(y_test, y_pred)
        
        results[name] = {"RMSE": rmse, "MAE": mae, "MAPE": mape, "R2": r2}
        
        # Save models
        model_filename = f"{name.lower().replace(' ', '_')}_aqi.pkl"
        with open(os.path.join(MODELS_DIR, model_filename), "wb") as f:
            pickle.dump(model, f)
            
    # Save the feature columns list
    with open(os.path.join(MODELS_DIR, "feature_columns.pkl"), "wb") as f:
        pickle.dump(feature_cols, f)
        
    # Build Leaderboard DataFrame
    leaderboard = []
    for name, metrics in results.items():
        leaderboard.append({
            "Model": name,
            "RMSE": round(metrics["RMSE"], 2),
            "MAE": round(metrics["MAE"], 2),
            "MAPE": f"{round(metrics["MAPE"], 1)}%",
            "R2": round(metrics["R2"], 3)
        })
    leaderboard_df = pd.DataFrame(leaderboard).sort_values(by="RMSE")
    
    print("\n=== Model Performance Leaderboard ===")
    print(leaderboard_df.to_string(index=False))
    
    # Create evaluation plot
    plot_comparison(results)
    plot_city_profiles(df)
    
    return results

def plot_comparison(results):
    models = list(results.keys())
    rmses = [results[m]["RMSE"] for m in models]
    r2s = [results[m]["R2"] for m in models]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    # Colors
    colors = ['#1a365d', '#2b6cb0', '#4299e1', '#63b3ed', '#a0aec0']
    
    # RMSE plot
    bars1 = ax1.bar(models, rmses, color=colors[:len(models)], width=0.5)
    ax1.set_title("RMSE Comparison (Lower is Better)", fontsize=12, fontweight="bold", pad=15)
    ax1.set_ylabel("RMSE (µg/m³)")
    ax1.set_xticklabels(models, rotation=15)
    ax1.grid(axis='y', linestyle='--', alpha=0.7)
    for bar in bars1:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2, yval + 0.5, f"{round(yval, 2)}", ha='center', va='bottom', fontsize=9)
        
    # R2 plot
    bars2 = ax2.bar(models, r2s, color=colors[:len(models)], width=0.5)
    ax2.set_title("R² Score Comparison (Higher is Better)", fontsize=12, fontweight="bold", pad=15)
    ax2.set_ylabel("R² Score")
    ax2.set_xticklabels(models, rotation=15)
    ax2.grid(axis='y', linestyle='--', alpha=0.7)
    for bar in bars2:
        yval = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2, yval + 0.01, f"{round(yval, 3)}", ha='center', va='bottom', fontsize=9)
        
    plt.tight_layout()
    plt_path = os.path.join(PLOTS_DIR, "model_comparison.png")
    plt.savefig(plt_path, dpi=150)
    plt.close()
    print(f"Saved evaluation dashboard plot to {plt_path}")

def plot_city_profiles(df):
    # Group by city and compute statistics
    city_stats = df.groupby("city")["pm25"].agg(["mean", "std", "max"]).reset_index()
    city_stats = city_stats.sort_values(by="mean", ascending=False)
    
    plt.figure(figsize=(12, 6))
    bars = plt.bar(city_stats["city"], city_stats["mean"], yerr=city_stats["std"], 
                   color='#2b6cb0', edgecolor='#1a365d', alpha=0.85, capsize=5, width=0.6)
    
    plt.title("Air Quality Profiles: Average PM2.5 Concentrations across Cities (Oct - Dec 2024)", 
              fontsize=14, fontweight="bold", pad=20)
    plt.ylabel("PM2.5 (µg/m³)", fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 2, f"{round(yval, 1)}", ha='center', va='bottom', fontsize=10, fontweight="semibold")
        
    plt.tight_layout()
    plt_path = os.path.join(PLOTS_DIR, "city_profiles.png")
    plt.savefig(plt_path, dpi=150)
    plt.close()
    print(f"Saved city profiles plot to {plt_path}")

if __name__ == "__main__":
    train_and_evaluate()
