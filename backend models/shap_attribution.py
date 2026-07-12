import os
import pickle
import numpy as np
import pandas as pd
import shap

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

class SHAPAttributionEngine:
    def __init__(self):
        self.model_path = os.path.join(MODELS_DIR, "lightgbm_aqi.pkl")
        self.features_path = os.path.join(MODELS_DIR, "feature_columns.pkl")
        
        if not os.path.exists(self.model_path) or not os.path.exists(self.features_path):
            raise FileNotFoundError("Model files or feature column list not found. Run model training first.")
            
        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)
            
        with open(self.features_path, "rb") as f:
            self.feature_cols = pickle.load(f)
            
        # Initialize SHAP TreeExplainer
        self.explainer = shap.TreeExplainer(self.model)
        
        # Define feature category mapping
        self.traffic_cols = ["is_morning_peak", "is_evening_peak", "hour_sin", "hour_cos", "no2_lag_1h"]
        self.industry_cols = ["is_industrial_zone", "station_enc", "city_enc"]
        self.seasonal_cols = ["month_sin", "month_cos", "dow_sin", "dow_cos", "is_weekend"]
        self.weather_cols = ["temperature", "humidity", "wind_speed", "wind_dir_sin", "wind_dir_cos", "rainfall"]
        
    def get_attribution(self, input_df: pd.DataFrame):
        """
        Calculates source attribution percentages for the given samples.
        Returns a list of dictionaries with attribution values.
        """
        # Ensure all columns exist and are in the correct order
        X = input_df[self.feature_cols]
        
        # Calculate SHAP values
        shap_values = self.explainer.shap_values(X)
        
        # Handle shape differences (some shap versions return list for multiclass, or single array for regression)
        if isinstance(shap_values, list):
            shap_values = shap_values[0]
            
        results = []
        for i in range(len(X)):
            sample_shap = shap_values[i]
            
            traffic_val = 0.0
            industry_val = 0.0
            seasonal_val = 0.0
            weather_val = 0.0
            background_val = 0.0
            
            for col_idx, col_name in enumerate(self.feature_cols):
                val = abs(sample_shap[col_idx])
                if col_name in self.traffic_cols:
                    traffic_val += val
                elif col_name in self.industry_cols:
                    industry_val += val
                elif col_name in self.seasonal_cols:
                    seasonal_val += val
                elif col_name in self.weather_cols:
                    weather_val += val
                else:
                    background_val += val
                    
            total_val = traffic_val + industry_val + seasonal_val + weather_val + background_val
            
            if total_val == 0:
                # Fallback to even distribution
                traffic_pct = 20.0
                industry_pct = 20.0
                seasonal_pct = 20.0
                weather_pct = 20.0
                background_pct = 20.0
            else:
                traffic_pct = float(round((traffic_val / total_val) * 100, 1))
                industry_pct = float(round((industry_val / total_val) * 100, 1))
                seasonal_pct = float(round((seasonal_val / total_val) * 100, 1))
                weather_pct = float(round((weather_val / total_val) * 100, 1))
                background_pct = float(round((background_val / total_val) * 100, 1))
                
            # Normalise slight rounding discrepancies to sum to exactly 100
            diff = 100.0 - (traffic_pct + industry_pct + seasonal_pct + weather_pct + background_pct)
            background_pct = float(round(background_pct + diff, 1))
            
            # Predict future value
            pred_val = float(self.model.predict(X.iloc[[i]])[0])
            
            results.append({
                "predicted_pm25": round(pred_val, 2),
                "attribution": {
                    "traffic": traffic_pct,
                    "industry": industry_pct,
                    "seasonal": seasonal_pct,
                    "weather": weather_pct,
                    "background": background_pct
                },
                "confidence_score": float(round(max(30.0, min(98.0, 100.0 - (background_pct * 0.4))), 1))
            })
            
        return results

if __name__ == "__main__":
    # Test the SHAP engine with a single row of the dataset
    import sqlite3
    from aqi_model import load_data, engineer_features
    
    print("Testing SHAP Attribution Engine...")
    df = load_data()
    df, feature_cols = engineer_features(df)
    
    engine = SHAPAttributionEngine()
    test_sample = df.iloc[[10]]
    res = engine.get_attribution(test_sample)
    print("Sample test results:")
    print(res)
