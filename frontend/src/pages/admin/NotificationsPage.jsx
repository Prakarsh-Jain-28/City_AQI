import { useState, useEffect } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from "../../api/adminApi";
import { timeAgo } from "../../utils/aqiHelpers";
import { FiBell, FiCheckCircle, FiTrash2, FiInfo, FiAlertTriangle, FiMapPin, FiCheck, FiInbox } from "react-icons/fi";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const { socket } = useSocket();
    const { user } = useAuth();

    const fetchNotifications = () => {
        const params = filter === "UNREAD" ? { isRead: false } : {};
        getNotifications(params)
            .then(res => { setNotifications(res.data.notifications || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        setLoading(true);
        fetchNotifications();
    }, [filter]);

    useEffect(() => {
        if (!socket || !user) return;
        socket.emit("joinUser", user._id);
        const handleNewNotification = (notif) => {
            setNotifications(prev => [notif, ...prev]);
        };
        socket.on("newNotification", handleNewNotification);
        return () => socket.off("newNotification", handleNewNotification);
    }, [socket, user]);

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) { console.error(err); }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) { console.error(err); }
    };

    const getIconConfig = (title = "") => {
        const t = title.toLowerCase();
        if (t.includes("alert") || t.includes("critical")) return { icon: <FiAlertTriangle size={18} />, color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
        if (t.includes("assignment") || t.includes("officer")) return { icon: <FiCheckCircle size={18} />, color: "#10b981", bg: "rgba(16,185,129,0.15)" };
        if (t.includes("hotspot")) return { icon: <FiMapPin size={18} />, color: "#f97316", bg: "rgba(249,115,22,0.15)" };
        return { icon: <FiInfo size={18} />, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" };
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const displayed = notifications;

    return (
        <div className="page-container" style={{ maxWidth: 860, margin: "0 auto" }}>

            {/* ── Page Header ── */}
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
                <div>
                    <h1 style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "2.2rem", margin: "0 0 8px 0" }}>
                        <FiBell style={{ color: "var(--primary)" }} /> Signal Inbox
                        {unreadCount > 0 && (
                            <span style={{ fontSize: "0.85rem", fontWeight: 800, background: "var(--primary)", color: "#fff", padding: "3px 12px", borderRadius: 20, letterSpacing: "0.02em" }}>
                                {unreadCount} new
                            </span>
                        )}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 600, margin: 0 }}>
                        System telemetry signals, assignment dispatches, and platform-wide advisory updates.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-outline" style={{ height: 44, padding: "0 20px", fontWeight: 600 }} onClick={handleMarkAllRead}>
                        <FiCheck size={16} /> Mark all read
                    </button>
                )}
            </div>

            {/* ── Filter Strip ── */}
            <div className="glass-panel" style={{ padding: "14px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", flexShrink: 0 }}>
                    Filter:
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    {["ALL", "UNREAD"].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            background: filter === f ? "var(--primary)" : "var(--hover-bg)",
                            color: filter === f ? "#fff" : "var(--text-secondary)",
                            border: `1px solid ${filter === f ? "var(--primary)" : "var(--border-glass)"}`,
                            padding: "7px 20px", borderRadius: 8,
                            cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                            transition: "all 0.18s ease",
                            boxShadow: filter === f ? "0 0 14px rgba(59,130,246,0.35)" : "none"
                        }}>
                            {f === "ALL" ? "All Signals" : (
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    Unread
                                    {unreadCount > 0 && (
                                        <span style={{ background: "rgba(255,255,255,0.2)", padding: "1px 7px", borderRadius: 10, fontSize: "0.75rem", fontWeight: 800 }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Notifications Feed ── */}
            {displayed.length === 0 ? (
                <div className="glass-panel" style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <FiInbox size={52} style={{ color: "var(--text-muted)", opacity: 0.25, marginBottom: 20 }} />
                    <h3 style={{ margin: "0 0 8px 0" }}>All clear</h3>
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>No {filter === "UNREAD" ? "unread " : ""}signals in your inbox.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {displayed.map(notif => {
                        const { icon, color, bg } = getIconConfig(notif.title);
                        return (
                            <div
                                key={notif._id}
                                className="glass-panel"
                                style={{
                                    padding: "18px 24px",
                                    display: "flex",
                                    gap: 18,
                                    alignItems: "center",
                                    transition: "all 0.2s ease",
                                    borderLeft: !notif.isRead ? `3px solid ${color}` : "3px solid transparent",
                                    background: !notif.isRead ? "var(--hover-bg)" : undefined,
                                    opacity: notif.isRead ? 0.75 : 1
                                }}
                            >
                                {/* Icon bubble */}
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: notif.isRead ? 500 : 700, color: notif.isRead ? "var(--text-secondary)" : "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {notif.title}
                                        </h4>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                                            {timeAgo(notif.createdAt)}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.55 }}>
                                        {notif.message}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                                    {!notif.isRead && (
                                        <button
                                            className="btn btn-sm btn-outline"
                                            style={{ padding: "6px 10px", borderColor: "rgba(16,185,129,0.35)", color: "#10b981" }}
                                            onClick={() => handleMarkRead(notif._id)}
                                            title="Mark as read"
                                        >
                                            <FiCheck size={14} />
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-sm btn-outline"
                                        style={{ padding: "6px 10px", borderColor: "rgba(239,68,68,0.25)", color: "#ef4444" }}
                                        onClick={() => handleDelete(notif._id)}
                                        title="Dismiss signal"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
