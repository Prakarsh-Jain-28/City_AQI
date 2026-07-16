import { Outlet, Link, useLocation } from "react-router-dom";
import { FiWind, FiMapPin, FiBarChart2, FiLayers, FiInfo, FiMail, FiMenu, FiX, FiAlertTriangle, FiSun, FiMoon } from "react-icons/fi";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";

const navLinks = [
    { path: "/", label: "Home", icon: <FiWind /> },
    { path: "/aqi", label: "AQI", icon: <FiMapPin /> },
    { path: "/predictions", label: "Predictions", icon: <FiBarChart2 /> },
    { path: "/alerts", label: "Alerts", icon: <FiAlertTriangle /> },
    { path: "/compare", label: "Compare Cities", icon: <FiLayers /> },
    { path: "/about", label: "About", icon: <FiInfo /> },
    { path: "/contact", label: "Contact", icon: <FiMail /> },
];

export default function PublicLayout() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="public-layout">
            {/* Ambient glow blobs — bleed through glassmorphic cards */}
            <div className="glow-layer">
                <div className="glow-blob glow-blob-1" />
                <div className="glow-blob glow-blob-2" />
                <div className="glow-blob glow-blob-3" />
            </div>

            <nav className="public-nav glass-panel">
                <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
                    <div className="logo-badge">CityAQI</div>
                </Link>
                <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}
                    <button className="theme-toggle-btn" onClick={toggleTheme} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '8px', marginLeft: '12px' }}>
                        {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
                    </button>
                </div>
                <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                </button>
            </nav>
            <main className="public-main">
                <Outlet />
            </main>
            <footer className="public-footer glass-panel">
                <div className="footer-grid">
                    <div>
                        <div className="logo-badge" style={{ marginBottom: 12 }}>CityAQI</div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: 300 }}>
                            AI-Powered Urban Air Quality Intelligence Platform for Smart City Intervention.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: 12, fontSize: "0.95rem" }}>Quick Links</h4>
                        {navLinks.slice(0, 4).map((l) => (
                            <Link key={l.path} to={l.path} className="footer-link">{l.label}</Link>
                        ))}
                    </div>
                    <div>
                        <h4 style={{ marginBottom: 12, fontSize: "0.95rem" }}>Resources</h4>
                        <Link to="/about" className="footer-link">About Platform</Link>
                        <Link to="/contact" className="footer-link">Contact Us</Link>
                        <a href="/admin/login" className="footer-link">Admin Portal</a>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: 12, fontSize: "0.95rem" }}>Data Sources</h4>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>CPCB India</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>OpenAQ v3 API</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>XGBoost ML Models</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 CityAQI. AI-Powered Urban Air Quality Intelligence. Built for ET Hackathon.</p>
                </div>
            </footer>
        </div>
    );
}
