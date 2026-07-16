import { useState, useEffect } from "react";
import { getPublicCities, getPublicCompare } from "../../api/publicApi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { FiLayers, FiMapPin, FiWind, FiAlertCircle, FiBarChart2, FiChevronDown, FiArrowRight } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

/* ── Pollutant stat cell ── */
const PollutantCell = ({ label, value, unit = "µg/m³", accentColor }) => (
    <div style={{
        background: "var(--hover-bg)",
        border: "1px solid var(--border-glass)",
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4
    }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
        <div style={{ fontWeight: 800, fontSize: "1.15rem", color: accentColor || "var(--text-primary)" }}>
            {value ?? "—"}
            <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: 3 }}>{unit}</span>
        </div>
    </div>
);

/* ── AQI health tier bar ── */
const AqiGauge = ({ aqi, color }) => {
    const max = 500;
    const pct = Math.min((aqi / max) * 100, 100);
    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ height: 6, borderRadius: 99, background: "var(--hover-bg)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                <span>0</span><span>Good</span><span>Moderate</span><span>Poor</span><span>500</span>
            </div>
        </div>
    );
};

/* ── City result card ── */
const CityResultCard = ({ cityData, accentColor }) => {
    const aqiColor = getAqiColor(cityData.avgAQI);
    const category = getAqiCategory(cityData.avgAQI);
    const pollutants = cityData.pollutants || {};

    return (
        <div className="glass-panel" style={{ padding: 28, borderTop: `4px solid ${accentColor}`, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* City header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                        <FiMapPin size={11} style={{ marginRight: 4 }} />Monitored City
                    </div>
                    <h2 style={{ margin: 0, fontSize: "1.4rem" }}>{cityData.city}</h2>
                </div>
                <div style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 800,
                    background: `${aqiColor}18`, color: aqiColor,
                    border: `1px solid ${aqiColor}40`
                }}>
                    {category}
                </div>
            </div>

            {/* AQI hero number */}
            <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 6 }}>
                    Composite AQI Index
                </div>
                <div style={{ fontSize: "4.5rem", fontWeight: 900, color: aqiColor, lineHeight: 1 }}>{cityData.avgAQI}</div>
                <AqiGauge aqi={cityData.avgAQI} color={aqiColor} />
            </div>

            {/* Pollutants */}
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                    <FiWind size={14} />Pollutant Breakdown
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <PollutantCell label="PM2.5" value={pollutants.PM25} accentColor={aqiColor} />
                    <PollutantCell label="PM10" value={pollutants.PM10} />
                    <PollutantCell label="NO₂" value={pollutants.NO2} unit="ppb" />
                    <PollutantCell label="SO₂" value={pollutants.SO2} unit="ppb" />
                    <PollutantCell label="CO" value={pollutants.CO} unit="mg/m³" />
                    <PollutantCell label="O₃" value={pollutants.O3} unit="ppb" />
                </div>
            </div>

            {/* Stations */}
            {cityData.stationCount && (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-glass)", paddingTop: 12 }}>
                    Data aggregated from <strong style={{ color: "var(--text-secondary)" }}>{cityData.stationCount} CPCB monitoring stations</strong>
                </div>
            )}
        </div>
    );
};

