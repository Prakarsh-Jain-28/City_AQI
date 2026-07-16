import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPublicCities } from "../../api/publicApi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { FiSearch, FiMapPin, FiWind, FiActivity, FiArrowRight } from "react-icons/fi";

/* ── Pollutant cell component ── */
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

export default function CitiesPage() {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        getPublicCities()
            .then((res) => { setCities(res.data.cities || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filtered = cities.filter(c => c.city.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    return (
        <div className="page-container">

            {/* ── Page Header ── */}
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div className="logo-badge">CityAQI Live Directory</div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 20,
                        background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                        fontSize: "0.75rem", fontWeight: 700, color: "#10b981"
                    }}>
                        <FiActivity size={12} /> Real-time CPCB ingestion active
                    </div>
                </div>

                <h1 style={{ fontSize: "2.4rem", marginBottom: 12 }}>Air Quality Index Tracker</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 650, lineHeight: 1.7 }}>
                    Browse real-time ambient air quality indices aggregated across all active CPCB monitoring stations. Select any city to view comprehensive pollutant breakdowns, 72-hour AI forecasts, and targeted health advisories.
                </p>
            </div>

            {/* ── Premium Search Bar ── */}
            <div className="premium-search-wrapper">
                <FiSearch className="search-icon" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search for a city or monitored region..."
                    className="premium-search-input"
                />
            </div>

            {/* ── Results Grid ── */}
            {filtered.length === 0 ? (
                <div className="glass-panel" style={{ padding: "40px 24px", textAlign: "center" }}>
                    <FiMapPin size={32} style={{ color: "var(--text-muted)", marginBottom: 16 }} />
                    <h3 style={{ marginBottom: 8 }}>No regions found</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                        We couldn't find any monitored cities matching "{search}".
                    </p>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: 24
                }}>
                    {filtered.map((city) => {
                        const aqiColor = getAqiColor(city.avgAQI);
                        const category = getAqiCategory(city.avgAQI);
                        
                        return (
                            <Link 
                                to={`/city/${city.city}`} 
                                key={city.city} 
                                className="glass-panel"
                                style={{
                                    display: "block",
                                    padding: 24,
                                    borderTop: `4px solid ${aqiColor}`,
                                    textDecoration: "none",
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                            >
                                {/* Subtle background glow based on AQI */}
                                <div style={{
                                    position: "absolute", top: -30, right: -30,
                                    width: 120, height: 120, borderRadius: "50%",
                                    background: `${aqiColor}15`, filter: "blur(30px)",
                                    pointerEvents: "none"
                                }} />

                                {/* Header row */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                                            <FiMapPin size={11} /> Monitored Region
                                        </div>
                                        <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--text-primary)" }}>{city.city}</h2>
                                    </div>
                                    <div style={{
                                        padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 800,
                                        background: `${aqiColor}15`, color: aqiColor, border: `1px solid ${aqiColor}30`,
                                        letterSpacing: "0.04em"
                                    }}>
                                        {category}
                                    </div>
                                </div>

                                {/* Main AQI Display */}
                                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 24 }}>
                                    <div style={{ fontSize: "3.5rem", fontWeight: 900, lineHeight: 0.8, color: aqiColor, letterSpacing: "-0.03em" }}>
                                        {city.avgAQI}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 4 }}>
                                        Composite AQI
                                    </div>
                                </div>

                                {/* Pollutants Grid */}
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                                        <FiWind size={13} /> Key Pollutants
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                        <PollutantPill label="PM2.5" value={city.avgPM25} />
                                        <PollutantPill label="PM10" value={city.avgPM10} />
                                        <PollutantPill label="NO₂" value={city.avgNO2} unit="ppb" />
                                        <PollutantPill label="CO" value={city.avgCO} unit="mg/m³" />
                                    </div>
                                </div>

                                {/* Footer row */}
                                <div style={{ 
                                    display: "flex", justifyContent: "space-between", alignItems: "center", 
                                    paddingTop: 16, borderTop: "1px solid var(--border-glass)",
                                    fontSize: "0.8rem", color: "var(--text-muted)"
                                }}>
                                    <span>{city.stationCount} active station{city.stationCount !== 1 ? 's' : ''}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--primary)", fontWeight: 600 }}>
                                        View Details <FiArrowRight size={14} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
