import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPublicCities, getPublicActiveAlerts } from "../../api/publicApi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { FiAlertTriangle, FiArrowRight, FiActivity, FiShield, FiHeart, FiMapPin, FiTrendingUp, FiWind, FiAlertCircle, FiUsers, FiClock } from "react-icons/fi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const aqiCategories = [
    { range: "0–50", label: "Good", color: "#10b981", desc: "Minimal health impact" },
    { range: "51–100", label: "Satisfactory", color: "#84cc16", desc: "Minor breathing discomfort to sensitive people" },
    { range: "101–200", label: "Moderate", color: "#f59e0b", desc: "Breathing discomfort to people with lung/heart disease" },
    { range: "201–300", label: "Poor", color: "#f97316", desc: "Breathing discomfort on prolonged exposure" },
    { range: "301–400", label: "Very Poor", color: "#ef4444", desc: "Respiratory illness on prolonged exposure" },
    { range: "401–500", label: "Severe", color: "#a855f7", desc: "Affects healthy people, serious impact on sensitive" },
];

/* ── Pollutant Pill ── */
const PollutantPill = ({ label, value, unit = "µg/m³" }) => (
    <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 10px", borderRadius: 6,
        background: "var(--hover-bg)", border: "1px solid var(--border-glass)",
        fontSize: "0.8rem"
    }}>
        <span style={{ color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {value ?? "—"} <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 400 }}>{unit}</span>
        </span>
    </div>
);

