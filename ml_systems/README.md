# AQI Intelligence — ML System

Urban air quality forecasting, source attribution, anomaly detection, and
enforcement prioritization — built entirely on real, verified data (OpenAQ v3
API / CPCB-linked stations). No synthetic or fabricated data anywhere in this
pipeline.

Built for ET AI Hackathon 2026 — Problem Statement 5: AI-Powered Urban Air
Quality Intelligence for Smart City Intervention.

---

## Why this exists

India has 900+ air quality monitoring stations, but a 2024 CAG audit found
only 31% of cities with monitoring data have any actual response protocol
tied to it. The data exists; the intelligence layer to act on it doesn't.
This system closes that gap with four purpose-built models, each answering a
different real question a citizen or city official actually has.

---

## The models — what each one does and why it matters

### 1. Multi-Horizon Forecaster (`models/train_multi_horizon.py`)
**What it does:** Predicts PM2.5 at three different lead times — 1 hour, 6
hours, and 24 hours ahead — using XGBoost trained on lag features (last
known readings), rolling averages, time-of-day/week patterns, and weather
(wind, temperature, humidity).

**Why three separate models, not one:** Pollution forecasting accuracy
degrades sharply the further out you predict — this is physically real, not
a modeling weakness. Building three horizon-specific models instead of one
"24h forecast" gives citizens and officials calibrated confidence: trust the
1h number strongly, treat the 24h number as directional.

**Real, tested results (held-out test set, not training data):**
| Horizon | Category accuracy | RMSE improvement vs. persistence baseline |
|---|---|---|
| 1h | 81.4% | 20.1% |
| 6h | 72.8% | 26.2% |
| 24h | 69.2% | 27.4% |

**Why it matters to the product:** This is the core input for the citizen
dashboard's "next 24h" forecast and the official dashboard's early-warning
panel. Category accuracy (Good/Moderate/Poor/etc.) — not raw RMSE — is the
number that matters operationally, since that's the resolution people
actually act on.

### 2. Prophet Baseline (`models/train_forecast_prophet.py`)
**What it does:** A standard, off-the-shelf time-series forecasting tool,
trained the same way, on the same data, as a comparison point.

**Why it's in the repo despite underperforming:** It genuinely underperforms
the persistence baseline on this dataset (RMSE ~49 vs. baseline ~18.7) —
included on purpose, not hidden, because it's evidence for *why* a custom
feature-engineered XGBoost model was built instead of reaching for a
standard tool. This is a legitimate technical-decision artifact, not a
failed experiment to bury.

### 3. Source Attribution Engine (`models/cluster_source_attribution.py`)
**What it does:** Unsupervised KMeans clustering on real pollutant-ratio
signatures (PM10:PM2.5 ratio, NO2:PM2.5 ratio, time-of-day, wind speed) to
discover distinct pollution *regimes* in the data — then applies documented,
literature-based interpretation (e.g., high NO2 + rush hour → traffic;
high PM10 ratio → dust/construction) to label each cluster.

**Why unsupervised, not a trained classifier:** No dataset on Earth has
ground-truth labels for "this exact hour of pollution was caused by
traffic vs. construction" — so a supervised classifier here would need
fabricated labels, which this project deliberately avoids. Clustering finds
real, statistically distinct patterns; the interpretation on top is
disclosed domain reasoning, not invented data.

**Why it matters to the product:** This is what makes the official
dashboard's "likely cause" panel possible — it's the single most
differentiating feature versus a generic AQI dashboard, directly answering
the PDF's "Geospatial Pollution Source Attribution" ask.

### 4. Anomaly Detector (`models/detect_anomalies.py`)
**What it does:** Isolation Forest trained on real pollutant + weather
features, flagging readings that are statistically unusual for their
station/time context — no labels needed. Includes a stuck-sensor filter that
removes hardware-fault readings (identical value repeated 4+ hours) before
scoring, so hardware faults aren't mistaken for pollution events.

**Validated against real events:** Correctly flagged a genuine escalating
3-hour pollution spike at Wazirpur, Delhi (293→324→256 µg/m³) and a severe
873 µg/m³ event in Bengaluru — both real, verifiable in the source data.

**Why it matters to the product:** This is the most directly deployable
model in the stack — it's the trigger signal that feeds the enforcement
priority queue below.

