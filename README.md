<p align="center">
  <img src="https://img.shields.io/badge/Hackathon-ET%20AI%202026-blueviolet?style=for-the-badge" alt="ET AI Hackathon 2026" />
  <img src="https://img.shields.io/badge/Problem%20Statement-5-orange?style=for-the-badge" alt="PS-5" />
  <img src="https://img.shields.io/badge/Stack-MERN%20%2B%20Python%20ML-green?style=for-the-badge" alt="MERN + Python" />
</p>

# 🌫️ Urban AQI Intelligence — AI-Powered Smart City Air Quality Platform

> **ET AI Hackathon 2026 — Problem Statement 5:**
> *AI-Powered Urban Air Quality Intelligence for Smart City Intervention*

A full-stack, real-time air quality monitoring & intelligence platform that transforms raw CPCB/OpenAQ station data into **actionable city-level decisions** — with multi-horizon ML forecasting, unsupervised pollution source attribution, anomaly detection, enforcement priority scoring, and a role-based dual-portal UI (Citizen + Admin).

---

## 📑 Table of Contents

- [Why This Exists](#-why-this-exists)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [ML Models — The Intelligence Layer](#-ml-models--the-intelligence-layer)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Real-Time Features](#-real-time-features)
- [Screenshots & Demo](#-screenshots--demo)
- [Team](#-team)
- [License](#-license)

---

## 🎯 Why This Exists

India has **900+ air quality monitoring stations**, but a 2024 CAG audit found only **31% of cities** with monitoring data have any actual response protocol tied to it. The data exists; the intelligence layer to act on it doesn't.

This platform closes that gap by combining:

1. **Real data ingestion** — OpenAQ v3 API / CPCB-linked stations (no synthetic or fabricated data)
2. **Purpose-built ML models** — each answering a different real question a citizen or city official actually has
3. **Dual-portal UI** — a citizen-facing public portal and a full admin dashboard for enforcement officers
4. **Real-time communication** — Socket.IO-powered live notifications, alerts, and inter-officer chat

---

## ✨ Key Features

### 🏙️ Citizen Portal (Public)
| Feature | Description |
|---|---|
| **City AQI Dashboard** | Live aggregate AQI across monitored cities with pollutant breakdown (PM2.5, PM10, NO₂, SO₂, CO, O₃) |
| **City Detail View** | Drill-down into any city — station-level data, AQI trends (24h/7d/30d), pollutant charts |
| **ML Predictions** | Multi-horizon AQI forecasts (1h, 6h, 24h, 48h, 72h) powered by XGBoost models |
| **City Comparison** | Side-by-side AQI & health advisory comparison between any two cities |
| **Health Advisories** | Group-specific recommendations (children, senior citizens, outdoor workers, asthma patients) based on CPCB categories |
| **Public Alerts** | Real-time advisories & emergency alerts broadcast by city administrators |
| **Source Attribution** | "Likely cause" panel — ML-driven clustering of pollution sources (traffic, construction, industry, waste burning) |

### 🛡️ Admin Dashboard (Role-Based)
| Feature | Description |
|---|---|
| **Real-Time Dashboard** | City-wide KPIs, station health, critical hotspot map, trend charts |
| **Station Management** | CRUD operations for monitoring stations with pollutant-level tracking |
| **Hotspot Management** | Anomaly-detected hotspots with severity classification, source tagging, and geo-coordinates |
| **Assignment Workflow** | Assign field officers to hotspots → track status (Pending → In Progress → Verification → Completed) |
| **Alert Broadcasting** | Create & broadcast severity-tagged alerts with advisories, auto-expiry, and real-time citizen delivery |
| **Enforcement Scoring** | Transparent weighted priority formula ranking zones by severity, anomaly confidence, and forecast trend |
| **Officer Management** | Register, assign, and manage field officers across cities |
| **Reports & Analytics** | Generate daily/weekly/monthly reports with exportable data |
| **Notifications** | In-app notification center with read/unread tracking |
| **Inter-Officer Chat** | Real-time messaging between admin users via Socket.IO |
| **Monitoring & Predictions** | Admin-side view of ML predictions with confidence scores and model metrics |
| **Profile & Settings** | User profile management, dark/light theme toggle |

### 🔐 Role-Based Access Control
| Role | Capabilities |
|---|---|
| `SUPER_ADMIN` | Full system access — all CRUD, officer management, alert broadcasting |
| `CITY_ADMIN` | City-scoped admin — stations, hotspots, assignments within their city |
| `OFFICER` | Field operations — view assignments, update status, chat |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                  │
│   ┌──────────────────┐          ┌──────────────────────────┐     │
│   │  Citizen Portal  │          │    Admin Dashboard       │     │
│   │  (Public Pages)  │          │  (Protected Routes)      │     │
│   │                  │          │                          │     │
│   │  • Home          │          │  • Dashboard    • Chat   │     │
│   │  • Cities        │          │  • Stations     • Reports│     │
│   │  • City Detail   │          │  • Hotspots     • Alerts │     │
│   │  • Predictions   │          │  • Assignments  • Profile│     │
│   │  • Compare       │          │  • Officers     • Settings│    │
│   │  • Alerts        │          │  • Monitoring            │     │
│   │  • About/Contact │          │  • Notifications         │     │
│   └──────┬───────────┘          └──────────┬───────────────┘     │
│          │                                  │                     │
│          │         React 19 + Vite 8        │                     │
│          │       React Router v7            │                     │
│          │     Recharts + Lucide React      │                     │
│          │     Socket.IO Client             │                     │
└──────────┼──────────────────────────────────┼────────────────────┘
           │ HTTP (Axios)       WebSocket     │
           │                   (Socket.IO)    │
┌──────────┼──────────────────────────────────┼────────────────────┐
│          ▼                                  ▼                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Node.js / Express 5 API Server              │    │
│  │                                                          │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │    │
│  │  │ Public API  │  │ Protected API│  │  Socket.IO     │  │    │
│  │  │ /api/public │  │ /api/*       │  │  Server        │  │    │
│  │  │ (No Auth)   │  │ (JWT Auth)   │  │  (Real-time)   │  │    │
│  │  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │    │
│  │         │                │                   │           │    │
│  │         ▼                ▼                   ▼           │    │
│  │  ┌──────────────────────────────────────────────────┐    │    │
│  │  │              AiServices Layer                    │    │    │
│  │  │  predictAQI · sourceAttribution · healthRisk     │    │    │
│  │  │  detectHotspots · recommendAction                │    │    │
│  │  └───────────────────────┬──────────────────────────┘    │    │
│  │                          │                               │    │
│  │              ┌───────────┴───────────┐                   │    │
│  │              ▼                       ▼                   │    │
│  │     ┌────────────────┐    ┌──────────────────┐           │    │
│  │     │   MongoDB      │    │  Python FastAPI   │           │    │
│  │     │   (Mongoose)   │    │  ML Server        │           │    │
│  │     │                │    │  (Port 5000)      │           │    │
│  │     │  • Users       │    │                   │           │    │
│  │     │  • Stations    │    │  XGBoost Models   │           │    │
│  │     │  • Hotspots    │    │  Isolation Forest  │           │    │
│  │     │  • Alerts      │    │  KMeans Clustering │           │    │
│  │     │  • Assignments │    │  Enforcement Score  │           │    │
│  │     │  • Notifications│   │                   │           │    │
│  │     │  • Messages    │    │  Data: OpenAQ v3   │           │    │
│  │     └────────────────┘    └──────────────────┘           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                     BACKEND SERVER                                │
└──────────────────────────────────────────────────────────────────┘
```

**Key Architectural Decision:** The Node.js `AiServices` layer attempts to proxy requests to the Python FastAPI ML server. If the Python server is offline, it **falls back** to deterministic local calculations — ensuring the platform never hard-fails even without the ML service running.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | Component-based UI framework |
| **Vite 8** | Build tool & dev server |
| **React Router v7** | Client-side routing (public + protected) |
| **Recharts 3** | Data visualization — line, bar, area, pie charts |
| **Socket.IO Client** | Real-time notifications, chat, live data |
| **Axios** | HTTP client with cookie-based auth |
| **Lucide React + React Icons** | Icon libraries |
| **Swiper** | Touch-friendly carousel components |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **MongoDB + Mongoose 9** | Document database & ODM |
| **Socket.IO 4** | WebSocket server for real-time features |
| **JWT (jsonwebtoken)** | Stateless authentication via HTTP-only cookies |
| **bcrypt** | Password hashing |
| **node-cron** | Scheduled tasks |
| **Axios** | ML server proxy calls |

### ML / Data Science
| Technology | Purpose |
|---|---|
| **Python 3.10+** | ML pipeline runtime |
| **XGBoost** | Multi-horizon PM2.5 forecasting |
| **scikit-learn** | KMeans clustering, Isolation Forest, preprocessing |
| **Prophet** | Baseline time-series comparison model |
| **FastAPI + Uvicorn** | ML model serving API |
| **Pandas + NumPy** | Data manipulation & feature engineering |
| **Matplotlib** | Chart generation for reports |
| **OpenAQ v3 API** | Real air quality data source (CPCB-linked stations) |

---

## 🧠 ML Models — The Intelligence Layer

### 1. Multi-Horizon Forecaster
**File:** `backend/ml_systems/models/train_multi_horizon.py`

Predicts PM2.5 at three lead times — **1 hour, 6 hours, and 24 hours** — using XGBoost trained on lag features, rolling averages, time-of-day/week patterns, and weather data.

| Horizon | Category Accuracy | RMSE Improvement vs. Persistence |
|---|---|---|
| 1h | 81.4% | 20.1% |
| 6h | 72.8% | 26.2% |
| 24h | 69.2% | 27.4% |

> Three separate horizon-specific models (not one generic model) — because forecasting accuracy degrades sharply at longer horizons, and this gives citizens calibrated confidence.

### 2. Prophet Baseline
**File:** `backend/ml_systems/models/train_forecast_prophet.py`

Off-the-shelf Prophet comparison model. **Deliberately underperforms** the persistence baseline (RMSE ~49 vs. baseline ~18.7) — included as evidence for why a custom feature-engineered XGBoost was built instead.

### 3. Source Attribution Engine
**File:** `backend/ml_systems/models/cluster_source_attribution.py`

Unsupervised **KMeans clustering** on real pollutant-ratio signatures (PM10:PM2.5, NO₂:PM2.5, time-of-day, wind speed) to discover distinct pollution *regimes*, with literature-based interpretation labels.

> **Why unsupervised?** No ground-truth dataset exists for "this hour's pollution was caused by traffic vs. construction." Clustering finds real patterns; the interpretation is disclosed domain reasoning, not invented labels.

### 4. Anomaly Detector
**File:** `backend/ml_systems/models/detect_anomalies.py`

**Isolation Forest** trained on pollutant + weather features. Includes a stuck-sensor filter (identical value repeated 4+ hours) to distinguish hardware faults from real pollution events.

> **Validated:** Correctly flagged a genuine 3-hour spike at Wazirpur, Delhi (293→324→256 µg/m³) and a severe 873 µg/m³ event in Bengaluru.

### 5. Enforcement Priority Scoring
**File:** `backend/ml_systems/models/enforcement_scoring.py`

A transparent, auditable weighted formula (not a trained model):

```
priority_score = 0.50 × severity_score      (current real AQI category)
               + 0.30 × anomaly_confidence   (Isolation Forest flag)
               + 0.20 × forecast_trend_score  (24h XGBoost forecast: rising/falling)
```

> **Why a formula, not an ML model?** No ground truth for "which zone most needs enforcement today." A weighted formula is auditable — an inspector or judge can see exactly why a zone ranked where it did.

---

## 📁 Project Structure

```
City_AQI/
│
├── README.md                          # ← You are here
├── .gitignore
│
├── frontend/                          # React 19 + Vite 8
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                   # Entry point
│       ├── App.jsx                    # Router config (public + admin routes)
│       ├── App.css                    # Global styles
│       ├── index.css                  # Design system & utility CSS
│       │
│       ├── api/                       # HTTP client layer
│       │   ├── axios.js               # Axios instance (base URL, cookies)
│       │   ├── adminApi.js            # Admin API endpoints
│       │   ├── publicApi.js           # Public API endpoints
│       │   └── messagesApi.js         # Chat/messages API
│       │
│       ├── context/                   # React Context providers
│       │   ├── AuthContext.jsx         # JWT auth state management
│       │   ├── SocketContext.jsx       # Socket.IO connection provider
│       │   └── ThemeContext.jsx        # Dark/light theme toggle
│       │
│       ├── components/
│       │   └── layouts/
│       │       ├── PublicLayout.jsx    # Citizen portal layout (navbar + footer)
│       │       └── AdminLayout.jsx    # Admin sidebar layout
│       │
│       ├── pages/
│       │   ├── public/                # Citizen-facing pages
│       │   │   ├── HomePage.jsx       # Landing page with hero, city cards
│       │   │   ├── CitiesPage.jsx     # All cities AQI overview
│       │   │   ├── CityDetailPage.jsx # Single city deep-dive
│       │   │   ├── PredictionsPage.jsx# ML forecast visualizations
│       │   │   ├── ComparePage.jsx    # City-vs-city comparison
│       │   │   ├── PublicAlertsPage.jsx# Active alerts feed
│       │   │   ├── AboutPage.jsx      # Project info
│       │   │   └── ContactPage.jsx    # Contact form
│       │   │
│       │   └── admin/                 # Admin dashboard pages
│       │       ├── AdminLogin.jsx
│       │       ├── AdminRegister.jsx
│       │       ├── Dashboard.jsx      # Main admin dashboard
│       │       ├── StationsManagement.jsx
│       │       ├── HotspotsManagement.jsx
│       │       ├── AssignmentsManagement.jsx
│       │       ├── AlertsManagement.jsx
│       │       ├── OfficialsManagement.jsx
│       │       ├── AdminMonitoringPredictions.jsx
│       │       ├── NotificationsPage.jsx
│       │       ├── ReportsPage.jsx
│       │       ├── ChatPage.jsx       # Real-time officer chat
│       │       ├── ProfilePage.jsx
│       │       └── SettingsPage.jsx
│       │
│       ├── utils/
│       │   └── aqiHelpers.js          # AQI category/color utilities
│       │
│       └── assets/
│           └── hero.png
│
├── backend/                           # Node.js + Express 5
│   ├── index.js                       # Server entry — HTTP + Socket.IO init
│   ├── app.js                         # Express app — middleware + route mounting
│   ├── package.json
│   ├── seed.js                        # Database seeder (users, stations, hotspots)
│   ├── .env.example                   # Environment variable template
│   │
│   ├── models/                        # Mongoose schemas
│   │   ├── User.js                    # SUPER_ADMIN / CITY_ADMIN / OFFICER
│   │   ├── Station.js                 # Monitoring station + pollutant readings
│   │   ├── Hotspot.js                 # Anomaly-detected pollution hotspots
│   │   ├── Alert.js                   # Broadcast alerts with severity + advisories
│   │   ├── Assignment.js             # Officer ↔ Hotspot assignment tracking
│   │   ├── Notification.js           # In-app notification records
│   │   └── Message.js                # Chat messages
│   │
│   ├── controllers/                   # Business logic (12 controller files)
│   │   ├── apiAuth.js                 # Login, register, logout, profile
│   │   ├── apiDashboard.js            # Aggregate stats for admin dashboard
│   │   ├── apiStations.js             # Station CRUD
│   │   ├── apiHotspot.js              # Hotspot CRUD + critical filtering
│   │   ├── apiAssignment.js           # Assignment workflow management
│   │   ├── apiAlert.js                # Alert CRUD + broadcasting
│   │   ├── apiOfficers.js             # Officer management
│   │   ├── apiPredictions.js          # ML prediction proxy
│   │   ├── apiReports.js              # Report generation & export
│   │   ├── apiSources.js             # Pollution source data
│   │   ├── apiNotification.js         # Notification CRUD + read tracking
│   │   └── apiMessages.js            # Chat message handling
│   │
│   ├── routes/                        # Express route definitions (13 files)
│   │   ├── apiPublic.js               # Public endpoints (no auth) — 363 lines
│   │   ├── apiAuth.js
│   │   ├── apiDashboard.js
│   │   ├── apiStations.js
│   │   ├── apiHotspot.js
│   │   ├── apiAssignment.js
│   │   ├── apiAlert.js
│   │   ├── apiOfficers.js
│   │   ├── apiPredictions.js
│   │   ├── apiReports.js
│   │   ├── apiSources.js
│   │   ├── apiNotification.js
│   │   └── apiMessages.js
│   │
│   ├── middleware/
│   │   ├── auth.js                    # JWT cookie verification + RBAC
│   │   ├── errorHandling.js           # Global error handler
│   │   └── logger.js                  # Request/response logger
│   │
│   ├── services/
│   │   ├── auth.js                    # JWT sign/verify helpers
│   │   └── AiServices.js             # ML integration layer (325 lines)
│   │                                   # Proxies to Python FastAPI → local fallback
│   │
│   ├── sockets/                       # Socket.IO event handlers
│   │   ├── socket.js                  # Server init + room management
│   │   ├── socketEvents.js            # Event name constants
│   │   ├── socketHandler.js           # Core event handler
│   │   ├── notification.socket.js     # Live notification broadcasting
│   │   ├── hotspot.socket.js          # Hotspot update broadcasting
│   │   ├── assignment.socket.js       # Assignment status broadcasting
│   │   └── message.socket.js          # Chat message broadcasting
│   │
│   ├── utils/
│   │   └── notifier.js                # Notification creation utility
│   │
│   └── ml_systems/                    # Python ML pipeline
│       ├── README.md                  # Detailed ML documentation
│       ├── requirements.txt           # Python dependencies
│       ├── .gitignore
│       │
│       ├── data/
│       │   ├── fetch_openaq_multicity.py   # Real data fetcher (OpenAQ v3 API)
│       │   ├── clean_aqi_dataset.py        # Data cleaning & pivot
│       │   └── generate_mock_data.py       # Development test data generator
│       │
│       ├── models/
│       │   ├── train_multi_horizon.py      # 1h/6h/24h XGBoost forecasters
│       │   ├── train_forecast_prophet.py   # Prophet baseline comparison
│       │   ├── cluster_source_attribution.py # KMeans source pattern discovery
│       │   ├── detect_anomalies.py         # Isolation Forest anomaly detection
│       │   └── enforcement_scoring.py      # Weighted priority formula
│       │
│       ├── analysis/
│       │   └── generate_report_charts.py   # 7 result charts as PNGs
│       │
│       └── api/
│           └── api_server.py               # FastAPI server (model serving)
│
└── database_folder/                   # MongoDB data export
    ├── export-data.js                 # Export script
    └── final_data.json                # Exported database snapshot
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **MongoDB** (local or Atlas cloud instance)
- **Python** ≥ 3.10 (for ML models — *optional* if only running the web app)
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/Prakarsh-Jain-28/City_AQI.git
cd City_AQI
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=8000
MONGODB_URL=mongodb://127.0.0.1:27017/city_aqi
JWT_SECRET=your_jwt_secret_here
SALT_ROUNDS=8
OPENAQ_API_KEY=your_openaq_api_key_here
```

Seed the database with initial data:

```bash
node seed.js
```

Start the backend server:

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The API server runs at `http://localhost:8000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### 4. ML System Setup (Optional)

```bash
cd backend/ml_systems
pip install -r requirements.txt

# Fetch real data from OpenAQ
python data/fetch_openaq_multicity.py
python data/clean_aqi_dataset.py

# Train all models
python models/train_multi_horizon.py
python models/train_forecast_prophet.py
python models/cluster_source_attribution.py
python models/detect_anomalies.py
python models/enforcement_scoring.py

# Generate report charts
python analysis/generate_report_charts.py

# Start ML API server
uvicorn api.api_server:app --reload --port 5000
```

> **Note:** The web application works fully without the Python ML server — the `AiServices` layer falls back to deterministic local calculations automatically.

### 5. Default Login Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@cityaqi.com` | `adminpassword` |
| City Admin | `cityadmin@cityaqi.com` | `citypassword` |
| Officer | `delhiofficer@cityaqi.com` | `delhiofficer` |

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Backend server port (default: `8000`) |
| `MONGODB_URL` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT token signing |
| `SALT_ROUNDS` | ✅ | bcrypt hash rounds (default: `8`) |
| `OPENAQ_API_KEY` | ⚠️ | OpenAQ v3 API key (needed for data fetching only) |
| `PYTHON_API_URL` | ❌ | Python ML server URL (default: `http://127.0.0.1:5000`) |

---

## 📡 API Reference

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/public/cities` | All cities with aggregate AQI & pollutant averages |
| `GET` | `/api/public/cities/:city` | Detailed city data — stations, prediction, attribution, health advisory, hotspots |
| `GET` | `/api/public/cities/:city/history` | Historical AQI (24h hourly, 7d daily, 30d daily) |
| `GET` | `/api/public/stations` | All monitoring stations (filterable by `?city=`) |
| `GET` | `/api/public/predictions/:city` | Multi-horizon ML forecasts for a city |
| `GET` | `/api/public/compare?city1=X&city2=Y` | Side-by-side city comparison |
| `GET` | `/api/public/alerts/active` | Currently active public alerts |
| `GET` | `/api/public/alerts` | All alerts (active + expired) |
| `GET` | `/api/public/health-advisory` | Health recommendations for all AQI categories |

### Protected Endpoints (JWT Cookie Required)

| Resource | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/login` · `POST /api/auth/register` · `POST /api/auth/logout` · `GET /api/auth/me` · `PUT /api/auth/me` |
| **Dashboard** | `GET /api/dashboard` · `GET /api/dashboard/summary` |
| **Stations** | `GET /api/stations` · `GET /api/stations/:id` · `POST /api/stations` · `PUT /api/stations/:id` · `DELETE /api/stations/:id` |
| **Hotspots** | `GET /api/hotspot` · `GET /api/hotspot/:id` · `GET /api/hotspot/critical` · `POST /api/hotspot` · `PUT /api/hotspot/:id` · `DELETE /api/hotspot/:id` |
| **Assignments** | `GET /api/assignment` · `GET /api/assignment/:id` · `GET /api/assignment/officer/:id` · `POST /api/assignment` · `PUT /api/assignment/:id` · `DELETE /api/assignment/:id` |
| **Alerts** | `GET /api/alert` · `GET /api/alert/:id` · `POST /api/alert` · `POST /api/alert/broadcast` · `PUT /api/alert/:id` · `DELETE /api/alert/:id` |
| **Officers** | `GET /api/officers` · `GET /api/officers/:id` · `GET /api/officers/zone/:city` · `POST /api/officers` · `PUT /api/officers/:id` · `DELETE /api/officers/:id` |
| **Predictions** | `GET /api/predictions` · `GET /api/predictions/:location` |
| **Reports** | `GET /api/reports` · `GET /api/reports/:type` · `GET /api/reports/:type/download` · `GET /api/reports/daily` · `GET /api/reports/weekly` · `GET /api/reports/monthly` · `POST /api/reports/generate` |
| **Sources** | `GET /api/sources` · `GET /api/sources/:location` |
| **Notifications** | `GET /api/notification` · `POST /api/notification` · `PUT /api/notification/:id/read` · `PUT /api/notification/read-all` · `DELETE /api/notification/:id` |
| **Messages** | `GET /api/messages` · `POST /api/messages` |

---

## 🗄️ Database Schema

### User
```
name, email (unique), password (hashed), role (SUPER_ADMIN | CITY_ADMIN | OFFICER), city, phone (unique)
```

### Station
```
stationName, city, location, AQI, PM25, PM10, NO2, SO2, CO, O3, status (ACTIVE | INACTIVE | MAINTENANCE), lastUpdated
```

### Hotspot
```
name, location, latitude, longitude, aqi, severity (LOW → SEVERE), source (TRAFFIC | CONSTRUCTION | INDUSTRY | WASTE_BURNING | MIXED | UNKNOWN), recommendation, status (ACTIVE | ASSIGNED | RESOLVED)
```

### Alert
```
title, description, severity (LOW | MEDIUM | HIGH | CRITICAL), targetArea, createdBy (ref: User), expiresAt, isActive, durationHours, advisories[]
```

### Assignment
```
officer (ref: User), hotspotId (ref: Hotspot), priority (LOW → CRITICAL), status (PENDING | IN_PROGRESS | PENDING_VERIFICATION | COMPLETED), summary, assignedAt, completedAt
```

### Notification
```
In-app notification with read/unread tracking per user
```

### Message
```
Inter-officer chat messages with sender reference and timestamps
```

---

## ⚡ Real-Time Features

The platform uses **Socket.IO** for real-time bidirectional communication:

| Event | Channel | Description |
|---|---|---|
| **joinAdmin** | `admin` room | Admin users join the admin broadcast room |
| **joinCity** | `city_{name}` room | City-specific updates |
| **joinUser** | `user_{id}` room | User-specific notifications |
| Alert broadcast | `admin` | New alerts pushed to all connected admins |
| Hotspot update | `admin` | Hotspot status changes broadcast live |
| Assignment update | `admin`, `user_{id}` | Assignment status changes |
| Chat message | `admin` | Real-time inter-officer messaging |
| Notification | `user_{id}` | Push notifications to specific users |

---

## 🖼️ Screenshots & Demo

> *Screenshots of the platform will be added after final deployment.*

**Public Portal:** Home → Cities → City Detail → Predictions → Compare → Alerts

**Admin Dashboard:** Login → Dashboard → Stations → Hotspots → Assignments → Alerts → Chat → Reports

---

## 👥 Team

Built for **ET AI Hackathon 2026** — Problem Statement 5

---

## 📄 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

<p align="center">
  <b>Built with ❤️ for cleaner air and smarter cities</b>
</p>
