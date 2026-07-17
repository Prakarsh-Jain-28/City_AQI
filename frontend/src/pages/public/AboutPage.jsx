import {
    FiInfo, FiShield, FiCpu, FiGlobe, FiDatabase,
    FiUsers, FiActivity, FiAward, FiZap, FiBarChart2,
    FiCheckCircle, FiLayers, FiServer
} from "react-icons/fi";

/* ── Reusable Components ── */

const StatCard = ({ value, label, sub }) => (
    <div className="glass-panel" style={{ padding: "20px 24px", textAlign: "center" }}>
        <div style={{
            fontSize: "2rem", fontWeight: 900,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.1, marginBottom: 6
        }}>{value}</div>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sub}</div>}
    </div>
);

const TechCard = ({ icon, title, tags, body }) => (
    <div className="glass-panel" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
                background: "rgba(59, 130, 246, 0.12)", color: "var(--primary)",
                padding: 10, borderRadius: 10, display: "flex"
            }}>{icon}</div>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>{title}</h3>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.map(t => (
                <span key={t} style={{
                    padding: "3px 10px", borderRadius: 20,
                    fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em",
                    background: "rgba(59, 130, 246, 0.1)", color: "var(--primary)",
                    border: "1px solid rgba(59, 130, 246, 0.2)"
                }}>{t}</span>
            ))}
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>{body}</p>
    </div>
);

const CheckItem = ({ text }) => (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
        <FiCheckCircle size={17} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 3 }} />
        <span>{text}</span>
    </li>
);

/* ── Page ── */

