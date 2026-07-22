import { useState, useEffect } from "react";
import { getAlerts, broadcastAlert, deleteAlert } from "../../api/adminApi";
import { formatDateTime, getSeverityColor } from "../../utils/aqiHelpers";
import { FiAlertTriangle, FiRadio, FiTrash2, FiClock, FiMapPin, FiShield, FiUser, FiPlus } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useSearchParams } from "react-router-dom";

export default function AlertsManagement() {
    const { user } = useAuth();
    const { socket } = useSocket() || {};
    const [searchParams] = useSearchParams();
    const [alerts, setAlerts] = useState([]);
    const [activeTab, setActiveTab] = useState("LIVE");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: "", description: "", severity: "HIGH", targetArea: user?.role === "SUPER_ADMIN" ? "All Regions" : (user?.city || "All Regions"), durationHours: 24, advisories: []
    });

    const handleOpenModal = () => {
        setFormData({
            title: "", description: "", severity: "HIGH", 
            targetArea: user?.role === "SUPER_ADMIN" ? "All Regions" : (user?.city || "All Regions"), 
            durationHours: 24, advisories: []
        });
        setShowModal(true);
    };

    const advisoryOptions = [
        "Elderly & Seniors: Stay indoors and keep windows closed.",
        "Children & Schools: Suspend all outdoor physical activities.",
        "Respiratory/Asthma: Keep inhalers handy and avoid exertion.",
        "Outdoor Activities: Avoid morning walks and heavy exercises.",
        "Vehicle Restrictions: Carpooling recommended; avoid diesel vehicles."
    ];

    const toggleAdvisory = (adv) => {
        setFormData(prev => ({
            ...prev,
            advisories: prev.advisories.includes(adv) 
                ? prev.advisories.filter(a => a !== adv)
                : [...prev.advisories, adv]
        }));
    };

    const fetchAlerts = () => {
        getAlerts()
            .then(res => { setAlerts(res.data.alerts || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { 
        fetchAlerts(); 
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleNewAlert = () => fetchAlerts();
        socket.on("emergencyAlert", handleNewAlert);
        return () => socket.off("emergencyAlert", handleNewAlert);
    }, [socket]);

    useEffect(() => {
        const broadcastCity = searchParams.get("broadcast");
        const action = searchParams.get("action");
        if (broadcastCity) {
            setFormData(prev => ({ ...prev, targetArea: broadcastCity }));
            setShowModal(true);
        } else if (action === "broadcastAlert") {
            handleOpenModal();
        }
    }, [searchParams]);

    const handleBroadcast = async (e) => {
        e.preventDefault();
        try {
            await broadcastAlert({
                ...formData,
                expiresAt: new Date(Date.now() + formData.durationHours * 60 * 60 * 1000).toISOString()
            });
            setShowModal(false);
            setFormData({ title: "", description: "", severity: "HIGH", targetArea: "", durationHours: 24, advisories: [] });
            fetchAlerts();
            // Using a custom alert for the demo would be better, but window.alert works for now
            alert("Emergency alert broadcasted via WebSockets to all active citizens in the target area.");
        } catch (err) {
            alert(err.response?.data?.message || "Broadcast failed");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Retract this active broadcast? It will be immediately removed from citizen dashboards.")) {
            try {
                await deleteAlert(id);
                fetchAlerts();
            } catch (err) {
                alert("Delete failed");
            }
        }
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const filteredAlerts = alerts.filter(alert => {
        if (user?.role === "OFFICER" && alert.targetArea !== user?.city) return false;
        return activeTab === "LIVE" ? new Date(alert.expiresAt) > new Date() : new Date(alert.expiresAt) <= new Date();
    });

    return (
        <div className="page-container" style={{ maxWidth: 1400, margin: "0 auto" }}>
            
            {/* ── Page Header ── */}
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
                <div>
                    <h1 style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "2.2rem", margin: "0 0 8px 0" }}>
                        <FiAlertTriangle style={{ color: "#ef4444" }} /> Emergency Broadcasts
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 650, margin: 0 }}>
                        Manage and transmit statutory health advisories and pollution warnings to citizens via WebSocket telemetry.
                    </p>
                </div>
                <button className="btn" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", height: 46, padding: "0 24px", fontWeight: 700 }} onClick={handleOpenModal}>
                    <FiRadio size={18} /> Initiate Broadcast
                </button>
            </div>

            {/* ── Tabs ── */}
            <div className="glass-panel" style={{ padding: "16px 24px", marginBottom: 28, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", flexShrink: 0 }}>
                    Filter Network:
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button 
                        onClick={() => setActiveTab("LIVE")}
                        style={{
                            background: activeTab === "LIVE" ? "rgba(239,68,68,0.15)" : "var(--hover-bg)",
                            color: activeTab === "LIVE" ? "#ef4444" : "var(--text-secondary)",
                            border: `1px solid ${activeTab === "LIVE" ? "rgba(239,68,68,0.3)" : "var(--border-glass)"}`,
                            padding: "8px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                            transition: "all 0.2s ease"
                        }}
                    >
                        Active Transmissions
                    </button>
                    <button 
                        onClick={() => setActiveTab("EXPIRED")}
                        style={{
                            background: activeTab === "EXPIRED" ? "var(--hover-bg)" : "transparent",
                            color: activeTab === "EXPIRED" ? "var(--text-primary)" : "var(--text-muted)",
                            border: `1px solid ${activeTab === "EXPIRED" ? "var(--border-glass)" : "transparent"}`,
                            padding: "8px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                            transition: "all 0.2s ease"
                        }}
                    >
                        Archived / Expired
                    </button>
                </div>
            </div>

            {/* ── Alerts Grid ── */}
            {filteredAlerts.length === 0 ? (
                <div className="glass-panel" style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <FiShield size={48} style={{ color: "var(--text-muted)", opacity: 0.3, marginBottom: 16 }} />
                    <h3 style={{ margin: "0 0 8px 0" }}>No {activeTab === "LIVE" ? "Active" : "Archived"} Broadcasts</h3>
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>The regional network is currently clear of emergency advisories.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 24 }}>
                    {filteredAlerts.map(alert => {
                        const isExpired = new Date(alert.expiresAt) < new Date();
                        const createdById = alert.createdBy?._id || alert.createdBy;
                        const canRetract = user.role === "SUPER_ADMIN" || createdById === user._id;
                        
                        return (
                            <div key={alert._id} className="glass-panel" style={{ 
                                padding: 28, position: "relative", overflow: "hidden",
                                borderTop: `4px solid ${getSeverityColor(alert.severity)}` 
                            }}>
                                {/* Background glow */}
                                <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: `${getSeverityColor(alert.severity)}10`, filter: "blur(25px)", pointerEvents: "none" }} />

                                {isExpired && (
                                    <div style={{ position: "absolute", top: 16, right: 16, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.05em", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", padding: "4px 10px", borderRadius: 6 }}>
                                        EXPIRED
                                    </div>
                                )}
                                
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                    <span style={{ 
                                        display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", 
                                        background: `${getSeverityColor(alert.severity)}15`, color: getSeverityColor(alert.severity), border: `1px solid ${getSeverityColor(alert.severity)}30` 
                                    }}>
                                        {alert.severity}
                                    </span>
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                                        <FiMapPin size={12} style={{ color: "var(--primary)" }} /> {alert.targetArea}
                                    </span>
                                </div>
                                
                                <h3 style={{ margin: "0 0 12px 0", fontSize: "1.2rem", color: isExpired ? "var(--text-secondary)" : "var(--text-primary)", lineHeight: 1.3 }}>{alert.title}</h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 24, paddingRight: 10 }}>
                                    {alert.description}
                                </p>
                                
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid var(--border-glass)", paddingTop: 16 }}>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 6 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><FiClock size={12} /> Issued: <strong style={{ color: "var(--text-secondary)" }}>{formatDateTime(alert.createdAt)}</strong></div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><FiUser size={12} /> Origin: <strong style={{ color: "var(--text-secondary)" }}>{alert.createdBy?.name || "System"}</strong></div>
                                    </div>
                                    {canRetract && !isExpired && (
                                        <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "#ef4444", padding: "6px 14px", fontWeight: 600 }} onClick={() => handleDelete(alert._id)}>
                                            <FiTrash2 size={14} /> Retract
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Broadcast Modal ── */}
            {showModal && (
                <div className="modal-overlay" style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <div className="modal-content glass-panel" style={{ maxWidth: 650, padding: 0, maxHeight: "90vh", overflowY: "auto", border: "1px solid var(--border-glass)" }}>
                        
                        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--hover-bg)" }}>
                            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, fontSize: "1.4rem", color: "#ef4444" }}>
                                <FiRadio /> Transmit Emergency Broadcast
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.5rem", padding: 4 }}>×</button>
                        </div>
                        
                        <form onSubmit={handleBroadcast} style={{ padding: 32 }}>
                            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "16px 20px", borderRadius: 12, marginBottom: 28, display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <FiAlertTriangle size={20} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
                                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                                    <strong style={{ color: "#ef4444" }}>Critical Warning:</strong> Submitting this form will instantly trigger push notifications and UI banners on all active citizen client applications in the targeted region via WebSocket.
                                </p>
                            </div>
                            
                            <div className="form-group">
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Broadcast Headline</label>
                                <input type="text" className="contact-input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Severe Smog Warning - GRAP Stage IV Enforced" />
                            </div>
                            
                            <div className="form-group" style={{ marginTop: 20 }}>
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Detailed Advisory Body</label>
                                <textarea className="contact-input" rows="4" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Provide clear instructions and health advisories..." style={{ resize: "vertical" }}></textarea>
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Severity Level</label>
                                    <select className="contact-input" value={formData.severity} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                                        <option value="CRITICAL">CRITICAL (AQI &gt; 400)</option>
                                        <option value="HIGH">HIGH (AQI &gt; 300)</option>
                                        <option value="MEDIUM">MEDIUM (AQI &gt; 200)</option>
                                        <option value="LOW">LOW</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Target Region</label>
                                    <select 
                                        className="contact-input" 
                                        value={formData.targetArea} 
                                        onChange={e => setFormData({ ...formData, targetArea: e.target.value })}
                                        disabled={user?.role !== "SUPER_ADMIN"}
                                        style={user?.role !== "SUPER_ADMIN" ? { opacity: 0.7, cursor: "not-allowed", backgroundColor: "var(--hover-bg)" } : {}}
                                    >
                                        <option value="All Regions">All Regions</option>
                                        <option value="Bengaluru">Bengaluru</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Kolkata">Kolkata</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 28 }}>
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 16, display: "block", fontWeight: 700, borderBottom: "1px solid var(--border-glass)", paddingBottom: 8 }}>Append Statutory Instructions</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {advisoryOptions.map((adv, idx) => (
                                        <label key={idx} style={{ 
                                            display: "flex", alignItems: "center", gap: 12, cursor: "pointer", 
                                            fontSize: "0.85rem", color: formData.advisories.includes(adv) ? "var(--text-primary)" : "var(--text-secondary)",
                                            background: formData.advisories.includes(adv) ? "var(--hover-bg)" : "transparent",
                                            padding: "8px 12px", borderRadius: 8, transition: "all 0.2s"
                                        }}>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.advisories.includes(adv)}
                                                onChange={() => toggleAdvisory(adv)}
                                                style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
                                            />
                                            {adv}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 28, width: "50%" }}>
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Broadcast Duration (Hours)</label>
                                <input type="number" min="1" max="168" className="contact-input" required value={formData.durationHours} onChange={e => setFormData({ ...formData, durationHours: parseInt(e.target.value) })} />
                            </div>

                            <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end", gap: 16 }}>
                                <button type="button" className="btn btn-outline" style={{ height: 44, padding: "0 24px" }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 28px", background: "#ef4444", borderColor: "#ef4444", color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                                    <FiPlus /> Add Broadcast New Alert
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
