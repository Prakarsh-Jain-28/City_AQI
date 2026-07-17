import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
    FiAlertTriangle, FiClock, FiMapPin, FiInfo,
    FiCheckCircle, FiFilter, FiWifi, FiShield,
    FiAlertCircle, FiActivity, FiEyeOff
} from "react-icons/fi";
import { formatDateTime, getSeverityColor } from "../../utils/aqiHelpers";
import API from "../../api/axios";
import { io } from "socket.io-client";

/* ── Advisory icon map (no raw emojis in JSX) ── */
const getAdvisoryIcon = (advisory) => {
    if (advisory.includes("Elderly"))                          return <FiShield size={16} />;
    if (advisory.includes("Children"))                         return <FiShield size={16} />;
    if (advisory.includes("Respiratory") || advisory.includes("Asthma")) return <FiActivity size={16} />;
    if (advisory.includes("Outdoor"))                          return <FiAlertCircle size={16} />;
    if (advisory.includes("Vehicle"))                          return <FiAlertCircle size={16} />;
    return <FiAlertTriangle size={16} />;
};

/* ── Severity config ── */
const SEVERITY_META = {
    Critical: { glow: "#ef4444", label: "CRITICAL EMERGENCY" },
    High:     { glow: "#f59e0b", label: "HIGH SEVERITY" },
    Moderate: { glow: "#f97316", label: "MODERATE SEVERITY" },
    Low:      { glow: "#3b82f6", label: "LOW SEVERITY" },
};

/* ── Meta pill ── */
const MetaPill = ({ icon, children }) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: "0.82rem", color: "var(--text-secondary)",
        background: "var(--hover-bg)",
        border: "1px solid var(--border-glass)",
        padding: "5px 12px", borderRadius: 20
    }}>
        <span style={{ color: "var(--primary)" }}>{icon}</span>
        {children}
    </div>
);