export default function AboutPage() {
    return (
        <div className="page-container">

            {/* ── Hero Header ── */}
            <div className="page-header" style={{ textAlign: "center", marginBottom: 56 }}>
                <div className="logo-badge" style={{ margin: "0 auto 20px auto", fontSize: "1.5rem", padding: "12px 28px" }}>CityAQI</div>
                <h1>About The Platform</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 640, margin: "14px auto 0", lineHeight: 1.75 }}>
                    An AI-Powered Urban Air Quality Intelligence Platform engineered for proactive smart city intervention — purpose-built for the ET AI Hackathon 2026.
                </p>
            </div>

            {/* ── Stats Strip ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
                <StatCard value="900+" label="CPCB Monitoring Stations" sub="Across 10 major metros" />
                <StatCard value="3" label="AI / ML Model Layers" sub="XGBoost · K-Means · IsoForest" />
                <StatCard value="72h" label="Forecast Horizon" sub="Multi-step temporal predictions" />
                <StatCard value="&lt;1s" label="Alert Dispatch Latency" sub="via Socket.IO WebSockets" />
            </div>

            {/* ── Problem ── */}
            <div className="glass-panel" style={{ padding: 32, marginBottom: 28 }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <FiInfo style={{ color: "var(--primary)", flexShrink: 0 }} />
                    The Problem
                </h2>
                <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--text-secondary)", marginBottom: 20 }}>
                    India operates over <strong>900 continuous ambient air quality monitoring (CAAQM) stations</strong>, generating terabytes of telemetry daily. Yet, a landmark CAG audit revealed that fewer than <strong>31% of municipalities</strong> with monitoring infrastructure have any formalised response or escalation protocol linked to that data. The intelligence gap between raw sensor readings and coordinated civic action is immense — costing public health, regulatory compliance, and emergency response efficiency.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                        "Siloed data with no cross-city aggregation or comparison layer",
                        "No automated anomaly detection to distinguish faulty sensors from genuine pollution spikes",
                        "Field officers receive alerts via manual phone calls, not structured digital dispatches",
                        "Citizens have no reliable, health-contextualised AQI forecast beyond 24 hours",
                    ].map(t => <CheckItem key={t} text={t} />)}
                </div>
            </div>

            {/* ── Solution ── */}
            <div className="glass-panel" style={{ padding: 32, marginBottom: 40 }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <FiShield style={{ color: "var(--primary)", flexShrink: 0 }} />
                    Our Solution
                </h2>
                <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--text-secondary)", marginBottom: 20 }}>
                    CityAQI is a <strong>full-stack, dual-interface intelligence platform</strong> that bridges the gap between raw CPCB telemetry and actionable, real-time city intervention. By coupling a citizen-facing transparency portal with a secure administrative command centre, CityAQI enables simultaneous bottom-up awareness and top-down operational response.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ background: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: 12, padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <FiUsers size={16} style={{ color: "var(--primary)" }} />
                            <strong style={{ fontSize: "0.9rem" }}>Citizen Portal</strong>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                            {[
                                "Live AQI heatmaps with pollutant breakdowns",
                                "72-hour ML-driven forecasts with confidence bands",
                                "WHO-aligned health advisories by AQI band",
                                "Side-by-side multi-city comparison engine",
                            ].map(t => <CheckItem key={t} text={t} />)}
                        </ul>
                    </div>
                    <div style={{ background: "rgba(139, 92, 246, 0.06)", border: "1px solid rgba(139, 92, 246, 0.15)", borderRadius: 12, padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <FiActivity size={16} style={{ color: "#8b5cf6" }} />
                            <strong style={{ fontSize: "0.9rem" }}>Admin Command Centre</strong>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                            {[
                                "ML-flagged pollution hotspot detection & triage",
                                "Automated field officer task assignment workflows",
                                "Statutory alert broadcasting & escalation chains",
                                "Station health monitoring & anomaly isolation",
                            ].map(t => <CheckItem key={t} text={t} />)}
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── Core Tech Section Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>Core Technology Stack</h2>
                <span style={{
                    padding: "5px 14px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700,
                    background: "rgba(59, 130, 246, 0.1)", color: "var(--primary)",
                    border: "1px solid rgba(59, 130, 246, 0.2)"
                }}>3 Integrated ML Layers</span>
            </div>

            {/* ── Tech Cards Grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <TechCard
                    icon={<FiCpu size={20} />}
                    title="Advanced Predictive AI Engines"
                    tags={["XGBoost", "K-Means", "Isolation Forest", "Scikit-learn"]}
                    body="CityAQI completely bypasses generic statistical averages. The forecasting core relies on custom-trained XGBoost regressor models engineered for multi-horizon temporal predictions, alongside unsupervised K-Means clustering to handle hyper-localised emission source attributions. Isolation Forests process inbound station logs to automatically detect, isolate, and flag hardware telemetry anomalies — distinguishing genuine pollution spikes from sensor drift."
                />
                <TechCard
                    icon={<FiGlobe size={20} />}
                    title="High-Throughput Real-Time Architecture"
                    tags={["Socket.IO", "Node.js", "Express", "MongoDB"]}
                    body="Engineered atop an enterprise-grade MERN framework, our backend utilises highly optimised non-blocking event loops for concurrent request handling. Persistent full-duplex WebSocket (Socket.IO) connections form the streaming backbone, ensuring that hotspot triggers, statutory ambient threshold breaches, and field officer task allocations are dispatched and rendered across client dashboards with verified sub-second latency."
                />
                <TechCard
                    icon={<FiDatabase size={20} />}
                    title="Verifiable Data Engineering"
                    tags={["OpenAQ v3 API", "CPCB", "ETL Pipelines", "Data Sanitisation"]}
                    body="Our data architecture initiates high-frequency polling pipelines, ingestions, and sanitisation loops sourcing genuine historical and live datasets directly from the OpenAQ v3 API. All metrics dynamically mirror actual real-time telemetry from CPCB stations across India. Upstream anomaly filters remove sensor-drift outliers and missing-value artifacts before data reaches any model input or dashboard endpoint."
                />
                <TechCard
                    icon={<FiBarChart2 size={20} />}
                    title="Scalable Analytics & Reporting Layer"
                    tags={["Recharts", "React", "REST API", "CSV Export"]}
                    body="The analytics layer aggregates multi-dimensional pollutant metrics (PM2.5, PM10, NO₂, SO₂, CO, O₃) across cities, stations, and time ranges. Interactive Recharts visualisations render responsive trend lines, forecast confidence intervals, and comparative bar charts. Admin users can export station-level datasets as structured CSV reports for statutory submissions and regulatory audits."
                />
            </div>

            {/* ── Hackathon Banner ── */}
            <div className="glass-panel" style={{
                padding: "28px 32px",
                marginBottom: 16,
                background: "rgba(59, 130, 246, 0.07)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
                flexWrap: "wrap"
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <FiAward size={20} style={{ color: "#f59e0b" }} />
                        <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Hackathon Submission</span>
                    </div>
                    <div style={{
                        fontSize: "1.6rem", fontWeight: 900,
                        background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        marginBottom: 6
                    }}>ET AI Hackathon 2026</div>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        CityAQI is a competitive submission demonstrating end-to-end AI integration — from real data ingestion through machine learning inference to production-grade civic dashboards.
                    </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                    {[
                        { icon: <FiLayers size={14} />, label: "Full-stack MERN Platform" },
                        { icon: <FiZap size={14} />, label: "3 Custom ML Models" },
                        { icon: <FiServer size={14} />, label: "Live CPCB Data Pipeline" },
                    ].map(({ icon, label }) => (
                        <div key={label} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            fontSize: "0.85rem", color: "var(--text-secondary)"
                        }}>
                            <span style={{ color: "var(--primary)" }}>{icon}</span>
                            {label}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
