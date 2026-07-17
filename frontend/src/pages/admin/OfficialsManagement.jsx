import { useState, useEffect } from "react";
import { getOfficers, createOfficer, updateOfficer, deleteOfficer } from "../../api/adminApi";
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiShield, FiMapPin } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function OfficialsManagement() {
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "OFFICER", city: "", phone: "" });
    const [editingId, setEditingId] = useState(null);
    const { user } = useAuth();
    const [selectedCity, setSelectedCity] = useState("All");

    const fetchOfficers = () => {
        getOfficers()
            .then(res => { setOfficers(res.data.officers || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchOfficers(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const data = { ...formData };
                if (!data.password) delete data.password;
                await updateOfficer(editingId, data);
            } else {
                await createOfficer(formData);
            }
            setShowModal(false);
            setFormData({ name: "", email: "", password: "", role: "OFFICER", city: "", phone: "" });
            setEditingId(null);
            fetchOfficers();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed");
        }
    };

    const handleEdit = (officer) => {
        setFormData({
            name: officer.name, email: officer.email, password: "", 
            role: officer.role, city: officer.city || "", phone: officer.phone || ""
        });
        setEditingId(officer._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (id === user._id) {
            alert("You cannot delete your own profile.");
            return;
        }
        if (window.confirm("Are you sure you want to remove this official?")) {
            try {
                await deleteOfficer(id);
                fetchOfficers();
            } catch (err) {
                alert("Delete failed");
            }
        }
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const availableCities = ["All", ...new Set(officers.map(o => o.city).filter(Boolean))];
    const filteredOfficers = officers.filter(o => {
        if (user?.role !== "SUPER_ADMIN") return o.city === user?.city;
        if (selectedCity === "All") return true;
        return o.city === selectedCity;
    });

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1><FiUsers /> Officials Directory</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage system access for ground officers and administrators.</p>
                </div>
                {user?.role === "SUPER_ADMIN" && (
                    <button className="btn btn-primary" onClick={() => { setEditingId(null); setFormData({ name: "", email: "", password: "", role: "OFFICER", city: "", phone: "" }); setShowModal(true); }}>
                        <FiPlus /> Add Official
                    </button>
                )}
            </div>

            {user?.role === "SUPER_ADMIN" && availableCities.length > 1 && (
                <div className="glass-panel" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, padding: "16px 24px", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)", fontWeight: "bold", fontSize: "1.1rem", marginRight: 8 }}>
                        <FiMapPin /> Select City:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        {availableCities.map(city => {
                            const isActive = selectedCity === city;
                            return (
                                <button
                                    key={city}
                                    onClick={() => setSelectedCity(city)}
                                    style={{
                                        background: isActive ? "var(--primary)" : "var(--hover-bg)",
                                        color: isActive ? "white" : "var(--text-secondary)",
                                        border: `1px solid ${isActive ? "var(--primary)" : "var(--border-glass)"}`,
                                        padding: "8px 20px",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        transition: "all 0.2s",
                                        boxShadow: isActive ? "0 0 15px rgba(59, 130, 246, 0.4)" : "none"
                                    }}
                                >
                                    {city}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="glass-panel" style={{ padding: 24 }}>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact Details</th>
                                <th>Role</th>
                                <th>Zone / City</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOfficers.map(o => (
                                <tr key={o._id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div className="user-avatar" style={{ width: 32, height: 32, fontSize: "0.9rem", background: o.role === 'ADMIN' ? 'linear-gradient(135deg, #a855f7, #ec4899)' : '' }}>
                                                {o.name?.charAt(0) || "U"}
                                            </div>
                                            <strong>{o.name}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: "0.9rem" }}>{o.email}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{o.phone}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${o.role === 'ADMIN' ? 'bg-purple text-purple bg-opacity-10' : 'bg-blue text-blue bg-opacity-10'}`} style={{ color: o.role === 'ADMIN' ? '#a855f7' : '#3b82f6' }}>
                                            {o.role === 'ADMIN' && <FiShield style={{ marginRight: 4, display: "inline" }} />}
                                            {o.role}
                                        </span>
                                    </td>
                                    <td>{o.city || "All Zones"}</td>
                                    <td style={{ textAlign: "right" }}>
                                        {user?.role === "SUPER_ADMIN" && (
                                            <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "4px 8px" }} onClick={() => handleDelete(o._id)} disabled={o._id === user._id}><FiTrash2 /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2>{editingId ? "Edit Official" : "Add Official"}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label>Full Name</label>
                                    <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>System Role</label>
                                    <select className="form-control" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="OFFICER">Field Officer</option>
                                        <option value="ADMIN">System Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Zone / City</label>
                                    <input type="text" className="form-control" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Required for Officers" required={formData.role === "OFFICER"} />
                                </div>
                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label>{editingId ? "Reset Password (leave blank to keep current)" : "Password"}</label>
                                    <input type="password" className="form-control" required={!editingId} minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer" style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingId ? "Update Profile" : "Create Account"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
