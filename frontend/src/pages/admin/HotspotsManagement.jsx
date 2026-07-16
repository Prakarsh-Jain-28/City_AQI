import { useState, useEffect } from "react";
import { getHotspots, updateHotspot, deleteHotspot, getOfficersByZone, createAssignment, createHotspot, getStations } from "../../api/adminApi";
import { getAqiColor, getSeverityColor, getStatusColor, formatDateTime } from "../../utils/aqiHelpers";
import { FiMapPin, FiAlertTriangle, FiUserPlus, FiCheckCircle, FiTrash2, FiActivity, FiTarget, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

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

export default function HotspotsManagement() {
    const { user } = useAuth();
    const [selectedCity, setSelectedCity] = useState("All");
    const [hotspots, setHotspots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedHotspot, setSelectedHotspot] = useState(null);
    const [officers, setOfficers] = useState([]);
    const [stations, setStations] = useState([]);
    const [assignForm, setAssignForm] = useState({ officerId: "", priority: "HIGH" });
    const [createForm, setCreateForm] = useState({ name: "", city: "", location: "", aqi: 0, severity: "HIGH", source: "INDUSTRY" });

    const fetchHotspots = () => {
        getHotspots()
            .then(res => { setHotspots(res.data.hotspots || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { 
        fetchHotspots();
        getStations().then(res => setStations(res.data.stations || [])).catch(() => {});
    }, []);

    const handleAssignClick = async (hotspot) => {
        setSelectedHotspot(hotspot);
        const cityParts = hotspot.location.split(',');
        const city = cityParts[cityParts.length - 1].trim() || hotspot.location;
        try {
            const res = await getOfficersByZone(city);
            setOfficers(res.data.officers || []);
            setShowAssignModal(true);
        } catch {
            setOfficers([]);
            setShowAssignModal(true);
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            await createAssignment({
                officer: assignForm.officerId,
                hotspotId: selectedHotspot._id,
                priority: assignForm.priority
            });
            setShowAssignModal(false);
            setAssignForm({ officerId: "", priority: "HIGH" });
            fetchHotspots();
        } catch (err) {
            alert(err.response?.data?.message || "Assignment failed");
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!createForm.city || !createForm.location) return alert("Please provide city and location.");

            const payload = {
                ...createForm,
                location: `${createForm.location}, ${createForm.city}`,
                latitude: 28.6139, // Defaulting as requested
                longitude: 77.2090
            };
            
            await createHotspot(payload);
            setShowCreateModal(false);
            setCreateForm({ name: "", city: "", location: "", aqi: 0, severity: "HIGH", source: "INDUSTRY" });
            fetchHotspots();
        } catch (err) {
            alert(err.response?.data?.message || "Hotspot creation failed");
        }
    };

    const handleResolve = async (id) => {
        if (window.confirm("Verify and mark this regional hotspot as resolved?")) {
            try {
                await updateHotspot(id, { status: "RESOLVED" });
                fetchHotspots();
            } catch (err) {
                alert("Update failed");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this hotspot record from the permanent database?")) {
            try {
                await deleteHotspot(id);
                fetchHotspots();
            } catch (err) {
                alert("Delete failed");
            }
        }
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const availableCities = ["All", ...new Set(stations.map(s => s.city).filter(Boolean))];

    const filteredHotspots = hotspots.filter(h => {
        if (user?.role !== "SUPER_ADMIN" && !h.location.includes(user?.city)) return false;
        if (selectedCity === "All") return true;
        return h.location.includes(selectedCity);
    });

    return (
        <div className="page-container" style={{ maxWidth: 1400, margin: "0 auto" }}>
            
            {/* ── Page Header ── */}
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
                <div>
                    <h1 style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "2.2rem", margin: "0 0 8px 0" }}>
                        <FiTarget style={{ color: "#f97316" }} /> Hotspots Management
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 650, margin: 0 }}>
                        Identify localised pollution anomalies, log primary sources, and dispatch field officers for immediate intervention.
                    </p>
                </div>
                <button className="btn" style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.3)", height: 46, padding: "0 24px", fontWeight: 700 }} onClick={() => setShowCreateModal(true)}>
                    <FiAlertTriangle size={18} /> Log Anomalous Region
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

            {/* ── Hotspots Table ── */}
            <div className="glass-panel" style={{ padding: 28 }}>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Hotspot Designation</th>
                                <th>Regional Zone</th>
                                <th>Registered AQI</th>
                                <th>Anomaly Severity</th>
                                <th>Suspected Vector</th>
                                <th>Intervention Status</th>
                                <th style={{ textAlign: "right" }}>Dispatcher Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHotspots.map(h => (
                                <tr key={h._id}>
                                    <td>
                                        <strong style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>{h.name}</strong><br/>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                                            <FiActivity size={10} /> {formatDateTime(h.createdAt)}
                                        </span>
                                    </td>
                                    <td><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-secondary)" }}><FiMapPin size={12} /> {h.location}</div></td>
                                    <td>
                                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: getAqiColor(h.aqi) }}>{h.aqi}</div>
                                    </td>
                                    <td>
                                        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", background: `${getSeverityColor(h.severity)}15`, color: getSeverityColor(h.severity), border: `1px solid ${getSeverityColor(h.severity)}30` }}>
                                            {h.severity}
                                        </span>
                                    </td>
                                    <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600 }}>{h.source}</td>
                                    <td>
                                        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", background: `${getStatusColor(h.status)}15`, color: getStatusColor(h.status), border: `1px solid ${getStatusColor(h.status)}30` }}>
                                            {h.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                            {h.status !== "RESOLVED" && h.status !== "ASSIGNED" && (
                                                <button className="btn btn-sm btn-primary" style={{ padding: "6px 12px", fontWeight: 600 }} onClick={() => handleAssignClick(h)}>
                                                    <FiUserPlus size={14} /> Dispatch
                                                </button>
                                            )}
                                            {h.status !== "RESOLVED" && (
                                                <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(16, 185, 129, 0.4)", color: "#10b981", padding: "6px 10px" }} onClick={() => handleResolve(h._id)} title="Verify Resolved">
                                                    <FiCheckCircle size={14} />
                                                </button>
                                            )}
                                            {user?.role === "SUPER_ADMIN" && (
                                                <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "6px 10px" }} onClick={() => handleDelete(h._id)} title="Delete Record">
                                                    <FiTrash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Assign Officer Modal ── */}
            {showAssignModal && selectedHotspot && (
                <div className="modal-overlay" style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <div className="modal-content glass-panel" style={{ maxWidth: 550, padding: 0, overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                        
                        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--hover-bg)" }}>
                            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, fontSize: "1.4rem" }}>
                                <FiUserPlus style={{ color: "var(--primary)" }} /> Dispatch Field Officer
                            </h2>
                            <button onClick={() => setShowAssignModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.5rem", padding: 4 }}>×</button>
                        </div>
                        
                        <form onSubmit={handleAssignSubmit} style={{ padding: 32 }}>
                            
                            <div style={{ background: "var(--hover-bg)", padding: 20, borderRadius: 12, marginBottom: 24, border: "1px solid var(--border-glass)", borderLeft: `4px solid ${getSeverityColor(selectedHotspot.severity)}` }}>
                                <h4 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontSize: "1.1rem" }}>{selectedHotspot.name}</h4>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                                    <FiMapPin size={12} /> {selectedHotspot.location}
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 800, background: `${getAqiColor(selectedHotspot.aqi)}15`, color: getAqiColor(selectedHotspot.aqi) }}>
                                        AQI {selectedHotspot.aqi}
                                    </span>
                                    <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>
                                        Vector: {selectedHotspot.source}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Select Available Officer</label>
                                {officers.length > 0 ? (
                                    <select className="contact-input" required value={assignForm.officerId} onChange={e => setAssignForm({ ...assignForm, officerId: e.target.value })}>
                                        <option value="">-- Choose available officer --</option>
                                        {officers.map(o => (
                                            <option key={o._id} value={o._id}>{o.name} ({o.city})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div style={{ padding: 16, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 8, color: "#f87171", fontSize: "0.9rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
                                        <FiAlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                                        <div>No officers available in {selectedHotspot.location.split(',')[0]}. Please create an officer profile for this zone first.</div>
                                    </div>
                                )}
                            </div>
                            <div className="form-group" style={{ marginTop: 20 }}>
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Dispatch Priority Level</label>
                                <select className="contact-input" value={assignForm.priority} onChange={e => setAssignForm({ ...assignForm, priority: e.target.value })}>
                                    <option value="CRITICAL">Critical (Immediate Dispatch)</option>
                                    <option value="HIGH">High (SLA: 2 hours)</option>
                                    <option value="MEDIUM">Medium (SLA: 12 hours)</option>
                                    <option value="LOW">Low (SLA: 24 hours)</option>
                                </select>
                            </div>
                            
                            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <button type="button" className="btn btn-outline" style={{ height: 44, padding: "0 20px" }} onClick={() => setShowAssignModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 28px" }} disabled={!assignForm.officerId}>Confirm Dispatch</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Report Hotspot Modal ── */}
            {showCreateModal && (
                <div className="modal-overlay" style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <div className="modal-content glass-panel" style={{ maxWidth: 700, padding: 0, overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                        
                        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--hover-bg)" }}>
                            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, fontSize: "1.4rem" }}>
                                <FiAlertTriangle style={{ color: "#f97316" }} /> Log Anomalous Region
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.5rem", padding: 4 }}>×</button>
                        </div>
                        
                        <form onSubmit={handleCreateSubmit} style={{ padding: 32 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                <div className="form-group" style={{ gridColumn: "1 / -1", margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Hotspot / Region Designation</label>
                                    <input type="text" className="contact-input" required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Okhla Industrial Area Phase 2" />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>City</label>
                                    <select className="contact-input" required value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })}>
                                        <option value="">-- Select City --</option>
                                        {availableCities.filter(c => c !== "All").map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Specific Location / Zone</label>
                                    <input type="text" className="contact-input" required value={createForm.location} onChange={e => setCreateForm({ ...createForm, location: e.target.value })} placeholder="e.g. Sector 12" />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>AQI Reading</label>
                                    <input type="number" className="contact-input" required value={createForm.aqi} onChange={e => setCreateForm({ ...createForm, aqi: Number(e.target.value) })} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Severity</label>
                                    <select className="contact-input" value={createForm.severity} onChange={e => setCreateForm({ ...createForm, severity: e.target.value })}>
                                        <option value="LOW">Low</option>
                                        <option value="MODERATE">Moderate</option>
                                        <option value="HIGH">High</option>
                                        <option value="VERY_HIGH">Very High</option>
                                        <option value="SEVERE">Severe</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: "1 / -1", margin: 0 }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Suspected Vector / Source</label>
                                    <select className="contact-input" value={createForm.source} onChange={e => setCreateForm({ ...createForm, source: e.target.value })}>
                                        <option value="INDUSTRY">Industrial Emissions</option>
                                        <option value="CONSTRUCTION">Construction Dust</option>
                                        <option value="TRAFFIC">Traffic Congestion</option>
                                        <option value="WASTE_BURNING">Waste Burning</option>
                                        <option value="MIXED">Mixed Sources</option>
                                        <option value="UNKNOWN">Unknown / Under Investigation</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 16 }}>
                                <button type="button" className="btn btn-outline" style={{ height: 44, padding: "0 24px" }} onClick={() => setShowCreateModal(false)}>Cancel Action</button>
                                <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 32px" }}>Log Hotspot</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
