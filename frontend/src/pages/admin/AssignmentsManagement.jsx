import { useState, useEffect } from "react";
import { getAssignments, updateAssignment, deleteAssignment } from "../../api/adminApi";
import { getSeverityColor, getStatusColor, formatDateTime } from "../../utils/aqiHelpers";
import { FiClipboard, FiCheckCircle, FiTrash2, FiPlayCircle, FiFileText, FiUser, FiActivity } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function AssignmentsManagement() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const [completingAssignmentId, setCompletingAssignmentId] = useState(null);
    const { user } = useAuth();

    const fetchAssignments = () => {
        getAssignments()
            .then(res => { setAssignments(res.data.assignments || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchAssignments(); }, []);

    const handleUpdateStatus = async (id, status, summary = null) => {
        try {
            await updateAssignment(id, { status, ...(summary && { summary }) });
            fetchAssignments();
            if (showSummaryModal) setShowSummaryModal(false);
        } catch (err) {
            alert("Update failed");
        }
    };

    const handleCompleteClick = (id) => {
        setCompletingAssignmentId(id);
        setSummaryText("");
        setShowSummaryModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Permanently delete this dispatch record?")) {
            try {
                await deleteAssignment(id);
                fetchAssignments();
            } catch (err) {
                alert("Delete failed");
            }
        }
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    return (
        <div className="page-container" style={{ maxWidth: 1400, margin: "0 auto" }}>
            
            {/* ── Page Header ── */}
            <div className="page-header" style={{ marginBottom: 32 }}>
                <h1 style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "2.2rem", margin: "0 0 8px 0" }}>
                    <FiClipboard style={{ color: "var(--primary)" }} /> Field Operations
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 650, margin: 0 }}>
                    Track dispatched ground officers, review intervention timelines, and verify field mitigation summaries.
                </p>
            </div>

            {/* ── Assignments Table ── */}
            <div className="glass-panel" style={{ padding: 28 }}>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Target Region / Hotspot</th>
                                <th>Dispatched Officer</th>
                                <th>SLA Priority</th>
                                <th>Current Status</th>
                                <th>Intervention Timeline</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.filter(a => user?.role === "SUPER_ADMIN" || a.officer?._id === user?._id).map(a => (
                                <tr key={a._id}>
                                    <td>
                                        <strong style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>{a.hotspotId?.name || "Unknown Region"}</strong><br/>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>{a.hotspotId?.location}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ 
                                                width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.15)", color: "var(--primary)",
                                                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0
                                            }}>
                                                {a.officer?.name?.charAt(0) || <FiUser size={14} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>{a.officer?.name || "Unassigned"}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.02em" }}>{a.officer?.phone || "No Contact"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", background: `${getSeverityColor(a.priority)}15`, color: getSeverityColor(a.priority), border: `1px solid ${getSeverityColor(a.priority)}30` }}>
                                            {a.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", background: `${getStatusColor(a.status)}15`, color: getStatusColor(a.status), border: `1px solid ${getStatusColor(a.status)}30` }}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                            <span style={{ color: "var(--text-muted)", width: 50 }}>Issued:</span> 
                                            <span style={{ color: "var(--text-primary)" }}>{formatDateTime(a.createdAt)}</span>
                                        </div>
                                        {a.completedAt && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                                <span style={{ color: "var(--text-muted)", width: 50 }}>Closed:</span> 
                                                <span style={{ color: "#10b981", fontWeight: 600 }}>{formatDateTime(a.completedAt)}</span>
                                            </div>
                                        )}
                                        {a.summary && (
                                            <div style={{ 
                                                marginTop: 8, color: "var(--text-secondary)", background: "var(--hover-bg)", 
                                                padding: "6px 10px", borderRadius: 6, borderLeft: "2px solid var(--primary)",
                                                fontSize: "0.75rem", lineHeight: 1.5, display: "flex", gap: 6, alignItems: "flex-start"
                                            }}>
                                                <FiFileText size={12} style={{ flexShrink: 0, marginTop: 2, color: "var(--primary)" }} />
                                                <span>{a.summary}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: "right", verticalAlign: "middle" }}>
                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", width: 120, marginLeft: "auto" }}>
                                            {a.status === "PENDING" && (
                                                <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(59, 130, 246, 0.4)", color: "#3b82f6", padding: "6px 12px", width: "100%", justifyContent: "center" }} onClick={() => handleUpdateStatus(a._id, "IN_PROGRESS")} title="Start Work">
                                                    <FiPlayCircle size={14} /> Initiate Op
                                                </button>
                                            )}
                                            {a.status === "IN_PROGRESS" && (
                                                <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(16, 185, 129, 0.4)", color: "#10b981", padding: "6px 12px", width: "100%", justifyContent: "center" }} onClick={() => handleCompleteClick(a._id)} title="Mark Completed">
                                                    <FiCheckCircle size={14} /> Submit Report
                                                </button>
                                            )}
                                            {a.status === "PENDING_VERIFICATION" && user?.role === "SUPER_ADMIN" && (
                                                <button className="btn btn-sm btn-primary" style={{ padding: "6px 12px", width: "100%", justifyContent: "center" }} onClick={() => handleUpdateStatus(a._id, "COMPLETED")} title="Verify">
                                                    <FiCheckCircle size={14} /> Verify Log
                                                </button>
                                            )}
                                            {user?.role === "SUPER_ADMIN" && (
                                                <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "6px 10px", width: "100%", justifyContent: "center" }} onClick={() => handleDelete(a._id)}>
                                                    <FiTrash2 size={14} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Submit Summary Modal ── */}
            {showSummaryModal && (
                <div className="modal-overlay" style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <div className="modal-content glass-panel" style={{ maxWidth: 550, padding: 0, overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                        
                        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--hover-bg)" }}>
                            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, fontSize: "1.4rem" }}>
                                <FiActivity style={{ color: "#10b981" }} /> Submit Field Report
                            </h2>
                            <button onClick={() => setShowSummaryModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.5rem", padding: 4 }}>×</button>
                        </div>

                        <div style={{ padding: 32 }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8, display: "block" }}>Mitigation Actions Summary</label>
                                <textarea 
                                    className="contact-input" 
                                    rows="5" 
                                    required 
                                    value={summaryText} 
                                    onChange={(e) => setSummaryText(e.target.value)} 
                                    placeholder="Briefly detail the intervention actions taken at the hotspot (e.g., 'Halted construction site dust generation, issued warnings')..." 
                                    style={{ resize: "vertical", paddingTop: 12, lineHeight: 1.6 }}
                                />
                            </div>
                            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <button className="btn btn-outline" style={{ height: 44, padding: "0 20px" }} onClick={() => setShowSummaryModal(false)}>Cancel</button>
                                <button className="btn btn-primary" style={{ height: 44, padding: "0 28px", background: "#10b981", color: "#000", border: "none" }} onClick={() => handleUpdateStatus(completingAssignmentId, "PENDING_VERIFICATION", summaryText)} disabled={!summaryText.trim()}>
                                    Submit for Verification
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
