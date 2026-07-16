import { useState, useEffect } from "react";
import { getPublicPredictions } from "../../api/publicApi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { FiTrendingUp, FiMapPin, FiInfo, FiArrowUp, FiArrowDown, FiMinus, FiCpu, FiBarChart2 } from "react-icons/fi";

const INDIAN_CITIES = [
    "Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata",
    "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"
];

// AQI max for gauge circle: CPCB scale tops at 500
const AQI_MAX = 500;

function AqiGauge({ aqi, color }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(1, aqi / AQI_MAX);
    const dash = pct * circumference;

    return (
        <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 120 120">
                {/* Track */}
                <circle
                    cx="60" cy="60" r={radius}
                    fill="none"
                    stroke="var(--hover-bg)"
                    strokeWidth="10"
                />
                {/* Fill */}
                <circle
                    cx="60" cy="60" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference}`}
                    style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
                <span style={{ fontSize: "2.4rem", fontWeight: 900, lineHeight: 1, color }}>
                    {aqi}
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)", marginTop: 2 }}>
                    AQI
                </span>
            </div>
        </div>
    );
}

function TrendBadge({ trend }) {
    if (!trend) return null;
    const t = trend.toLowerCase();
    
    // Dynamic styling based on trend
    let icon, label, color, bg;
    if (t === "rising") {
        icon = <FiArrowUp size={12} />; label = "Rising"; color = "#ef4444"; bg = "rgba(239,68,68,0.1)";
    } else if (t === "falling") {
        icon = <FiArrowDown size={12} />; label = "Falling"; color = "#10b981"; bg = "rgba(16,185,129,0.1)";
    } else {
        icon = <FiMinus size={12} />; label = "Stable"; color = "var(--primary)"; bg = "rgba(59,130,246,0.1)";
    }

    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 20,
            fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em",
            color: color, background: bg, border: `1px solid ${color}40`
        }}>
            {icon} {label}
        </span>
    );
}

/* ── City filter button ── */
const CityBtn = ({ city, isActive, onClick }) => (
    <button onClick={onClick} style={{
        background: isActive ? "var(--primary)" : "var(--hover-bg)",
        color: isActive ? "#fff" : "var(--text-secondary)",
        border: `1px solid ${isActive ? "var(--primary)" : "var(--border-glass)"}`,
        padding: "7px 18px", borderRadius: 8,
        cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
        transition: "all 0.18s ease",
        boxShadow: isActive ? "0 0 14px rgba(59,130,246,0.35)" : "none",
        whiteSpace: "nowrap"
    }}>
        {city}
    </button>
);

export default function PredictionsPage() {
    const [selectedCity, setSelectedCity] = useState("Delhi");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getPublicPredictions(selectedCity)
            .then(res => { setData(res.data); setLoading(false); })
            .catch(() => { setData(null); setLoading(false); });
    }, [selectedCity]);

    const forecasts = data?.prediction?.forecasts
        ? Object.entries(data.prediction.forecasts)
        : [];

    return (
        <div className="page-container">
            {/* ── Header ── */}
            <div className="page-header" style={{ marginBottom: 36 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                    <div className="logo-badge">CityAQI Intelligence</div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 14px", borderRadius: 20,
                        background: "rgba(59,130,246,0.1)",
                        border: "1px solid rgba(59,130,246,0.25)",
                        fontSize: "0.78rem", fontWeight: 700,
                        color: "var(--primary)"
                    }}>
                        <FiCpu size={13} />
                        XGBoost Predictive Engine Active
                    </div>
                </div>

                <h1 style={{ fontSize: "2.2rem", marginBottom: 12 }}>Multi-Horizon AQI Predictions</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.02rem", maxWidth: 660, lineHeight: 1.75 }}>
                    Real-time AI forecasts leveraging historical CPCB telemetry and meteorological data to predict ambient air quality indices up to 72 hours in advance.
                </p>
            </div>

            {/* ── City filter bar ── */}
            <div className="glass-panel" style={{ padding: "16px 22px", marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase",
                        letterSpacing: "0.06em", color: "var(--text-muted)", flexShrink: 0
                    }}>
                        <FiMapPin size={13} />Target Area:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {INDIAN_CITIES.map(city => (
                            <CityBtn
                                key={city}
                                city={city}
                                isActive={selectedCity === city}
                                onClick={() => setSelectedCity(city)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="page-loader"><div className="loader-spinner"></div></div>
            ) : !data ? (
                <div className="glass-panel" style={{ padding: "36px 28px", textAlign: "center" }}>
                    <FiBarChart2 size={44} style={{ color: "var(--text-muted)", marginBottom: 14 }} />
                    <h3 style={{ marginBottom: 8, color: "var(--text-primary)" }}>Insufficient Telemetry</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
                        The prediction engine currently lacks sufficient historical data to generate a high-confidence forecast for {selectedCity}.
                    </p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    
                    {/* ── Current Status Panel ── */}
                    <div className="glass-panel" style={{ 
                        padding: 32, 
                        borderTop: `4px solid ${getAqiColor(data.currentAQI)}`,
                        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 32,
                        justifyContent: "space-between"
                    }}>
                        <div style={{ flex: "1 1 300px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: getAqiColor(data.currentAQI), boxShadow: `0 0 10px ${getAqiColor(data.currentAQI)}` }} />
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Live Telemetry</span>
                            </div>
                            <h2 style={{ fontSize: "2rem", margin: "0 0 16px 0", color: "var(--text-primary)" }}>
                                {selectedCity} Current State
                            </h2>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{
                                    padding: "8px 18px", borderRadius: 8,
                                    background: `${getAqiColor(data.currentAQI)}15`,
                                    border: `1px solid ${getAqiColor(data.currentAQI)}30`,
                                    color: getAqiColor(data.currentAQI),
                                    fontWeight: 800, fontSize: "1rem", letterSpacing: "0.05em"
                                }}>
                                    {getAqiCategory(data.currentAQI)}
                                </div>
                                <div style={{
                                    padding: "8px 18px", borderRadius: 8,
                                    background: "var(--hover-bg)", border: "1px solid var(--border-glass)",
                                    color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", alignItems: "center"
                                }}>
                                    Based on latest CPCB reading
                                </div>
                            </div>
                        </div>

                        {/* Central circular gauge */}
                        <div style={{ padding: "0 20px" }}>
                            <AqiGauge aqi={data.currentAQI} color={getAqiColor(data.currentAQI)} />
                        </div>

                        {/* Scale legend */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--hover-bg)", padding: "16px 20px", borderRadius: 12, border: "1px solid var(--border-glass)" }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                                CPCB Scale
                            </div>
                            {[
                                { label: "Good", range: "0–50", color: "#22c55e" },
                                { label: "Moderate", range: "51–100", color: "#84cc16" },
                                { label: "Poor", range: "101–200", color: "#f97316" },
                                { label: "V. Poor", range: "201–300", color: "#ef4444" },
                                { label: "Severe", range: "301+", color: "#7c3aed" },
                            ].map(s => (
                                <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>{s.label}</span>
                                    </div>
                                    <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-display)", color: "var(--text-muted)" }}>{s.range}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Forecast Timeline ── */}
                    {forecasts.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: "1.1rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "var(--text-secondary)" }}>
                                <FiTrendingUp /> Predicted Trajectory
                            </h3>
                            <div style={{ 
                                display: "grid", 
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                                gap: 20 
                            }}>
                                {forecasts.map(([horizon, f]) => {
                                    const aqiColor = getAqiColor(f.predictedAQI);
                                    return (
                                        <div key={horizon} className="glass-panel" style={{ 
                                            padding: "24px 20px", 
                                            display: "flex", flexDirection: "column",
                                            borderTop: `3px solid ${aqiColor}`
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                                <div style={{ 
                                                    padding: "4px 10px", borderRadius: 6, 
                                                    background: "var(--hover-bg)", border: "1px solid var(--border-glass)",
                                                    fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)"
                                                }}>
                                                    +{horizon}
                                                </div>
                                                <TrendBadge trend={f.trend} />
                                            </div>

                                            <div style={{ textAlign: "center", padding: "12px 0" }}>
                                                <div style={{ fontSize: "3rem", fontWeight: 900, lineHeight: 1, color: aqiColor, marginBottom: 8 }}>
                                                    {f.predictedAQI}
                                                </div>
                                                <div style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em", color: aqiColor, textTransform: "uppercase" }}>
                                                    {f.category}
                                                </div>
                                            </div>

                                            <div style={{ marginTop: "auto", paddingTop: 20 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
                                                    <span>Confidence</span>
                                                    <span>{f.confidence}%</span>
                                                </div>
                                                <div style={{ height: 4, background: "var(--hover-bg)", borderRadius: 4, overflow: "hidden" }}>
                                                    <div style={{ 
                                                        width: `${f.confidence}%`, height: "100%", 
                                                        background: f.confidence > 80 ? "#10b981" : f.confidence > 60 ? "#f59e0b" : "#ef4444",
                                                        borderRadius: 4
                                                    }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Info strip ── */}
                    <div style={{
                        display: "flex", alignItems: "flex-start", gap: 14,
                        padding: "16px 20px", borderRadius: 12,
                        background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
                        color: "var(--text-muted)", lineHeight: 1.6
                    }}>
                        <FiInfo size={18} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: "0.85rem" }}>
                            <strong style={{ color: "var(--text-secondary)" }}>Model Architecture: </strong>
                            Forecasts are generated using isolated XGBoost regressor models trained on multi-variate historical datasets (CPCB sensors + OpenAQ API). The system uses a multi-horizon approach with dedicated inference pipelines per timeframe (1h, 6h, 24h, 48h, 72h). Model confidence naturally decays as the prediction horizon extends.
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
