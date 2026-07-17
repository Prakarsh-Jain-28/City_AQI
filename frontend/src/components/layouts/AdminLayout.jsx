import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    FiGrid, FiActivity, FiRadio, FiTrendingUp, FiAlertTriangle,
    FiClipboard, FiBell, FiFileText, FiUsers, FiSettings,
    FiUser, FiLogOut, FiMapPin, FiMenu, FiX, FiMessageSquare,
    FiSun, FiMoon
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";

const sidebarLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <FiGrid /> },
    { path: "/admin/monitoring", label: "Monitoring & Predictions", icon: <FiActivity /> },
    { path: "/admin/stations", label: "Stations", icon: <FiRadio /> },
    { path: "/admin/hotspots", label: "Hotspots", icon: <FiMapPin /> },
    { path: "/admin/assignments", label: "Assignments", icon: <FiClipboard /> },
    { path: "/admin/alerts", label: "Alerts", icon: <FiAlertTriangle /> },
    { path: "/admin/notifications", label: "Notifications", icon: <FiBell /> },
    { path: "/admin/chat", label: "Messages", icon: <FiMessageSquare /> },
    { path: "/admin/reports", label: "Reports", icon: <FiFileText /> },
    { path: "/admin/officials", label: "Officials", icon: <FiUsers /> },
    { path: "/admin/settings", label: "Settings", icon: <FiSettings /> },
    { path: "/admin/profile", label: "Profile", icon: <FiUser /> },
];

const getVisibleLinks = (user) => {
    if (!user) return [];
    if (user.role === "OFFICER") {
        return sidebarLinks.filter(link => 
            link.path !== "/admin/stations" && 
            link.path !== "/admin/settings" &&
            link.path !== "/admin/monitoring"
        );
    }
    return sidebarLinks;
};

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const { socket, connected } = useSocket() || {};
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        if (connected && socket && user) {
            socket.emit("joinUser", user._id);
            if (user.city) {
                socket.emit("joinCity", user.city);
            }
            if (user.role === "SUPER_ADMIN") {
                socket.emit("joinAdmin");
            }
        }
    }, [connected, socket, user]);

    const handleLogout = async () => {
        await logout();
        navigate("/admin/login");
    };

    return (
        <div className="admin-layout">
            {/* Ambient glow blobs — bleed through admin glassmorphic panels */}
            <div className="glow-layer">
                <div className="glow-blob glow-blob-1" />
                <div className="glow-blob glow-blob-2" />
                <div className="glow-blob glow-blob-3" />
            </div>

            <aside className={`admin-sidebar glass-panel ${collapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    <div className="logo-badge" style={{ fontSize: collapsed ? "0.8rem" : "1rem" }}>
                        {collapsed ? "AQ" : "CityAQI"}
                    </div>
                    <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <FiMenu size={18} /> : <FiX size={18} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {getVisibleLinks(user).map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`sidebar-link ${location.pathname === link.path ? "active" : ""}`}
                            title={collapsed ? link.label : ""}
                        >
                            <span className="sidebar-icon">{link.icon}</span>
                            {!collapsed && <span>{link.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-link logout-btn" onClick={handleLogout}>
                        <span className="sidebar-icon"><FiLogOut /></span>
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-header glass-panel">
                    <div>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                            {getVisibleLinks(user).find(l => l.path === location.pathname)?.label || "Admin"}
                        </h2>
                    </div>
                    <div className="header-user-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="theme-toggle-btn" onClick={toggleTheme} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}>
                            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                {user?.name || "Admin"}
                            </span>
                            <div className="user-avatar">
                                {user?.name?.charAt(0) || "A"}
                            </div>
                        </div>
                    </div>
                </header>
                <div className="admin-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