export default function HomePage() {
    const [cities, setCities] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOption, setSortOption] = useState("highest");

    useEffect(() => {
        Promise.all([
            getPublicCities().catch(() => ({ data: { cities: [] } })),
            getPublicActiveAlerts().catch(() => ({ data: { alerts: [] } })),
        ]).then(([citiesRes, alertsRes]) => {
            setCities(citiesRes.data.cities || []);
            setAlerts(alertsRes.data.alerts || []);
            setLoading(false);
        });
    }, []);

    const sortedCities = [...cities].sort((a, b) => {
        if (sortOption === "highest") return b.avgAQI - a.avgAQI;
        if (sortOption === "lowest") return a.avgAQI - b.avgAQI;
        return a.city.localeCompare(b.city);
    });

    return (
        <div className="home-page">
            
            {/* ── HERO SECTION ── */}
            <section className="hero-section">
                <div className="hero-bg-effects">
                    <div className="hero-orb orb-1"></div>
                    <div className="hero-orb orb-2"></div>
                    <div className="hero-orb orb-3"></div>
                </div>
                <div className="hero-content">

                    <h1 className="hero-title">
                        Urban Air Quality<br />
                        <span className="gradient-text">Intelligence Platform</span>
                    </h1>
                    <p className="hero-subtitle">
                        Real-time AQI monitoring, AI-based pollution source attribution, hyperlocal forecasting,
                        and statutory health advisories for Indian cities. Empowering citizens and officials with actionable data.
                    </p>
                    <div className="hero-actions">
                        <Link to="/aqi" className="btn btn-primary" style={{ height: 46 }}>
                            <FiActivity size={18} /> Live Directory <FiArrowRight size={16} />
                        </Link>
                        <Link to="/predictions" className="btn btn-secondary" style={{ height: 46 }}>
                            <FiTrendingUp size={18} /> AI Forecasts
                        </Link>
                    </div>
                    
                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-value">{cities.length || "10+"}</span>
                            <span className="stat-label">Monitored Regions</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{cities.reduce((s, c) => s + c.stationCount, 0) || "50+"}</span>
                            <span className="stat-label">CPCB Stations</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">24/7</span>
                            <span className="stat-label">Live Telemetry</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">72h</span>
                            <span className="stat-label">Forecast Horizon</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── LIVE ALERTS ── */}
            {alerts.length > 0 && (
                <section className="section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-glass)" }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 10px #ef4444" }} />
                        <h2 style={{ margin: 0 }}>Emergency Broadcasts</h2>
                    </div>
                    
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        spaceBetween={24}
                        slidesPerView={1}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                        }}
                        autoplay={{ delay: 4000, disableOnInteraction: false }}
                        pagination={{ clickable: true }}
                        style={{ paddingBottom: '48px' }}
                    >
                        {alerts.map((alert, i) => {
                            const sevColor = alert.severity === "CRITICAL" ? "#ef4444" : alert.severity === "HIGH" ? "#f97316" : "#f59e0b";
                            return (
                                <SwiperSlide key={i}>
                                    <Link to={`/alerts?city=${alert.targetArea}`} className="glass-panel" style={{ 
                                        display: 'flex', flexDirection: 'column', padding: 24, textDecoration: 'none', 
                                        borderLeft: `5px solid ${sevColor}`, height: '100%', position: "relative", overflow: "hidden"
                                    }}>
                                        <div style={{
                                            position: "absolute", top: 0, right: 0,
                                            padding: "4px 12px", background: `${sevColor}20`, color: sevColor,
                                            borderBottomLeftRadius: 10, fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.06em"
                                        }}>
                                            {alert.severity}
                                        </div>
                                        <h4 style={{ fontSize: "1.1rem", marginBottom: 12, color: "var(--text-primary)", paddingRight: 60 }}>{alert.title}</h4>
                                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 16 }}>
                                            {alert.description?.substring(0, 100)}...
                                        </p>
                                        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                                            <FiMapPin style={{ color: "var(--primary)" }} /> {alert.targetArea}
                                        </div>
                                    </Link>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </section>
            )}

            {/* ── CITY OVERVIEW GRID ── */}
            <section className="section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                    <div>
                        <h2 style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 8px 0" }}>
                            <FiActivity style={{ color: "var(--primary)" }} /> Regional Overview
                        </h2>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>Live AQI indices aggregated from CPCB telemetry.</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <select 
                            className="contact-input" 
                            style={{ padding: '8px 36px 8px 16px', borderRadius: 8, height: 40, width: "auto" }}
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="highest">Most Polluted</option>
                            <option value="lowest">Cleanest First</option>
                            <option value="az">A-Z Alphabetical</option>
                        </select>
                        <Link to="/aqi" className="btn btn-outline" style={{ height: 40 }}>
                            View All <FiArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="page-loader"><div className="loader-spinner"></div></div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                        {sortedCities.slice(0, 8).map((city) => {
                            const aqiColor = getAqiColor(city.avgAQI);
                            return (
                                <Link to={`/city/${city.city}`} key={city.city} className="glass-panel" style={{ 
                                    display: 'block', padding: 20, textDecoration: 'none',
                                    borderTop: `4px solid ${aqiColor}`, position: "relative", overflow: "hidden"
                                }}>
                                    <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${aqiColor}15`, filter: "blur(20px)", pointerEvents: "none" }} />
                                    
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                        <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-primary)" }}>{city.city}</h3>
                                        <div style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 800, background: `${aqiColor}15`, color: aqiColor, border: `1px solid ${aqiColor}30` }}>
                                            {getAqiCategory(city.avgAQI)}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 16 }}>
                                        <div style={{ fontSize: "2.8rem", fontWeight: 900, lineHeight: 0.8, color: aqiColor }}>{city.avgAQI}</div>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", paddingBottom: 3 }}>AQI</div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                                        <PollutantPill label="PM2.5" value={city.avgPM25} />
                                        <PollutantPill label="PM10" value={city.avgPM10} />
                                    </div>

                                    <div style={{ paddingTop: 12, borderTop: "1px solid var(--border-glass)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                        {city.stationCount} active station{city.stationCount !== 1 ? 's' : ''}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── CPCB SCALE CATEGORIES ── */}
            <section className="section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-glass)" }}>
                    <FiShield style={{ color: "var(--primary)", width: 22, height: 22 }} />
                    <h2 style={{ margin: 0 }}>CPCB Compliance Scale</h2>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    {aqiCategories.map((cat) => (
                        <div key={cat.label} className="glass-panel" style={{ padding: 20, borderTop: `3px solid ${cat.color}` }}>
                            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: cat.color, marginBottom: 4 }}>{cat.range}</div>
                            <h4 style={{ marginBottom: 8, fontSize: "1rem" }}>{cat.label}</h4>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: 0, lineHeight: 1.5 }}>{cat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── TARGETED HEALTH ADVISORIES ── */}
            <section className="section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <FiHeart style={{ color: "#ec4899", width: 22, height: 22 }} />
                    <h2 style={{ margin: 0 }}>Targeted Health Advisories</h2>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 24 }}>
                    Standardised mitigation protocols based on Indian demographic vulnerability data.
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
                    {[
                        { group: "Children", icon: <FiUsers size={20} />, tip: "Reduce outdoor play when AQI exceeds 200. Keep classrooms well-ventilated." },
                        { group: "Senior Citizens", icon: <FiClock size={20} />, tip: "Avoid morning walks during high pollution. Use air purifiers indoors." },
                        { group: "Outdoor Workers", icon: <FiAlertCircle size={20} />, tip: "Wear N95 masks when AQI > 150. Take regular indoor breaks." },
                        { group: "Asthma Patients", icon: <FiActivity size={20} />, tip: "Keep rescue inhalers accessible. Consult doctors during high AQI days." },
                    ].map((item) => (
                        <div key={item.group} className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ color: "var(--primary)", padding: 8, background: "rgba(59,130,246,0.1)", borderRadius: 8, display: "flex" }}>
                                    {item.icon}
                                </div>
                                <h4 style={{ margin: 0 }}>{item.group}</h4>
                            </div>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>{item.tip}</p>
                        </div>
                    ))}
                    
                    {/* General Public Full Width Card */}
                    <div className="glass-panel" style={{ gridColumn: "1 / -1", padding: 24, display: "flex", alignItems: "center", gap: 24, background: "rgba(59,130,246,0.04)" }}>
                        <div style={{ color: "#10b981", padding: 12, background: "rgba(16,185,129,0.1)", borderRadius: 12, display: "flex", flexShrink: 0 }}>
                            <FiShield size={24} />
                        </div>
                        <div>
                            <h4 style={{ marginBottom: 6 }}>General Public</h4>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>
                                Stay informed by checking AQI trajectories daily. Reduce strenuous outdoor activity during "Very Poor" or "Severe" days. Keep windows closed and utilise HEPA air purifiers where possible to mitigate indoor PM2.5 accumulation.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
        </div>
    );
}