/* ── Active alert card ── */
const ActiveAlertCard = ({ alert }) => {
    const sev = alert.severity;
    const sevColor = getSeverityColor(sev);
    const meta = SEVERITY_META[sev] || { glow: sevColor, label: `${sev?.toUpperCase()} SEVERITY` };

    return (
        <div className="glass-panel" style={{
            padding: 28,
            borderLeft: `5px solid ${sevColor}`,
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Glow blob */}
            <div style={{
                position: "absolute", top: -40, right: -40,
                width: 160, height: 160, borderRadius: "50%",
                background: `${sevColor}10`, filter: "blur(40px)",
                pointerEvents: "none"
            }} />

            {/* Severity badge */}
            <div style={{
                position: "absolute", top: 0, right: 0,
                padding: "6px 16px",
                background: `${sevColor}20`,
                color: sevColor,
                borderBottomLeftRadius: 12,
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.07em"
            }}>
                {meta.label}
            </div>

            {/* Title */}
            <h3 style={{
                fontSize: "1.3rem", marginBottom: 14,
                color: "var(--text-primary)", paddingRight: 120, lineHeight: 1.35
            }}>
                {alert.title}
            </h3>

            {/* Meta pills row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                <MetaPill icon={<FiClock size={13} />}>
                    Broadcasted: {formatDateTime(alert.createdAt)}
                </MetaPill>
                <MetaPill icon={<FiInfo size={13} />}>
                    Duration: {alert.durationHours}h
                </MetaPill>
                <MetaPill icon={<FiMapPin size={13} />}>
                    {alert.targetArea}
                </MetaPill>
            </div>

            {/* Description */}
            {alert.description && (
                <div style={{
                    background: "var(--hover-bg)",
                    border: "1px solid var(--border-glass)",
                    padding: "14px 18px",
                    borderRadius: 10,
                    marginBottom: 20,
                    lineHeight: 1.75,
                    fontSize: "0.92rem",
                    color: "var(--text-secondary)"
                }}>
                    {alert.description}
                </div>
            )}

            {/* Advisories */}
            {alert.advisories?.length > 0 && (
                <div>
                    <div style={{
                        fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 12,
                        display: "flex", alignItems: "center", gap: 8
                    }}>
                        <FiShield size={13} style={{ color: sevColor }} />
                        Targeted Health Advisories
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                        {alert.advisories.map((advisory, idx) => (
                            <div key={idx} style={{
                                background: `${sevColor}08`,
                                border: `1px solid ${sevColor}25`,
                                padding: "12px 14px",
                                borderRadius: 10,
                                display: "flex",
                                gap: 10,
                                alignItems: "flex-start"
                            }}>
                                <span style={{ color: sevColor, flexShrink: 0, marginTop: 1 }}>
                                    {getAdvisoryIcon(advisory)}
                                </span>
                                <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                                    {advisory}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Past alert row ── */
const PastAlertRow = ({ alert }) => (
    <div className="glass-panel" style={{
        padding: "16px 22px",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 12,
        opacity: 0.65
    }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FiEyeOff size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 3 }}>
                    {alert.title}
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "flex", gap: 16 }}>
                    <span>Area: {alert.targetArea}</span>
                    <span>Issued: {formatDateTime(alert.createdAt)}</span>
                </div>
            </div>
        </div>
        <div style={{
            padding: "4px 12px", borderRadius: 20,
            background: "var(--hover-bg)", border: "1px solid var(--border-glass)",
            fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em",
            color: "var(--text-muted)"
        }}>
            EXPIRED
        </div>
    </div>
);

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

/* ── Page ── */
export default function PublicAlertsPage() {
    const location = useLocation();
    const [alerts, setAlerts]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [selectedCity, setSelectedCity] = useState("All Regions");
    const [liveConnected, setLiveConnected] = useState(false);

    useEffect(() => {
        const cityParam = new URLSearchParams(location.search).get("city");
        if (cityParam) setSelectedCity(cityParam);
    }, [location.search]);

    useEffect(() => {
        const fetchAlerts = () => {
            API.get("/public/alerts")
                .then(res => { if (res.data.success) setAlerts(res.data.alerts); })
                .catch(err => console.error("Failed to fetch public alerts", err))
                .finally(() => setLoading(false));
        };
        fetchAlerts();

        const socket = io("http://localhost:8000", { transports: ["websocket", "polling"] });
        socket.on("connect",        () => setLiveConnected(true));
        socket.on("disconnect",     () => setLiveConnected(false));
        socket.on("emergencyAlert", () => fetchAlerts());
        return () => socket.disconnect();
    }, []);

    const citiesList = ["All Regions", "Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Lucknow"];

    if (loading) return <div className="page-loader"><div className="loader-spinner" /></div>;

    const filteredAlerts = alerts.filter(a =>
        selectedCity === "All Regions" || a.targetArea === selectedCity || a.targetArea === "All Regions"
    );

    const isExpired = (a) => a.expiresAt && new Date(a.expiresAt) <= new Date();

    const activeAlerts = filteredAlerts.filter(a => a.isActive && !isExpired(a));
    const pastAlerts   = filteredAlerts.filter(a => !a.isActive || isExpired(a));

    return (
        <div className="page-container">

            {/* ── Header ── */}
            <div className="page-header" style={{ marginBottom: 36 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                    <div className="logo-badge">CityAQI Advisories</div>
                    {/* Live indicator */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 14px", borderRadius: 20,
                        background: liveConnected ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)",
                        border: `1px solid ${liveConnected ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
                        fontSize: "0.78rem", fontWeight: 700,
                        color: liveConnected ? "#10b981" : "#ef4444"
                    }}>
                        <FiWifi size={13} />
                        {liveConnected ? "Live — WebSocket Connected" : "Connecting to Live Feed..."}
                    </div>
                </div>

                <h1 style={{ fontSize: "2.2rem", marginBottom: 12 }}>Public Safety & Health Alerts</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.02rem", maxWidth: 660, lineHeight: 1.75 }}>
                    Statutory ambient air quality emergency broadcasts and targeted health advisories, dispatched in real-time by authorised environmental officials via the CityAQI command centre. All alerts are refreshed instantly via persistent Socket.IO connections.
                </p>
            </div>

            {/* ── Stats strip ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                {[
                    { value: activeAlerts.length, label: "Active Alerts", color: activeAlerts.length > 0 ? "#ef4444" : "#10b981" },
                    { value: pastAlerts.length,   label: "Archived Alerts", color: "var(--text-muted)" },
                    { value: filteredAlerts.length, label: "Total (Filtered)", color: "var(--primary)" },
                ].map(({ value, label, color }) => (
                    <div key={label} className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.4 }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* ── City filter bar ── */}
            <div className="glass-panel" style={{ padding: "16px 22px", marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase",
                        letterSpacing: "0.06em", color: "var(--text-muted)", flexShrink: 0
                    }}>
                        <FiFilter size={13} />Filter by Region:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {citiesList.map(city => (
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

            {/* ── Active alerts section ── */}
            <div style={{ marginBottom: 40 }}>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: 20, paddingBottom: 14,
                    borderBottom: "1px solid var(--border-glass)"
                }}>
                    <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: activeAlerts.length > 0 ? "#ef4444" : "#10b981",
                            boxShadow: `0 0 8px ${activeAlerts.length > 0 ? "#ef4444" : "#10b981"}`
                        }} />
                        {activeAlerts.length > 0 ? "Active Emergency Broadcasts" : "System Status"}
                    </h2>
                    {activeAlerts.length > 0 && (
                        <span style={{
                            padding: "4px 12px", borderRadius: 20, fontSize: "0.72rem",
                            fontWeight: 800, background: "rgba(239,68,68,0.1)",
                            color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)",
                            letterSpacing: "0.05em"
                        }}>
                            {activeAlerts.length} LIVE
                        </span>
                    )}
                </div>

                {activeAlerts.length === 0 ? (
                    <div className="glass-panel" style={{ padding: "36px 28px", textAlign: "center" }}>
                        <FiCheckCircle size={44} style={{ color: "#10b981", marginBottom: 14 }} />
                        <h3 style={{ marginBottom: 8 }}>All Systems Nominal</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
                            No emergency broadcasts are active for the selected region. Air quality indices are within statutory compliance thresholds. The system is continuously monitoring all CPCB stations.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {activeAlerts.map(alert => <ActiveAlertCard key={alert._id} alert={alert} />)}
                    </div>
                )}
            </div>

            {/* ── Historical alerts section ── */}
            {pastAlerts.length > 0 && (
                <div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        marginBottom: 16, paddingBottom: 14,
                        borderBottom: "1px solid var(--border-glass)"
                    }}>
                        <h2 style={{ margin: 0, color: "var(--text-secondary)", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
                            <FiClock size={18} /> Alert Archive
                        </h2>
                        <span style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem",
                            fontWeight: 700, background: "var(--hover-bg)",
                            color: "var(--text-muted)", border: "1px solid var(--border-glass)"
                        }}>
                            {pastAlerts.length} records
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {pastAlerts.map(alert => <PastAlertRow key={alert._id} alert={alert} />)}
                    </div>
                </div>
            )}

            {/* ── Info strip ── */}
            <div style={{
                display: "flex", alignItems: "center", gap: 10, marginTop: 36,
                padding: "12px 18px", borderRadius: 10,
                background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)",
                fontSize: "0.8rem", color: "var(--text-muted)"
            }}>
                <FiInfo size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                All alerts are issued by authorised government officials via the CityAQI Admin Command Centre and transmitted via persistent WebSocket (Socket.IO) connections. Citizens are advised to follow instructions from their local municipal authority.
            </div>

        </div>
    );
}
