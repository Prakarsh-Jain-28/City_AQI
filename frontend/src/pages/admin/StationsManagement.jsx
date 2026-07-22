import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getStations, createStation, updateStation, deleteStation } from "../../api/adminApi";
import { FiPlus, FiEdit2, FiTrash2, FiRadio, FiMapPin, FiActivity, FiSettings, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";

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

export default function StationsManagement() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [selectedCity, setSelectedCity] = useState("All");
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        stationName: "", city: "", location: "", AQI: 0, PM25: 0, PM10: 0, NO2: 0, SO2: 0, CO: 0, O3: 0, status: "ACTIVE"
    });
    const [editingId, setEditingId] = useState(null);

    const fetchStations = () => {
        getStations()
            .then(res => { setStations(res.data.stations || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchStations(); }, []);

    useEffect(() => {
        if (searchParams.get("action") === "addNode") {
            setEditingId(null);
            setShowModal(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateStation(editingId, formData);
            } else {
                await createStation(formData);
            }
            setShowModal(false);
            setFormData({ stationName: "", city: "", location: "", AQI: 0, PM25: 0, PM10: 0, NO2: 0, SO2: 0, CO: 0, O3: 0, status: "ACTIVE" });
            setEditingId(null);
            fetchStations();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed");
        }
    };

    const handleEdit = (station) => {
        setFormData({
            stationName: station.stationName, city: station.city, location: station.location,
            AQI: station.AQI, PM25: station.PM25, PM10: station.PM10, NO2: station.NO2,
            SO2: station.SO2, CO: station.CO, O3: station.O3, status: station.status
        });
        setEditingId(station._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this telemetry node?")) {
            try {
                await deleteStation(id);
                fetchStations();
            } catch (err) {
                alert("Delete failed");
            }
        }
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const availableCities = ["All", ...new Set(stations.map(s => s.city).filter(Boolean))];
    const filteredStations = stations.filter(s => {
        if (user?.role !== "SUPER_ADMIN") return s.city === user?.city;
        if (selectedCity === "All") return true;
        return s.city === selectedCity;
    });

    const getStatusConfig = (status) => {
        switch(status) {
            case 'ACTIVE': return { color: "#10b981", bg: "rgba(16,185,129,0.15)", icon: <FiCheckCircle size={12} /> };
            case 'MAINTENANCE': return { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: <FiSettings size={12} /> };
            default: return { color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: <FiAlertCircle size={12} /> };
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: 1400, margin: "0 auto" }}>
            
            {/* ── Page Header ── */}
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
                <div>
                    <h1 style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "2.2rem", margin: "0 0 8px 0" }}>
                        <FiRadio style={{ color: "var(--primary)" }} /> Telemetry Nodes
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 650, margin: 0 }}>
                        Manage physical CPCB monitoring hardware, calibrate baseline sensors, and orchestrate network maintenance.
                    </p>
                </div>
                <button className="btn btn-primary" style={{ height: 46, padding: "0 24px", fontWeight: 700 }} onClick={() => { setEditingId(null); setShowModal(true); }}>
                    <FiPlus size={18} /> Provision Node
                </button>
            </div>

            {/* ── City Filter ── */}
            {user?.role === "SUPER_ADMIN" && availableCities.length > 1 && (
                <div className="glass-panel" style={{ padding: "16px 24px", marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase",
                            letterSpacing: "0.06em", color: "var(--text-muted)", flexShrink: 0
                        }}>
                            <FiMapPin size={13} /> Filter Region:
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
            )}

            {/* ── Stations Table ── */}
            <div className="glass-panel" style={{ padding: 28 }}>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Node Identity</th>
                                <th>Deployment Area</th>
                                <th>Network Status</th>
                                <th>Current AQI</th>
                                <th>Pollutant Avg</th>
                                <th style={{ textAlign: "right" }}>Node Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStations.map(s => {
                                const statusConfig = getStatusConfig(s.status);
                                return (
                                    <tr key={s._id}>
                                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.stationName}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                <FiMapPin size={12} /> {s.city} — {s.location}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ 
                                                display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", 
                                                borderRadius: 20, fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.04em",
                                                background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.color}40` 
                                            }}>
                                                {statusConfig.icon} {s.status}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: getAqiColor(s.AQI) }}>{s.AQI}</div>
                                                <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: getAqiColor(s.AQI) }}>
                                                    {getAqiCategory(s.AQI)}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                            <span style={{ marginRight: 12 }}>PM2.5: <strong style={{ color: "var(--text-primary)" }}>{s.PM25}</strong></span>
                                            <span>PM10: <strong style={{ color: "var(--text-primary)" }}>{s.PM10}</strong></span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                                <button className="btn btn-sm btn-outline" style={{ padding: "6px 10px" }} onClick={() => handleEdit(s)} title="Configure Node">
                                                    <FiSettings size={14} />
                                                </button>
                                                <button className="btn btn-sm" style={{ padding: "6px 10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }} onClick={() => handleDelete(s._id)} title="Decommission Node">
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Provisioning Modal ── */}
            {showModal && (
                <div className="modal-overlay" style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <div className="modal-content glass-panel" style={{ maxWidth: 700, padding: 0, maxHeight: "90vh", overflowY: "auto", border: "1px solid var(--border-glass)" }}>
                        
                        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--hover-bg)" }}>
                            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, fontSize: "1.4rem" }}>
                                <FiActivity style={{ color: "var(--primary)" }} /> {editingId ? "Configure Sensor Node" : "Provision New Node"}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.5rem", padding: 4 }}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: 32 }}>
                            
                            <h4 style={{ margin: "0 0 16px 0", color: "var(--text-primary)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Node Identity</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Hardware / Station Name</label>
                                    <input type="text" className="contact-input" required value={formData.stationName} onChange={e => setFormData({ ...formData, stationName: e.target.value })} placeholder="e.g. Anand Vihar CPCB-1" />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Target City</label>
                                    <input type="text" className="contact-input" required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="e.g. Delhi" />
                                </div>
                                <div className="form-group" style={{ gridColumn: "1 / -1", margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Exact Location / Zone</label>
                                    <input type="text" className="contact-input" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Sector 10, Dwarka" />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Network Status</label>
                                    <select className="contact-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="ACTIVE">Online / Active</option>
                                        <option value="MAINTENANCE">Maintenance Mode</option>
                                        <option value="INACTIVE">Offline / Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <h4 style={{ margin: "0 0 16px 0", color: "var(--text-primary)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Telemetry Calibration (Manual Override)</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--primary)", fontSize: "0.85rem", marginBottom: 8, display: "block", fontWeight: 700 }}>AQI Override</label>
                                    <input type="number" className="contact-input" required value={formData.AQI} onChange={e => setFormData({ ...formData, AQI: Number(e.target.value) })} style={{ borderColor: "var(--primary)", background: "rgba(59,130,246,0.05)" }} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>PM2.5 (µg/m³)</label>
                                    <input type="number" className="contact-input" value={formData.PM25} onChange={e => setFormData({ ...formData, PM25: Number(e.target.value) })} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>PM10 (µg/m³)</label>
                                    <input type="number" className="contact-input" value={formData.PM10} onChange={e => setFormData({ ...formData, PM10: Number(e.target.value) })} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>NO2 (µg/m³)</label>
                                    <input type="number" className="contact-input" value={formData.NO2} onChange={e => setFormData({ ...formData, NO2: Number(e.target.value) })} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>SO2 (µg/m³)</label>
                                    <input type="number" className="contact-input" value={formData.SO2} onChange={e => setFormData({ ...formData, SO2: Number(e.target.value) })} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>CO (mg/m³)</label>
                                    <input type="number" className="contact-input" value={formData.CO} onChange={e => setFormData({ ...formData, CO: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end", gap: 16 }}>
                                <button type="button" className="btn btn-outline" style={{ height: 44, padding: "0 24px" }} onClick={() => setShowModal(false)}>Cancel Action</button>
                                <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 32px", display: "flex", alignItems: "center", gap: 8 }}>
                                    <FiPlus /> {editingId ? "Commit Configuration" : "Add Provision New Node"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
