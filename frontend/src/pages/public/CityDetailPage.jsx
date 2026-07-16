import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPublicCityDetail, getPublicCityHistory } from "../../api/publicApi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { FiWind, FiActivity, FiAlertTriangle, FiHeart, FiTrendingUp, FiMapPin, FiShield, FiUser, FiBriefcase } from "react-icons/fi";

export default function CityDetailPage() {
    const { cityName } = useParams();
    const [data, setData] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("hourly");

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getPublicCityDetail(cityName).catch(() => null),
            getPublicCityHistory(cityName).catch(() => null),
        ]).then(([detail, hist]) => {
            if (detail?.data?.city) setData(detail.data.city);
            if (hist?.data?.history) setHistory(hist.data.history);
            setLoading(false);
        });
    }, [cityName]);

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;
    if (!data) return <div className="empty-state glass-panel"><p>No data found for {cityName}</p></div>;

    const pollutants = [
        { label: "PM2.5", value: data.pollutants.PM25, unit: "µg/m³", max: 250, color: "var(--primary)" },
        { label: "PM10", value: data.pollutants.PM10, unit: "µg/m³", max: 430, color: "var(--primary)" },
        { label: <span>NO<sub>2</sub></span>, value: data.pollutants.NO2, unit: "µg/m³", max: 280, color: "var(--primary)" },
        { label: <span>SO<sub>2</sub></span>, value: data.pollutants.SO2, unit: "µg/m³", max: 380, color: "var(--primary)" },
        { label: "CO", value: data.pollutants.CO, unit: "mg/m³", max: 200, color: "var(--primary)" },
        { label: <span>O<sub>3</sub></span>, value: data.pollutants.O3, unit: "µg/m³", max: 300, color: "var(--primary)" },
    ];

    const forecasts = data.prediction?.forecasts ? Object.entries(data.prediction.forecasts) : [];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><FiMapPin /> {cityName} — Air Quality Details</h1>
            </div>

            {/* AQI Overview */}
            <div className="detail-grid">
                <div className="glass-panel detail-aqi-card">
                    <div className="detail-aqi-value" style={{ color: getAqiColor(data.avgAQI) }}>{data.avgAQI}</div>
                    <div className="detail-aqi-category" style={{ background: `${getAqiColor(data.avgAQI)}18`, color: getAqiColor(data.avgAQI) }}>
                        {getAqiCategory(data.avgAQI)}
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 8 }}>Current Air Quality Index</p>
                </div>

                <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ marginBottom: 16 }}><FiWind style={{ marginRight: 8 }} />Pollutant Levels</h3>
                    <div className="pollutant-bars">
                        {pollutants.map((p, i) => (
                            <div key={i} className="pollutant-row">
                                <span style={{ fontWeight: 600 }}>{p.label}</span>
                                <div className="pollutant-bar-track">
                                    <div className="pollutant-bar-fill" style={{ width: `${Math.min(100, (p.value / p.max) * 100)}%`, background: p.color }}></div>
                                </div>
                                <span style={{ color: "var(--text-secondary)", textAlign: "right" }}>{p.value} {p.unit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Forecast */}
            {forecasts.length > 0 && (
                <section className="glass-panel section-pad">
                    <h3><FiTrendingUp style={{ marginRight: 8 }} />AQI Forecast</h3>
                    <div className="forecast-cards">
                        {forecasts.map(([horizon, f]) => (
                            <div key={horizon} className="forecast-card glass-card">
                                <div className="forecast-horizon">{horizon}</div>
                                <div className="forecast-aqi" style={{ color: getAqiColor(f.predictedAQI) }}>{f.predictedAQI}</div>
                                <div className="forecast-category" style={{ color: getAqiColor(f.predictedAQI) }}>{f.category}</div>
                                <div className="forecast-confidence">
                                    <div className="confidence-bar"><div style={{ width: `${f.confidence}%`, background: "#3b82f6" }}></div></div>
                                    <span>{f.confidence}% confidence</span>
                                </div>
                                <span className={`forecast-trend ${f.trend}`}>{f.trend === "rising" ? "↑" : f.trend === "falling" ? "↓" : "→"} {f.trend}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* History Chart */}
            {history && (
                <section className="glass-panel section-pad">
                    <div className="section-header">
                        <h3><FiActivity style={{ marginRight: 8 }} />AQI History</h3>
                        <div className="tab-group">
                            {["hourly", "weekly", "monthly"].map(t => (
                                <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: 300, marginTop: 16 }}>
                        <ResponsiveContainer>
                            <AreaChart data={activeTab === "hourly" ? history.hourly : activeTab === "weekly" ? history.weekly : history.monthly}>
                                <defs><linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey={activeTab === "hourly" ? "timestamp" : "date"} stroke="#6b7280" fontSize={11} tickFormatter={v => activeTab === "hourly" ? new Date(v).getHours() + ":00" : v.slice(5)} />
                                <YAxis stroke="#6b7280" fontSize={11} />
                                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                                <Area type="monotone" dataKey={activeTab === "hourly" ? "AQI" : "avgAQI"} stroke="#3b82f6" fill="url(#aqiGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {/* Health Advisory */}
            {data.healthAdvisory && (
                <section className="glass-panel section-pad">
                    <h3><FiHeart style={{ marginRight: 8 }} />Health Advisories for {cityName}</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 20, marginTop: 4 }}>
                        Personalized recommendations based on current AQI of <strong style={{ color: "var(--text-primary)" }}>{data.avgAQI}</strong> ({getAqiCategory(data.avgAQI)})
                    </p>
                    <div className="health-advisory-grid">
                        {[
                            { key: "children",       label: "Children",        icon: "👶" },
                            { key: "seniorCitizens", label: "Senior Citizens",  icon: "👴" },
                            { key: "outdoorWorkers", label: "Outdoor Workers",  icon: "👷" },
                            { key: "asthmaPatients", label: "Asthma Patients",  icon: "🫁" },
                        ].map(({ key, label, icon }) => (
                            data.healthAdvisory[key] && (
                                <div key={key} className="advisory-card glass-card">
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                        <span style={{ fontSize: "1.4rem" }}>{icon}</span>
                                        <h4 style={{ margin: 0 }}>{label}</h4>
                                    </div>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>{data.healthAdvisory[key]}</p>
                                </div>
                            )
                        ))}
                        {/* General Public spans full width */}
                        {data.healthAdvisory.generalPublic && (
                            <div className="advisory-card advisory-card-full glass-card">
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: "2.2rem" }}>🌍</span>
                                    <h4 style={{ margin: 0, whiteSpace: 'nowrap' }}>General Public</h4>
                                </div>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0, lineHeight: 1.7 }}>{data.healthAdvisory.generalPublic}</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Hotspots */}
            {data.hotspots && data.hotspots.length > 0 && (
                <section className="glass-panel section-pad">
                    <h3><FiAlertTriangle style={{ marginRight: 8 }} />Active Hotspots</h3>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Location</th><th>AQI</th><th>Severity</th><th>Source</th><th>Status</th></tr></thead>
                            <tbody>
                                {data.hotspots.map((h, i) => (
                                    <tr key={i}>
                                        <td>{h.name}</td>
                                        <td>{h.location}</td>
                                        <td style={{ color: getAqiColor(h.aqi), fontWeight: 700 }}>{h.aqi}</td>
                                        <td><span className="badge" style={{ background: `${getAqiColor(h.aqi)}18`, color: getAqiColor(h.aqi) }}>{h.severity}</span></td>
                                        <td>{h.source}</td>
                                        <td><span className="badge">{h.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
