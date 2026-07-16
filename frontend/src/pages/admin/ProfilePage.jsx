import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../api/adminApi";
import { FiUser, FiMail, FiPhone, FiMapPin, FiShield, FiSave } from "react-icons/fi";

export default function ProfilePage() {
    const { user, checkAuth } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");
        try {
            const data = { ...formData };
            if (!data.password) delete data.password;
            
            await updateProfile(data);
            await checkAuth(); // Refresh user data
            setMessage("Profile updated successfully.");
            setFormData(prev => ({ ...prev, password: "" }));
        } catch (err) {
            setError(err.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="page-container" style={{ maxWidth: 800 }}>
            <div className="page-header">
                <h1><FiUser /> My Profile</h1>
                <p style={{ color: "var(--text-secondary)" }}>Manage your account settings and personal information.</p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "1fr 2fr", gap: 24 }}>
                <div className="glass-panel" style={{ overflow: "hidden", height: "fit-content" }}>
                    <div style={{ height: 80, background: user.role === 'SUPER_ADMIN' ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}></div>
                    <div style={{ padding: "0 24px 24px", textAlign: "center", position: "relative" }}>
                        <div className="user-avatar" style={{ 
                            width: 90, height: 90, fontSize: "2.2rem", 
                            margin: "-45px auto 16px auto", 
                            background: "var(--bg-secondary)", 
                            color: "var(--text-primary)",
                            border: "4px solid var(--bg-glass)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                        }}>
                            {user.name?.charAt(0) || "U"}
                        </div>
                        <h2 style={{ margin: "0 0 8px 0", fontSize: "1.6rem", fontWeight: "700" }}>{user.name}</h2>
                        <span style={{ 
                            background: user.role === 'SUPER_ADMIN' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: user.role === 'SUPER_ADMIN' ? '#d8b4fe' : '#93c5fd', 
                            border: `1px solid ${user.role === 'SUPER_ADMIN' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                            marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700", letterSpacing: "0.5px"
                        }}>
                            <FiShield size={14} />
                            {user.role.replace('_', ' ')}
                        </span>
                        
                        <div className="glass-card" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 16, color: "var(--text-primary)", fontSize: "0.95rem", padding: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)", borderRadius: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ padding: 8, background: "rgba(59, 130, 246, 0.1)", borderRadius: 8, color: "#60a5fa" }}><FiMail /></div> 
                                <span style={{ opacity: 0.9 }}>{user.email}</span>
                            </div>
                            {user.phone && <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ padding: 8, background: "rgba(16, 185, 129, 0.1)", borderRadius: 8, color: "#34d399" }}><FiPhone /></div> 
                                <span style={{ opacity: 0.9 }}>{user.phone}</span>
                            </div>}
                            {user.city && <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ padding: 8, background: "rgba(245, 158, 11, 0.1)", borderRadius: 8, color: "#fbbf24" }}><FiMapPin /></div> 
                                <span style={{ color: "var(--text-secondary)" }}>Zone:</span> <strong style={{color:"var(--text-primary)"}}>{user.city}</strong>
                            </div>}
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 style={{ marginBottom: 24 }}>Edit Details</h3>
                    {message && <div className="alert-success" style={{ marginBottom: 16, padding: 12, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: 8 }}>{message}</div>}
                    {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label style={{ color: "var(--text-primary)", fontWeight: "600" }}>Full Name</label>
                            <input type="text" className="form-control" style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.2)" }} required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label style={{ color: "var(--text-primary)", fontWeight: "600" }}>Email Address</label>
                            <input type="email" className="form-control" style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.2)" }} required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label style={{ color: "var(--text-primary)", fontWeight: "600" }}>Phone Number</label>
                            <input type="text" className="form-control" style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.2)" }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label style={{ color: "var(--text-primary)", fontWeight: "600" }}>New Password <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(leave blank to keep current)</span></label>
                            <input type="password" className="form-control" style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.2)" }} minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32 }}>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "12px 24px", fontSize: "1rem", background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)", border: "none" }}>
                                <FiSave style={{ marginRight: 8 }} /> {loading ? "Saving Profile Updates..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
