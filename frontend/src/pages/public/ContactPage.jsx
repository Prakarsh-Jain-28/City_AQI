import { FiMail, FiMapPin, FiPhone, FiSend, FiClock, FiExternalLink } from "react-icons/fi";

const ContactInfoRow = ({ icon, title, lines }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
        <div style={{
            background: "rgba(59, 130, 246, 0.12)",
            padding: 12,
            borderRadius: "50%",
            color: "var(--primary)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            {icon}
        </div>
        <div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)" }}>{title}</h4>
            {lines.map((line, i) => (
                <p key={i} style={{ margin: "0 0 4px 0", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{line}</p>
            ))}
        </div>
    </div>
);

export default function ContactPage() {
    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Message sent successfully! (Demo only)");
    };

    return (
        <div className="page-container">

            {/* ── Page Header ── */}
            <div className="page-header" style={{ marginBottom: 56 }}>
                <h1>Contact Us</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 680, lineHeight: 1.7, marginTop: 12 }}>
                    Have inquiries regarding our predictive intelligence stack, institutional API keys, or municipal deployment frameworks? Connect directly with our core engineering and government relations divisions.
                </p>
            </div>

            {/* ── Two-Column Grid ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.6fr)",
                gap: 32,
                alignItems: "start"
            }}>

                {/* ── LEFT: Get in Touch ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div className="glass-panel" style={{ padding: 28 }}>
                        <h3 style={{ marginBottom: 8, fontSize: "1.1rem" }}>Get in Touch</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 28, lineHeight: 1.6 }}>
                            Our engineering and government relations teams are available on business days from 09:00 – 18:00 IST.
                        </p>

                        <ContactInfoRow
                            icon={<FiMapPin size={20} />}
                            title="Headquarters"
                            lines={[
                                "Smart City Innovation Hub",
                                "Department of Urban Planning & Infrastructure Tech",
                                "New Delhi, India — 110001"
                            ]}
                        />
                        <ContactInfoRow
                            icon={<FiMail size={20} />}
                            title="Email"
                            lines={[
                                "General & API Support: support@cityaqi.in",
                                "Municipal Partnerships: gov.relations@cityaqi.in"
                            ]}
                        />
                        <ContactInfoRow
                            icon={<FiPhone size={20} />}
                            title="Phone"
                            lines={[
                                "Central Incident Desk: 1800-11-AQI (Toll Free)",
                                "Global Integrations Desk: +91 11 2345 6789"
                            ]}
                        />
                        <ContactInfoRow
                            icon={<FiClock size={20} />}
                            title="Response SLA"
                            lines={[
                                "Technical Queries: within 4 business hours",
                                "Statutory / Gov. Requests: within 1 business day"
                            ]}
                        />
                    </div>

                    {/* Quick Links card */}
                    <div className="glass-panel" style={{ padding: 24, background: "rgba(59, 130, 246, 0.07)" }}>
                        <h4 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: "0.95rem" }}>
                            <FiExternalLink size={16} style={{ color: "var(--primary)" }} />
                            Quick Resources
                        </h4>
                        {[
                            { label: "API Documentation", href: "#" },
                            { label: "Data Licensing Terms", href: "#" },
                            { label: "Municipal Onboarding Guide", href: "#" },
                            { label: "System Status Dashboard", href: "#" },
                        ].map(link => (
                            <a
                                key={link.label}
                                href={link.href}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 0",
                                    borderBottom: "1px solid var(--border-glass)",
                                    color: "var(--primary)",
                                    fontSize: "0.875rem",
                                    textDecoration: "none",
                                    transition: "opacity 0.15s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
                                onMouseLeave={e => e.currentTarget.style.opacity = 1}
                            >
                                {link.label}
                                <FiExternalLink size={13} style={{ flexShrink: 0 }} />
                            </a>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT: Send a Message ── */}
                <div className="glass-panel" style={{ padding: 32 }}>
                    <h3 style={{ marginBottom: 6, fontSize: "1.1rem" }}>Send a Message</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 28, lineHeight: 1.6 }}>
                        Fill in the form below and our team will route your request to the appropriate division within our committed SLA windows.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                        {/* Name row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="contact-label">First Name</label>
                                <input type="text" className="contact-input" placeholder="e.g. Arjun" required />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="contact-label">Last Name</label>
                                <input type="text" className="contact-input" placeholder="e.g. Sharma" required />
                            </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="contact-label">Official Email Address</label>
                            <input type="email" className="contact-input" placeholder="you@organisation.gov.in" required />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="contact-label">Organisation / Department</label>
                            <input type="text" className="contact-input" placeholder="e.g. Ministry of Environment, Forest & Climate Change" />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="contact-label">Inquiry Category</label>
                            <select className="contact-input" required>
                                <option value="">Select an inquiry type...</option>
                                <option value="api">Institutional API Access & Rate Limits</option>
                                <option value="gov">Municipal / Government Partnership</option>
                                <option value="support">Technical Support & Bug Reports</option>
                                <option value="ml">AI Model Methodology & Explainability</option>
                                <option value="data">Data Licensing & Attribution</option>
                                <option value="general">General Inquiry</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="contact-label">Message</label>
                            <textarea
                                className="contact-input"
                                rows={5}
                                placeholder="Describe your inquiry in detail. For technical issues, please include your city name, relevant station IDs, and the approximate timestamp of the anomaly."
                                required
                                style={{ resize: "vertical", minHeight: 120 }}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                width: "100%",
                                padding: "14px 24px",
                                borderRadius: 12,
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.95rem",
                                background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                                color: "#fff",
                                boxShadow: "0 4px 15px rgba(59, 130, 246, 0.25)",
                                transition: "all 0.2s ease",
                                marginTop: 4,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.35)";
                                e.currentTarget.style.transform = "translateY(-1px) scale(1.01)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.25)";
                                e.currentTarget.style.transform = "translateY(0) scale(1)";
                            }}
                        >
                            <FiSend size={16} />
                            Dispatch Message
                        </button>

                        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                            By submitting, you agree to our data handling policy. All submissions are encrypted in transit.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