### 5. Enforcement Priority Scoring (`models/enforcement_scoring.py`)
**What it does:** A transparent, documented weighted formula — not a
trained model — ranking every station by:
```
priority_score = 0.50 x severity_score      (current real AQI category)
                + 0.30 x anomaly_confidence   (Isolation Forest flag)
                + 0.20 x forecast_trend_score (24h XGBoost forecast: rising/falling)
```
**Why a formula, not an ML model:** There's no ground truth for "which zone
most needs enforcement today" to train a classifier against. A weighted
formula is auditable — an inspector, official, or judge can see exactly why
a zone ranked where it did, which a black-box model couldn't defend.

**Why it matters to the product:** This is the admin dashboard's enforcement
queue — it directly answers the PDF's "Enforcement Intelligence &
Prioritisation Agent" ask, and it's what turns raw monitoring into
actionable, ranked, explainable output.

---

## Backend integration — how these models actually get served

```
clean_aqi_dataset.csv  (grows as data/fetch_openaq_multicity.py is re-run)
        |
        v
models/train_multi_horizon.py  ->  outputs/models/*.json  (3 trained XGBoost models)
        |
        v
api/api_server.py  (FastAPI - loads models ONCE at startup, re-reads the CSV
                     on every single request)
        |
        +-- GET /latest          -> most recent REAL reading per city
        |                            (auto-skips offline/null stations,
        |                            picks the latest station that's
        |                            actually reporting)
        |
        +-- GET /history/{city}  -> recent time-series, station selected by
        |                            RECENT completeness, not lifetime total
        |                            (avoids picking a station that went
        |                            offline months ago)
        |
        +-- GET /forecast/{city} -> runs all 3 XGBoost models live on the
        |                            most recent complete feature row
        |
        +-- GET /metrics         -> serves the real accuracy numbers from
                                     models/metrics.json
```

**Key architectural decision — live data, deliberate model updates:** The
API re-reads `clean_aqi_dataset.csv` fresh on every request, so new data
from the pipeline appears on the next poll automatically, with zero server
restart. The trained *models* only update when `train_multi_horizon.py` is
explicitly re-run — this separation (live data / deliberate retraining) is
intentional and mirrors how production ML systems are actually architected.

**Clustering, anomaly detection, and enforcement scoring are currently
batch/offline** (run on demand, output CSVs) rather than live API endpoints
— this is a scoping choice for hackathon timelines, not a technical
limitation. Wiring `cluster_source_attribution.py`, `detect_anomalies.py`,
and `enforcement_scoring.py` into live API endpoints (mirroring the
`/forecast` pattern) is the natural next step if backend time allows.

---

## Repository structure

```
aqi-ml/
├── README.md
├── requirements.txt
├── .gitignore
│
├── data/
│   ├── fetch_openaq_multicity.py     # pulls real historical data, OpenAQ v3 API
│   └── clean_aqi_dataset.py          # pivots, filters, cleans raw pulled data
│
├── models/
│   ├── train_multi_horizon.py        # 1h/6h/24h XGBoost forecasters
│   ├── train_forecast_prophet.py     # Prophet baseline comparison
│   ├── cluster_source_attribution.py # unsupervised source-pattern discovery
│   ├── detect_anomalies.py           # Isolation Forest anomaly detection
│   └── enforcement_scoring.py        # transparent weighted priority formula
│
├── analysis/
│   └── generate_report_charts.py     # produces all 7 result charts as PNGs
│
├── api/
│   └── api_server.py                 # FastAPI backend (no frontend files here)
│
└── outputs/                          # generated - see .gitignore
    ├── models/*.json
    ├── charts/*.png     
    └── results/
           ├── anomaly_flagged_data.csv
           ├── clustered_data.csv
           └── enforcement_priority_queue.csv
```



## Run order

```bash
pip install -r requirements.txt

python data/fetch_openaq_multicity.py
python data/clean_aqi_dataset.py

python models/train_multi_horizon.py
python models/train_forecast_prophet.py
python models/cluster_source_attribution.py
python models/detect_anomalies.py
python models/enforcement_scoring.py

python analysis/generate_report_charts.py

uvicorn api.api_server:app --reload --port 8000
```
