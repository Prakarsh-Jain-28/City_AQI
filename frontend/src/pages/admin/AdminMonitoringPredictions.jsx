import { useState, useEffect } from "react";
import { getStations, getPredictions } from "../../api/adminApi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { FiActivity, FiRadio, FiMapPin, FiTrendingUp, FiInfo, FiWind, FiCpu, FiAlertCircle } from "react-icons/fi";
import { useSocket } from "../../context/SocketContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const CITIES = ["Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune"];

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

export default function AdminMonitoringPredictions({ embedded = false }) {
    const { user } = useAuth();
    const availableCities = user?.role === "OFFICER" && user?.city ? [user.city] : CITIES;
    const [selectedCity, setSelectedCity] = useState(user?.role === "OFFICER" && user?.city ? user.city : "Delhi");
    const [predictionDuration, setPredictionDuration] = useState("24h");
    const [stations, setStations] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getStations({ city: selectedCity }),
            getPredictions()
        ]).then(([stationsRes, predictionsRes]) => {
            setStations(stationsRes.data.stations || []);
            const preds = predictionsRes.data.predictions || [];
            const cityPred = preds.find(p => p.city === selectedCity);
            setPrediction(cityPred || null);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [selectedCity]);

    useEffect(() => {
        if (!socket) return;
        socket.emit("joinAdmin");
        const handleStationUpdate = (updatedStation) => {
            setStations(prev => {
                if (updatedStation.city === selectedCity) {
                    const exists = prev.find(s => s._id === updatedStation._id);
                    if (exists) {
                        return prev.map(s => s._id === updatedStation._id ? updatedStation : s);
                    } else {
                        return [...prev, updatedStation];
                    }
                }
                return prev;
            });
        };
        socket.on("stationUpdate", handleStationUpdate);
        return () => {
            socket.off("stationUpdate", handleStationUpdate);
        };
    }, [socket, selectedCity]);

    const formatChartData = (pred) => {
        if (!pred || !pred.forecasts) return [];
        const times = ["Now", "1h", "6h", "24h", "48h", "72h"];
        
        let limitIndex = times.length;
        if (predictionDuration === "6h") limitIndex = 3;
        else if (predictionDuration === "24h") limitIndex = 4;
        else if (predictionDuration === "48h") limitIndex = 5;

        const allData = [
            { time: "Now", AQI: pred.currentAQI },
            { time: "1h", AQI: pred.forecasts["1h"]?.predictedAQI },
            { time: "6h", AQI: pred.forecasts["6h"]?.predictedAQI },
            { time: "24h", AQI: pred.forecasts["24h"]?.predictedAQI },
            { time: "48h", AQI: pred.forecasts["48h"]?.predictedAQI },
            { time: "72h", AQI: pred.forecasts["72h"]?.predictedAQI },
        ];

        return allData.slice(0, limitIndex);
    };

    const chartData = formatChartData(prediction);
    const avgAqi = stations.length > 0 
        ? Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length) 
        : (prediction?.currentAQI || 0);

    const getPollutantPercentage = (val, max) => Math.min(100, Math.max(0, (val / max) * 100));

    // Calculate average pollutants for the city
    const avgPM25 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.PM25, 0) / stations.length) : 0;
    const avgPM10 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.PM10, 0) / stations.length) : 0;
    const avgNO2 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.NO2, 0) / stations.length) : 0;
    const avgSO2 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.SO2, 0) / stations.length) : 0;
    const avgCO = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.CO, 0) / stations.length) : 0;
    const avgO3 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.O3, 0) / stations.length) : 0;

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const content = (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
            {/* ── LEFT SIDE: LIVE MONITORING & POLLUTANTS ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                
                <div className="glass-panel" style={{ padding: 28, borderTop: `4px solid ${getAqiColor(avgAqi)}` }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, color: "var(--text-primary)" }}>
                        <FiWind style={{ color: "var(--primary)" }} /> Real-time Pollutant Aggregation
                    </h3>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
                        <div style={{ 
                            background: "var(--hover-bg)", padding: "24px 32px", borderRadius: 16, textAlign: "center", 
                            display: "flex", flexDirection: "column", justifyContent: "center",
                            border: "1px solid var(--border-glass)", minWidth: 200
                        }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 8 }}>
                                Composite Index
                            </div>
                            <div style={{ fontSize: "5rem", fontWeight: 900, color: getAqiColor(avgAqi), lineHeight: 1, marginBottom: 12 }}>
                                {avgAqi}
                            </div>
                            <div style={{ 
                                background: `${getAqiColor(avgAqi)}15`, border: `1px solid ${getAqiColor(avgAqi)}30`,
                                padding: "6px 16px", borderRadius: 8, 
                                color: getAqiColor(avgAqi), fontWeight: 800, fontSize: "0.95rem"
                            }}>
                                {getAqiCategory(avgAqi)}
                            </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 250 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {[
                                    { label: "PM2.5", value: avgPM25, max: 250, color: "#ef4444", unit: "µg/m³" },
                                    { label: "PM10", value: avgPM10, max: 400, color: "#f97316", unit: "µg/m³" },
                                    { label: "NO₂", value: avgNO2, max: 200, color: "#8b5cf6", unit: "µg/m³" },
                                    { label: "SO₂", value: avgSO2, max: 100, color: "#3b82f6", unit: "µg/m³" },
                                    { label: "CO", value: avgCO, max: 15, color: "#10b981", unit: "mg/m³" },
                                    { label: "O₃", value: avgO3, max: 150, color: "#eab308", unit: "µg/m³" }
                                ].map((pollutant, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ width: 45, fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{pollutant.label}</div>
                                        <div style={{ flex: 1, background: "var(--hover-bg)", border: "1px solid var(--border-glass)", height: 10, borderRadius: 6, overflow: "hidden" }}>
                                            <div style={{ 
                                                width: `${getPollutantPercentage(pollutant.value, pollutant.max)}%`, 
                                                background: pollutant.color, 
                                                height: "100%", borderRadius: 6, transition: "width 0.5s ease"
                                            }} />
                                        </div>
                                        <div style={{ width: 80, textAlign: "right", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                            {pollutant.value} <span style={{ fontSize: "0.65rem", fontWeight: 400, color: "var(--text-muted)" }}>{pollutant.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)", margin: 0 }}>
                            <FiRadio style={{ color: "#60a5fa" }} /> Active Sensor Feeds
                        </h3>
                        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 800, background: "var(--hover-bg)", color: "var(--text-muted)", border: "1px solid var(--border-glass)" }}>
                            {stations.length} ACTIVE
                        </span>
                    </div>

                    {stations.length === 0 ? (
                        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", background: "var(--hover-bg)", borderRadius: 12 }}>
                            <FiAlertCircle size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                            <p style={{ margin: 0, fontSize: "0.9rem" }}>No active telemetry feeds established in {selectedCity}.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto", paddingRight: 8 }} className="custom-scrollbar">
                            {stations.map(station => (
                                <div key={station._id} style={{ 
                                    padding: "16px 20px", background: "var(--hover-bg)", borderRadius: 10,
                                    borderLeft: `4px solid ${getAqiColor(station.AQI)}`,
                                    display: "flex", justifyContent: "space-between", alignItems: "center"
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: 4 }}>{station.stationName}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                                            <FiMapPin /> {station.location}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "1.6rem", fontWeight: 900, color: getAqiColor(station.AQI), lineHeight: 1 }}>{station.AQI}</div>
                                        <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: getAqiColor(station.AQI), marginTop: 2 }}>
                                            {getAqiCategory(station.AQI)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── RIGHT SIDE: PREDICTIONS ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="glass-panel" style={{ padding: 28, flex: 1, display: "flex", flexDirection: "column" }}>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
                        <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, color: "var(--text-primary)" }}>
                            <FiTrendingUp style={{ color: "var(--secondary)" }} /> AI Trajectory Forecast
                        </h2>
                        
                        <div style={{ display: "flex", background: "var(--hover-bg)", padding: 4, borderRadius: 8, border: "1px solid var(--border-glass)" }}>
                            {["6h", "24h", "48h", "72h"].map(time => (
                                <button 
                                    key={time}
                                    onClick={() => setPredictionDuration(time)}
                                    style={{
                                        background: predictionDuration === time ? "var(--primary)" : "transparent",
                                        color: predictionDuration === time ? "#fff" : "var(--text-muted)",
                                        border: "none", padding: "6px 14px", borderRadius: 6,
                                        cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!prediction ? (
                        <div style={{ 
                            flex: 1, minHeight: 350, display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center", 
                            background: "var(--hover-bg)", borderRadius: 12, border: "1px dashed var(--border-glass)",
                            textAlign: "center", padding: 24
                        }}>
                            <FiCpu size={48} style={{ color: "var(--text-muted)", opacity: 0.3, marginBottom: 16 }} />
                            <h4 style={{ color: "var(--text-primary)", marginBottom: 8 }}>Inference Model Initialising</h4>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0, maxWidth: 300 }}>
                                The XGBoost predictive engine is currently gathering historical baseline data for {selectedCity}.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{ flex: 1, minHeight: 350, marginBottom: 32 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                                        <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} fontWeight={600} axisLine={{ stroke: "var(--border-glass)" }} tickLine={false} dy={10} />
                                        <YAxis stroke="var(--text-muted)" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", borderRadius: 10, color: "var(--text-primary)", fontSize: "0.85rem", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }} 
                                        />
                                        <Line 
                                            type="monotone" dataKey="AQI" stroke="#3b82f6" strokeWidth={3} 
                                            dot={{ r: 4, fill: "var(--bg-secondary)", stroke: "#3b82f6", strokeWidth: 2 }} 
                                            activeDot={{ r: 6, fill: "#3b82f6", stroke: "var(--bg-secondary)", strokeWidth: 2 }} 
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: "auto" }}>
                                <div style={{ 
                                    flex: 1, minWidth: 200, background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.15)",
                                    padding: "16px 20px", borderRadius: 12, display: "flex", gap: 14, alignItems: "flex-start" 
                                }}>
                                    <FiCpu size={20} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                        <strong style={{ color: "var(--text-primary)" }}>AI Inference Note:</strong> Forecasts are generated using XGBoost regressors processing multi-variate historical CPCB telemetry and meteorological data.
                                    </p>
                                </div>
                                <button 
                                    className="btn" 
                                    style={{ 
                                        background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.25)",
                                        padding: "0 24px", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, height: "auto", minHeight: 46
                                    }}
                                    onClick={() => navigate(`/admin/alerts?broadcast=${selectedCity}`)}
                                >
                                    <FiRadio size={16} /> Broadcast Emergency
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <div className="page-container" style={{ maxWidth: 1400, margin: "0 auto" }}>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <h1 style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "2.2rem" }}>
                    <FiActivity style={{ color: "var(--primary)" }} /> Monitoring & Predictions
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 650 }}>
                    Unified administrative dashboard combining live CPCB station telemetry with multi-horizon AI forecasting models.
                </p>
            </div>

            {/* ── City filter bar ── */}
            <div className="glass-panel" style={{ padding: "16px 24px", marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase",
                        letterSpacing: "0.06em", color: "var(--text-muted)", flexShrink: 0
                    }}>
                        <FiMapPin size={13} /> Target Region:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {availableCities.map(city => (
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

            {content}
        </div>
    );
}
