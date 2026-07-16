import { useState, useEffect } from "react";
import { getReports, getReport, downloadReport } from "../../api/adminApi";
import { FiFileText, FiDownload, FiCalendar, FiMapPin, FiAlertTriangle, FiCheckCircle, FiBarChart2 } from "react-icons/fi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "../../context/AuthContext";

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-glass)", borderRadius: 10, padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>{label}</div>
            <div style={{ color: getAqiColor(payload[0].value), fontWeight: 800, fontSize: "1.1rem" }}>
                AQI {payload[0].value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{getAqiCategory(payload[0].value)}</div>
        </div>
    );
};

/* ── Stat Card ── */
const StatCard = ({ icon, label, value, color }) => (
    <div className="glass-panel" style={{ padding: "22px 24px", display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
        </div>
    </div>
);

export default function ReportsPage() {
    const { user } = useAuth();
    const [availableReports, setAvailableReports] = useState([]);
    const [activeReportType, setActiveReportType] = useState("daily");
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getReports().then(res => {
            setAvailableReports(res.data.reports || []);
        });
    }, []);

    useEffect(() => {
        setLoading(true);
        getReport(activeReportType).then(res => {
            setReportData(res.data.report);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [activeReportType]);

    const handleDownload = async () => {
        try {
            const res = await downloadReport(activeReportType);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
            const a = document.createElement("a");
            a.setAttribute("href", dataStr);
            a.setAttribute("download", `cityaqi_${activeReportType}_report.json`);
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error("Download failed");
        }
    };

    const filteredCityData = reportData?.cityData && user?.role === "OFFICER"
        ? reportData.cityData.filter(c => c.city === user.city)
        : reportData?.cityData;

    return (
        <div className="page-container" style={{ maxWidth: 1400, margin: "0 auto" }}>

            {/* ── Page Header ── */}
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
                <div>
                    <h1 style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "2.2rem", margin: "0 0 8px 0" }}>
                        <FiBarChart2 style={{ color: "var(--primary)" }} /> Analytical Reports
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 600, margin: 0 }}>
                        Aggregated environmental compliance data, enforcement metrics, and city-level AQI benchmarks.
                    </p>
                </div>
                <button
                    className="btn btn-outline"
                    style={{ height: 46, padding: "0 24px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}
                    onClick={handleDownload}
                    disabled={!reportData}
                >
                    <FiDownload size={16} /> Export JSON
                </button>
            </div>

            {/* ── Report Type Tabs ── */}
            <div className="glass-panel" style={{ padding: "14px 24px", marginBottom: 28, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", flexShrink: 0 }}>
                    Report Period:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {availableReports.map(r => (
                        <button
                            key={r.type}
                            onClick={() => setActiveReportType(r.type)}
                            style={{
                                background: activeReportType === r.type ? "var(--primary)" : "var(--hover-bg)",
                                color: activeReportType === r.type ? "#fff" : "var(--text-secondary)",
                                border: `1px solid ${activeReportType === r.type ? "var(--primary)" : "var(--border-glass)"}`,
                                padding: "7px 20px", borderRadius: 8,
                                cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                                transition: "all 0.18s ease",
                                boxShadow: activeReportType === r.type ? "0 0 14px rgba(59,130,246,0.35)" : "none"
                            }}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="page-loader"><div className="loader-spinner"></div></div>
            ) : !reportData ? (
                <div className="glass-panel" style={{ padding: "48px 24px", textAlign: "center" }}>
                    <FiFileText size={48} style={{ color: "var(--text-muted)", opacity: 0.3, marginBottom: 16 }} />
                    <p style={{ color: "var(--text-muted)" }}>Failed to load report data for this period.</p>
                </div>
            ) : (
                <>
                    {/* ── Report Summary Header ── */}
                    <div className="glass-panel" style={{ padding: "24px 32px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, borderTop: `4px solid ${getAqiColor(reportData.summary.avgAQI)}` }}>
                        <div>
                            <h2 style={{ margin: "0 0 10px 0", fontSize: "1.4rem", textTransform: "capitalize" }}>
                                {activeReportType} Compliance Report
                            </h2>
                            <div style={{ display: "flex", gap: 20, color: "var(--text-secondary)", fontSize: "0.875rem", flexWrap: "wrap" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <FiCalendar size={13} style={{ color: "var(--primary)" }} />
                                    {reportData.period
                                        ? (typeof reportData.period === "string" ? reportData.period : `${reportData.period.start} → ${reportData.period.end}`)
                                        : reportData.date}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <FiFileText size={13} style={{ color: "var(--primary)" }} />
                                    Generated: {new Date(reportData.generatedAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>National Avg AQI</div>
                            <div style={{ fontSize: "3rem", fontWeight: 900, color: getAqiColor(reportData.summary.avgAQI), lineHeight: 1 }}>{reportData.summary.avgAQI}</div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: getAqiColor(reportData.summary.avgAQI), marginTop: 4 }}>{getAqiCategory(reportData.summary.avgAQI)}</div>
                        </div>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 28 }}>
                        <StatCard
                            icon={<FiMapPin size={22} />}
                            label="Hotspots Detected"
                            value={reportData.summary.activeHotspots ?? reportData.summary.newHotspots ?? "—"}
                            color="#3b82f6"
                        />
                        <StatCard
                            icon={<FiAlertTriangle size={22} />}
                            label="Alerts Issued"
                            value={reportData.summary.totalAlerts ?? "—"}
                            color="#ef4444"
                        />
                        <StatCard
                            icon={<FiFileText size={22} />}
                            label="Enforcement Tasks"
                            value={reportData.summary.totalAssignments ?? "—"}
                            color="#f59e0b"
                        />
                        {reportData.summary.completionRate !== undefined && (
                            <StatCard
                                icon={<FiCheckCircle size={22} />}
                                label="Task Completion"
                                value={`${reportData.summary.completionRate}%`}
                                color="#10b981"
                            />
                        )}
                    </div>

                    {/* ── City Breakdown ── */}
                    {filteredCityData && (
                        <div className="glass-panel" style={{ padding: 28 }}>
                            <h3 style={{ margin: "0 0 28px 0", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: 10 }}>
                                <FiBarChart2 style={{ color: "var(--primary)" }} /> City Performance Breakdown
                            </h3>

                            {/* Bar Chart */}
                            <div style={{ height: 320, marginBottom: 40 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredCityData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="city" stroke="#64748b" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#64748b" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)", radius: 4 }} />
                                        <Bar dataKey="avgAQI" name="Average AQI" radius={[6, 6, 0, 0]} maxBarSize={72}>
                                            {filteredCityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getAqiColor(entry.avgAQI)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* City Table */}
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>City</th>
                                            <th>Avg AQI</th>
                                            <th>Peak AQI</th>
                                            <th>AQI Category</th>
                                            <th>Active Nodes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCityData.map(c => (
                                            <tr key={c.city}>
                                                <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{c.city}</td>
                                                <td>
                                                    <span style={{ fontSize: "1.15rem", fontWeight: 900, color: getAqiColor(c.avgAQI) }}>{c.avgAQI}</span>
                                                </td>
                                                <td style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{c.maxAQI}</td>
                                                <td>
                                                    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", background: `${getAqiColor(c.avgAQI)}15`, color: getAqiColor(c.avgAQI), border: `1px solid ${getAqiColor(c.avgAQI)}30` }}>
                                                        {getAqiCategory(c.avgAQI)}
                                                    </span>
                                                </td>
                                                <td style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{c.stations}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
