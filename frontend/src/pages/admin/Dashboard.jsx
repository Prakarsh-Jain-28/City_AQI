import { useState, useEffect } from "react";
import { getDashboard } from "../../api/adminApi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { FiRadio, FiAlertTriangle, FiMapPin, FiClipboard, FiActivity, FiWind, FiClock, FiShield } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import AdminMonitoringPredictions from "./AdminMonitoringPredictions";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchDashboard = () => {
        getDashboard().then(res => {
            setData(res.data.dashboard);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.emit("joinAdmin");
        socket.on("stationUpdate", () => fetchDashboard());
        socket.on("newAlert", () => fetchDashboard());
        socket.on("newHotspot", () => fetchDashboard());
        socket.on("newAssignment", () => fetchDashboard());
        return () => {
            socket.off("stationUpdate");
            socket.off("newAlert");
            socket.off("newHotspot");
            socket.off("newAssignment");
        };
    }, [socket]);

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;
    if (!data) return <div className="empty-state">Failed to load dashboard data</div>;

    const { stats, topStations, recentAlerts, recentHotspots, cityAQIData } = data;

    // RBAC Filtering for Officers
    const isOfficer = user?.role === "OFFICER";
    const officerCity = user?.city;

    const filteredCityData = isOfficer 
        ? cityAQIData.filter(c => c._id === officerCity)
        : cityAQIData;

    const filteredStations = isOfficer
        ? topStations.filter(s => s.city === officerCity)
        : topStations;

    const filteredAlerts = isOfficer
        ? recentAlerts.filter(a => a.targetArea === officerCity)
        : recentAlerts;

    const filteredHotspots = isOfficer
        ? recentHotspots.filter(h => (h.city === officerCity) || (h.location && h.location.includes(officerCity)))
        : recentHotspots;

    return (
        <div className="dashboard-page">
            
            {/* ── Page Header ── */}
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 14px", borderRadius: 20,
                        background: "rgba(139, 92, 246, 0.1)",
                        border: "1px solid rgba(139, 92, 246, 0.25)",
                        fontSize: "0.78rem", fontWeight: 700, color: "#a78bfa"
                    }}>
                        <FiShield size={13} />
                        Command Centre Active
                    </div>
                    
                    <div style={{ display: "flex", gap: 12 }}>
                        <button className="btn btn-outline" style={{ height: 36, padding: "0 16px", fontSize: "0.85rem" }} onClick={() => navigate('/admin/stations?action=addNode')}>
                            <FiActivity size={14} style={{ marginRight: 6 }}/> Add Provision New Node
                        </button>
                        <button className="btn" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", height: 36, padding: "0 16px", fontSize: "0.85rem", fontWeight: 600 }} onClick={() => navigate('/admin/alerts?action=broadcastAlert')}>
                            <FiRadio size={14} style={{ marginRight: 6 }}/> Add Broadcast New Alert
                        </button>
                    </div>
                </div>
                <h1 style={{ fontSize: "2.2rem", margin: "0 0 8px 0", color: "var(--text-primary)" }}>Global Operations Overview</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 650 }}>
                    Real-time administrative telemetry, alert broadcasting, and statutory compliance monitoring across all active regions.
                </p>
            </div>

            {/* ── Bento Stats Grid ── */}
            <div className="bento-grid" style={{ marginBottom: 28 }}>
                <div className={`glass-panel bento-stat bento-col-4 ${stats.criticalStations > 0 ? 'border-glow-poor' : ''}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><FiRadio size={20} /></div>
                        {stats.criticalStations > 0 && <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 800, background: "rgba(248, 113, 113, 0.15)", color: "#f87171" }}>Attention Req.</span>}
                    </div>
                    <div>
                        <div className="bento-stat-label">Active Sensors</div>
                        <div className="bento-stat-number" style={{ color: "#60a5fa" }}>{stats.activeStations}<span style={{ fontSize: "1.2rem", color: "var(--text-muted)", fontWeight: 400 }}> / {stats.totalStations}</span></div>
                    </div>
                </div>

                <div className={`glass-panel bento-stat bento-col-4 border-glow-${stats.avgAQI > 300 ? 'severe' : stats.avgAQI > 200 ? 'poor' : stats.avgAQI > 100 ? 'moderate' : 'good'}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ background: `${getAqiColor(stats.avgAQI)}18`, color: getAqiColor(stats.avgAQI), width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><FiWind size={20} /></div>
                    </div>
                    <div>
                        <div className="bento-stat-label">National Avg AQI</div>
                        <div className="bento-stat-number" style={{ color: getAqiColor(stats.avgAQI) }}>{stats.avgAQI}</div>
                    </div>
                </div>

                <div className={`glass-panel bento-stat bento-col-4 ${stats.criticalStations > 2 ? 'border-glow-severe' : stats.criticalStations > 0 ? 'border-glow-poor' : ''}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ background: "rgba(239, 68, 68, 0.12)", color: "#f87171", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><FiAlertTriangle size={20} /></div>
                    </div>
                    <div>
                        <div className="bento-stat-label">Critical Zones</div>
                        <div className="bento-stat-number" style={{ color: stats.criticalStations > 0 ? "#f87171" : "var(--text-primary)" }}>{stats.criticalStations}</div>
                    </div>
                </div>

                <div className="glass-panel bento-stat bento-col-4">
                    <div style={{ background: "rgba(249, 115, 22, 0.12)", color: "#fb923c", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><FiMapPin size={20} /></div>
                    <div>
                        <div className="bento-stat-label">Active Hotspots</div>
                        <div className="bento-stat-number" style={{ color: "#fb923c" }}>{stats.activeHotspots}</div>
                    </div>
                </div>

                <div className="glass-panel bento-stat bento-col-4">
                    <div style={{ background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><FiClipboard size={20} /></div>
                    <div>
                        <div className="bento-stat-label">Pending Field Ops</div>
                        <div className="bento-stat-number" style={{ color: "#fbbf24" }}>{stats.pendingAssignments}</div>
                    </div>
                </div>

                <div className="glass-panel bento-stat bento-col-4 border-glow-good">
                    <div style={{ background: "rgba(16, 185, 129, 0.12)", color: "#34d399", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><FiClock size={20} /></div>
                    <div>
                        <div className="bento-stat-label">System Sync Time</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34d399", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em", marginTop: 8 }}>
                            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                    </div>
                </div>
            </div>

            {isOfficer ? (
                <div style={{ marginTop: 24 }}>
                    <AdminMonitoringPredictions embedded={true} />
                </div>
            ) : (
                <>
                    {/* ── Main Layout Split ── */}
                    <div className="bento-grid" style={{ marginBottom: 28 }}>
                        
                        {/* AQI Chart */}
                        <div className="glass-panel bento-wide bento-col-8 bento-row-2">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
                                    <FiActivity style={{ color: "var(--primary)" }} /> Regional Pollution Distribution
                                </h3>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Average AQI by City</div>
                            </div>
                            <div style={{ flex: 1, minHeight: 340 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredCityData} margin={{ left: -20, bottom: 20, right: 8, top: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                                        <XAxis dataKey="_id" stroke="var(--text-muted)" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: "var(--border-glass)" }} tickLine={false} dy={10} />
                                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: "var(--hover-bg)" }} contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", borderRadius: 12, color: "var(--text-primary)", fontSize: "0.85rem", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }} />
                                        <Bar dataKey="avgAQI" name="Average AQI" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                            {filteredCityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getAqiColor(entry.avgAQI)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Feeds */}
                        <div className="glass-panel bento-cell bento-col-4 bento-row-2" style={{ gap: 24 }}>
                            
                            {/* Alerts Feed */}
                            <div>
                                <h3 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8, fontSize: "1.05rem" }}>
                                    <FiAlertTriangle style={{ color: "#f87171" }} /> Broadcast Log
                                </h3>
                                {filteredAlerts.length === 0 ? (
                                    <div style={{ padding: "16px", background: "var(--hover-bg)", borderRadius: 8, color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>No recent emergency broadcasts.</div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {filteredAlerts.slice(0, 3).map(alert => (
                                            <div key={alert._id} style={{ 
                                                padding: "14px 16px", background: "var(--hover-bg)", borderRadius: 10,
                                                borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}` 
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{alert.title}</div>
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                                    <FiMapPin size={10} /> {alert.targetArea}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Hotspots Feed */}
                            <div>
                                <h3 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8, fontSize: "1.05rem" }}>
                                    <FiMapPin style={{ color: "#fb923c" }} /> Active Hotspots
                                </h3>
                                {filteredHotspots.length === 0 ? (
                                    <div style={{ padding: "16px", background: "var(--hover-bg)", borderRadius: 8, color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>No active pollution hotspots detected.</div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {filteredHotspots.slice(0, 3).map(hotspot => (
                                            <div key={hotspot._id} style={{ 
                                                padding: "14px 16px", background: "var(--hover-bg)", borderRadius: 10,
                                                borderLeft: `4px solid ${getAqiColor(hotspot.aqi)}` 
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, paddingRight: 8 }}>{hotspot.name}</div>
                                                    <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: `${getAqiColor(hotspot.aqi)}18`, color: getAqiColor(hotspot.aqi), flexShrink: 0 }}>AQI {hotspot.aqi}</span>
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                                    <FiMapPin size={10} /> {hotspot.location}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* ── High Priority Stations Table ── */}
                    <div className="glass-panel" style={{ padding: 28 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <div>
                                <h3 style={{ margin: "0 0 4px 0", color: "var(--text-primary)" }}>High Priority Sensor Nodes</h3>
                                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Stations requiring immediate administrative intervention based on current readings.</p>
                            </div>
                        </div>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Station Identity</th>
                                        <th>Region</th>
                                        <th>Current AQI</th>
                                        <th>Health Category</th>
                                        <th>PM2.5 Level</th>
                                        <th>PM10 Level</th>
                                        <th style={{ textAlign: "right" }}>Quick Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStations.slice(0, 5).map(station => (
                                        <tr key={station._id}>
                                            <td style={{ fontWeight: 600 }}>{station.stationName}</td>
                                            <td><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-secondary)" }}><FiMapPin size={12} /> {station.city}</div></td>
                                            <td>
                                                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: getAqiColor(station.AQI) }}>{station.AQI}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", background: `${getAqiColor(station.AQI)}15`, color: getAqiColor(station.AQI), border: `1px solid ${getAqiColor(station.AQI)}30` }}>
                                                    {getAqiCategory(station.AQI)}
                                                </div>
                                            </td>
                                            <td style={{ color: "var(--text-secondary)" }}>{station.PM25} <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>µg/m³</span></td>
                                            <td style={{ color: "var(--text-secondary)" }}>{station.PM10} <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>µg/m³</span></td>
                                            <td style={{ textAlign: "right" }}>
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                                    <button className="btn btn-sm" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }} onClick={() => navigate('/admin/hotspots')} title="Log Hotspot">
                                                        <FiAlertTriangle />
                                                    </button>
                                                    <button className="btn btn-sm btn-primary" onClick={() => navigate('/admin/alerts')} title="Issue Broadcast">
                                                        <FiActivity />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