/* ── Main Page ── */
export default function ComparePage() {
    const [cities, setCities] = useState([]);
    const [city1, setCity1] = useState("");
    const [city2, setCity2] = useState("");
    const [comparisonData, setComparisonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chartMode, setChartMode] = useState("bar"); // "bar" | "radar"

    useEffect(() => {
        getPublicCities().then(res => {
            const cityList = res.data.cities || [];
            setCities(cityList);
            if (cityList.length >= 2) {
                setCity1(cityList[0].city);
                setCity2(cityList[1].city);
            }
        });
    }, []);

    const handleCompare = async () => {
        if (!city1 || !city2) return;
        if (city1 === city2) { setError("Please select two different cities to compare."); return; }
        setLoading(true); setError(null);
        try {
            const res = await getPublicCompare(city1, city2);
            setComparisonData(res.data.comparison);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch comparison data.");
        } finally { setLoading(false); }
    };

    const buildChartData = () => {
        if (!comparisonData) return [];
        const d1 = comparisonData.city1;
        const d2 = comparisonData.city2;
        return [
            { name: "AQI",   [d1.city]: d1.avgAQI,            [d2.city]: d2.avgAQI },
            { name: "PM2.5", [d1.city]: d1.pollutants.PM25,   [d2.city]: d2.pollutants.PM25 },
            { name: "PM10",  [d1.city]: d1.pollutants.PM10,   [d2.city]: d2.pollutants.PM10 },
            { name: "NO₂",   [d1.city]: d1.pollutants.NO2,    [d2.city]: d2.pollutants.NO2 },
            { name: "SO₂",   [d1.city]: d1.pollutants.SO2,    [d2.city]: d2.pollutants.SO2 },
            { name: "CO",    [d1.city]: d1.pollutants.CO,     [d2.city]: d2.pollutants.CO },
        ];
    };

    const SelectBox = ({ label, value, onChange }) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <label className="contact-label">{label}</label>
            <div style={{ position: "relative" }}>
                <select
                    className="contact-input"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ paddingRight: 36, appearance: "none", cursor: "pointer" }}
                >
                    {cities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                </select>
                <FiChevronDown size={16} style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)"
                }} />
            </div>
        </div>
    );

    return (
        <div className="page-container">

            {/* ── Page Header ── */}
            <div className="page-header" style={{ marginBottom: 36 }}>
                <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <FiLayers style={{ color: "var(--primary)" }} />
                    Compare Cities
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 620, lineHeight: 1.7, marginTop: 10 }}>
                    Run a side-by-side comparative analysis of real-time pollutant concentrations, composite AQI indices, and CPCB station data across any two monitored Indian cities.
                </p>
            </div>

            {/* ── Selector Panel ── */}
            <div className="glass-panel" style={{ padding: 28, marginBottom: 32 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 16 }}>
                    Select cities to analyse
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
                    <SelectBox label="City A — Primary" value={city1} onChange={setCity1} />

                    {/* VS badge */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 40, height: 42, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(245,158,11,0.15))",
                        border: "1px solid var(--border-glass)",
                        fontWeight: 900, fontSize: "0.78rem", color: "var(--text-secondary)"
                    }}>VS</div>

                    <SelectBox label="City B — Secondary" value={city2} onChange={setCity2} />

                    <button
                        onClick={handleCompare}
                        disabled={loading || cities.length < 2}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "11px 24px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
                            fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
                            background: loading ? "rgba(59,130,246,0.4)" : "linear-gradient(135deg, #2563eb, #4f46e5)",
                            color: "#fff", boxShadow: "0 4px 14px rgba(59, 130, 246, 0.25)",
                            transition: "all 0.2s ease", height: 42
                        }}
                        onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(59,130,246,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                        {loading ? (
                            <>Analysing...</>
                        ) : (
                            <><FiArrowRight size={15} /> Run Analysis</>
                        )}
                    </button>
                </div>

                {error && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10, marginTop: 16,
                        padding: "12px 16px", borderRadius: 10,
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                        color: "#ef4444", fontSize: "0.875rem"
                    }}>
                        <FiAlertCircle size={16} />{error}
                    </div>
                )}
            </div>

            {/* ── Results ── */}
            {comparisonData && (() => {
                const d1 = comparisonData.city1;
                const d2 = comparisonData.city2;
                const chartData = buildChartData();

                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                        {/* Verdict banner */}
                        <div className="glass-panel" style={{
                            padding: "20px 28px",
                            background: "linear-gradient(to right, rgba(59,130,246,0.08), rgba(245,158,11,0.08))",
                            border: "1px solid rgba(59,130,246,0.15)",
                            display: "flex", alignItems: "center", gap: 16
                        }}>
                            <FiBarChart2 size={22} style={{ color: "var(--primary)", flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 4 }}>
                                    Analysis Verdict
                                </div>
                                <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
                                    {comparisonData.summary}
                                </p>
                            </div>
                        </div>

                        {/* City cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                            <CityResultCard cityData={d1} accentColor="#3b82f6" />
                            <CityResultCard cityData={d2} accentColor="#f59e0b" />
                        </div>

                        {/* Chart panel */}
                        <div className="glass-panel" style={{ padding: 28 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                                <div>
                                    <h3 style={{ margin: 0, marginBottom: 4 }}>Pollutant Concentration Comparison</h3>
                                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                        Multi-axis breakdown across AQI, PM2.5, PM10, NO₂, SO₂, and CO
                                    </p>
                                </div>
                                {/* Chart mode toggle */}
                                <div style={{ display: "flex", background: "var(--hover-bg)", borderRadius: 8, padding: 3, gap: 2 }}>
                                    {["bar", "radar"].map(mode => (
                                        <button key={mode} onClick={() => setChartMode(mode)} style={{
                                            padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                                            fontSize: "0.78rem", fontWeight: 700, textTransform: "capitalize",
                                            background: chartMode === mode ? "var(--primary)" : "transparent",
                                            color: chartMode === mode ? "#fff" : "var(--text-muted)",
                                            transition: "all 0.15s ease"
                                        }}>{mode}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ height: 380 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartMode === "bar" ? (
                                        <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", borderRadius: 10, color: "var(--text-primary)", fontSize: "0.85rem" }}
                                                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                                            <Bar dataKey={d1.city} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey={d2.city} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    ) : (
                                        <RadarChart data={chartData}>
                                            <PolarGrid stroke="var(--border-glass)" />
                                            <PolarAngleAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                            <Radar name={d1.city} dataKey={d1.city} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                                            <Radar name={d2.city} dataKey={d2.city} stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                                            <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
                                            <Tooltip
                                                contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", borderRadius: 10, color: "var(--text-primary)", fontSize: "0.85rem" }}
                                            />
                                        </RadarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Info strip */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
                            borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)",
                            fontSize: "0.8rem", color: "var(--text-muted)"
                        }}>
                            <FiBarChart2 size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                            All values represent rolling averages aggregated from live CPCB telemetry ingested via the OpenAQ v3 API pipeline. Data refreshes periodically.
                        </div>

                    </div>
                );
            })()}
        </div>
    );
}
