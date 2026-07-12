import os
import sys
import time
import subprocess
import requests
import sqlite3

# Ensure backend directory is in path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BACKEND_DIR)

def verify_files():
    print("1. Verifying Project Files...")
    required_files = [
        "aqi_data.db",
        "openaq_collector.py",
        "aqi_model.py",
        "shap_attribution.py",
        "advisory_generator.py",
        "main.py",
        "models/lightgbm_aqi.pkl",
        "models/xgboost_aqi.pkl",
        "models/city_encoder.pkl",
        "models/station_encoder.pkl"
    ]
    for f in required_files:
        path = os.path.join(BACKEND_DIR, f)
        if os.path.exists(path):
            print(f"  [OK] File exists: {f}")
        else:
            print(f"  [FAIL] Missing file: {f}")
            return False
    return True

def verify_database():
    print("\n2. Verifying SQLite Database...")
    db_path = os.path.join(BACKEND_DIR, "aqi_data.db")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM stations")
        station_count = cursor.fetchone()[0]
        print(f"  [OK] Found {station_count} stations in database.")
        
        cursor.execute("SELECT COUNT(*) FROM measurements")
        measurement_count = cursor.fetchone()[0]
        print(f"  [OK] Found {measurement_count} hourly measurements in database.")
        
        if station_count > 0 and measurement_count > 40000:
            print("  [OK] Database validation successful!")
            conn.close()
            return True
        else:
            print("  [FAIL] Insufficient records in database.")
            conn.close()
            return False
    except Exception as e:
        print(f"  [FAIL] Database connection failed: {e}")
        return False

def verify_api_endpoints():
    print("\n3. Spinning up FastAPI server for endpoint checks...")
    # Spin up uvicorn server in a separate process
    server_process = subprocess.Popen(
        f'"{sys.executable}" -m uvicorn main:app --host 127.0.0.1 --port 8000',
        shell=True,
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for server to start
    time.sleep(12.0)
    
    test_urls = [
        "http://127.0.0.1:8000/api/stations",
        "http://127.0.0.1:8000/api/metrics",
        "http://127.0.0.1:8000/api/stations/DL001/dashboard?lang=en",
        "http://127.0.0.1:8000/api/stations/DL001/dashboard?lang=hi",
        "http://127.0.0.1:8000/api/advisory?aqi=220&traffic=40&industry=20&seasonal=10&weather=30&lang=en"
    ]
    
    success = True
    try:
        for url in test_urls:
            print(f"  Testing GET: {url}")
            res = requests.get(url)
            if res.status_code == 200:
                print(f"    [OK] Response 200 OK")
                data = res.json()
                if "dashboard" in url:
                    print(f"    [OK] Dashboard response station name: {data.get('station_name')}")
                    # Safely encode to ASCII for terminal printing to avoid Windows charmap encoding crashes
                    adv_text = data.get('advisory', {}).get('general_advisory', '')[:60]
                    adv_ascii = adv_text.encode('ascii', 'ignore').decode('ascii')
                    print(f"    [OK] Dashboard primary advisory: {adv_ascii}...")
            else:
                print(f"    [FAIL] Failed with status code: {res.status_code}")
                success = False
    except Exception as e:
        print(f"  [FAIL] Server connection error: {e}")
        success = False
        # If server process failed, print logs
        if server_process.poll() is not None:
            stdout, stderr = server_process.communicate()
            print("  Server process terminated unexpectedly.")
            print(f"  --- Server Stdout ---\n{stdout}")
            print(f"  --- Server Stderr ---\n{stderr}")
    finally:
        print("  Shutting down FastAPI verification server...")
        server_process.terminate()
        try:
            server_process.wait(timeout=2.0)
        except subprocess.TimeoutExpired:
            server_process.kill()
        print("  Server stopped.")
        
    return success

if __name__ == "__main__":
    print("========================================")
    print("AQI Platform Verification Test Suite")
    print("========================================\n")
    
    files_ok = verify_files()
    db_ok = verify_database() if files_ok else False
    api_ok = verify_api_endpoints() if db_ok else False
    
    print("\n========================================")
    if files_ok and db_ok and api_ok:
        print("PLATFORM VERIFICATION SUCCESSFUL! Ready for deployment.")
        print("========================================")
        sys.exit(0)
    else:
        print("PLATFORM VERIFICATION FAILED. Check errors above.")
        print("========================================")
        sys.exit(1)
