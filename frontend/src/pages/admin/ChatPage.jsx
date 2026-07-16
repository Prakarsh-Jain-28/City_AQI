import { useState, useEffect, useRef } from "react";
import { getContacts, getMessages, sendMessage, markMessagesAsRead } from "../../api/messagesApi";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { FiSend, FiSearch, FiMessageSquare } from "react-icons/fi";

export default function ChatPage() {
    const { user } = useAuth();
    const { socket } = useSocket() || {};
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => { fetchContacts(); }, []);

    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (message) => {
            if (selectedContact && (message.sender === selectedContact._id || message.receiver === selectedContact._id)) {
                setMessages((prev) => [...prev, message]);
                if (message.sender === selectedContact._id) {
                    markMessagesAsRead(selectedContact._id);
                }
            } else {
                fetchContacts();
            }
        };
        socket.on("newMessage", handleNewMessage);
        return () => socket.off("newMessage", handleNewMessage);
    }, [socket, selectedContact]);

    useEffect(() => {
        if (selectedContact) {
            fetchMessages(selectedContact._id);
            markMessagesAsRead(selectedContact._id).then(() => fetchContacts());
        }
    }, [selectedContact]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchContacts = async () => {
        try {
            const res = await getContacts();
            if (res.data.success) setContacts(res.data.contacts);
        } catch (err) {
            console.error("Failed to fetch contacts", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (contactId) => {
        try {
            const res = await getMessages(contactId);
            if (res.data.success) setMessages(res.data.messages);
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        const tempMessage = {
            _id: Date.now().toString(),
            sender: user._id,
            receiver: selectedContact._id,
            content: newMessage,
            createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage("");

        try {
            const res = await sendMessage({ receiverId: selectedContact._id, content: tempMessage.content });
            if (res.data.success) {
                setMessages((prev) => prev.map(m => m._id === tempMessage._id ? res.data.message : m));
                fetchContacts();
            }
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    const visibleContacts = user?.role === "OFFICER"
        ? contacts.filter(c => c.role === "SUPER_ADMIN" || c.city === user.city)
        : contacts;

    const filteredContacts = visibleContacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getRoleLabel = (contact) =>
        contact.role === "SUPER_ADMIN" ? "System Administrator" : `Field Officer · ${contact.city}`;

    const getInitials = (name = "") => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const totalUnread = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", padding: "24px 32px 24px", gap: 0 }}>
            
            {/* ── Page Header ── */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "2rem", margin: "0 0 6px 0" }}>
                    <FiMessageSquare style={{ color: "var(--primary)" }} /> Secure Comms
                    {totalUnread > 0 && (
                        <span style={{ fontSize: "0.8rem", fontWeight: 800, background: "var(--primary)", color: "#fff", padding: "3px 10px", borderRadius: 20 }}>
                            {totalUnread} unread
                        </span>
                    )}
                </h1>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95rem" }}>
                    Encrypted real-time messaging between officials and field officers.
                </p>
            </div>

            {/* ── Chat Shell ── */}
            <div className="glass-panel" style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, border: "1px solid var(--border-glass)" }}>

                {/* ── Sidebar: Contact List ── */}
                <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--border-glass)", display: "flex", flexDirection: "column" }}>
                    
                    {/* Search */}
                    <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border-glass)" }}>
                        <div style={{ position: "relative" }}>
                            <FiSearch size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input
                                type="text"
                                placeholder="Search officials..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: "100%", boxSizing: "border-box",
                                    paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                                    background: "var(--hover-bg)", border: "1px solid var(--border-glass)",
                                    borderRadius: 10, color: "var(--text-primary)", fontSize: "0.875rem",
                                    outline: "none"
                                }}
                            />
                        </div>
                    </div>

                    {/* Contacts */}
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {filteredContacts.length === 0 ? (
                            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>No officials found.</div>
                        ) : filteredContacts.map(contact => {
                            const isActive = selectedContact?._id === contact._id;
                            return (
                                <div
                                    key={contact._id}
                                    onClick={() => setSelectedContact(contact)}
                                    style={{
                                        padding: "14px 16px",
                                        borderBottom: "1px solid var(--border-glass)",
                                        cursor: "pointer",
                                        background: isActive ? "rgba(59,130,246,0.08)" : "transparent",
                                        borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                                        transition: "all 0.15s ease",
                                        display: "flex",
                                        gap: 12,
                                        alignItems: "center"
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                        background: isActive ? "var(--primary)" : "rgba(59,130,246,0.15)",
                                        color: isActive ? "#fff" : "var(--primary)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontWeight: 800, fontSize: "0.8rem"
                                    }}>
                                        {getInitials(contact.name)}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                            <span style={{ fontWeight: contact.unreadCount > 0 ? 700 : 500, fontSize: "0.9rem", color: isActive ? "var(--primary)" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                                                {contact.name}
                                            </span>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                {contact.lastMessageTime && (
                                                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", flexShrink: 0 }}>
                                                        {new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                )}
                                                {contact.unreadCount > 0 && (
                                                    <span style={{ background: "var(--primary)", color: "#fff", fontSize: "0.65rem", fontWeight: 900, minWidth: 18, height: 18, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                                                        {contact.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {contact.lastMessage || getRoleLabel(contact)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Main Chat Area ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                    {selectedContact ? (
                        <>
                            {/* Chat Header */}
                            <div style={{
                                padding: "14px 24px",
                                borderBottom: "1px solid var(--border-glass)",
                                background: "var(--hover-bg)",
                                display: "flex", alignItems: "center", gap: 14
                            }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                    background: "var(--primary)", color: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 800, fontSize: "0.85rem"
                                }}>
                                    {getInitials(selectedContact.name)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{selectedContact.name}</h3>
                                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                        {getRoleLabel(selectedContact)}
                                    </span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                                {messages.length === 0 ? (
                                    <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
                                        <FiMessageSquare size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                                        <p style={{ margin: 0, fontSize: "0.9rem" }}>No messages yet. Start the conversation.</p>
                                    </div>
                                ) : messages.map((msg, index) => {
                                    const isMe = msg.sender === user._id;
                                    return (
                                        <div key={msg._id || index} style={{
                                            alignSelf: isMe ? "flex-end" : "flex-start",
                                            maxWidth: "68%",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 4
                                        }}>
                                            <div style={{
                                                background: isMe
                                                    ? "var(--primary)"
                                                    : "var(--hover-bg)",
                                                color: isMe ? "#fff" : "var(--text-primary)",
                                                padding: "11px 16px",
                                                borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                fontSize: "0.9rem",
                                                lineHeight: 1.5,
                                                border: isMe ? "none" : "1px solid var(--border-glass)",
                                                boxShadow: isMe ? "0 4px 16px rgba(59,130,246,0.25)" : "none"
                                            }}>
                                                {msg.content}
                                            </div>
                                            <span style={{
                                                fontSize: "0.68rem",
                                                color: "var(--text-muted)",
                                                alignSelf: isMe ? "flex-end" : "flex-start",
                                                letterSpacing: "0.02em"
                                            }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-glass)", background: "var(--hover-bg)" }}>
                                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    <input
                                        type="text"
                                        placeholder={`Message ${selectedContact.name}...`}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: "12px 20px",
                                            background: "var(--card-bg)",
                                            border: "1px solid var(--border-glass)",
                                            borderRadius: 24,
                                            color: "var(--text-primary)",
                                            fontSize: "0.9rem",
                                            outline: "none",
                                            transition: "border-color 0.2s"
                                        }}
                                        onFocus={e => e.target.style.borderColor = "var(--primary)"}
                                        onBlur={e => e.target.style.borderColor = "var(--border-glass)"}
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={!newMessage.trim()}
                                        style={{
                                            width: 46, height: 46, borderRadius: "50%",
                                            padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                                        }}
                                    >
                                        <FiSend size={18} style={{ transform: "translateX(-1px)" }} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                            <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(59,130,246,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                <FiMessageSquare size={36} style={{ color: "var(--primary)", opacity: 0.4 }} />
                            </div>
                            <h2 style={{ margin: "0 0 8px 0", fontWeight: 700 }}>Select a conversation</h2>
                            <p style={{ margin: 0, fontSize: "0.9rem" }}>Choose an official from the sidebar to begin secure comms.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
