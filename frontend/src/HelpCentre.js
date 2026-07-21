import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HelpCentre = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(null);

    // --- Direct Email State ---
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailForm, setEmailForm] = useState({
        name: "",
        email: "",
        category: "Order Logistics",
        subject: "",
        message: ""
    });
    const [emailLoading, setEmailLoading] = useState(false);
    const [ticketReceipt, setTicketReceipt] = useState(null);

    // --- Live Concierge Chat State ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { 
            sender: "concierge", 
            text: "Welcome to the Belvedere Atelier Concierge. How may we assist your acquisition or tailoring journey today?", 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickActions: ["Track My Order", "Bespoke Fitting", "Returns & Policy"] 
        }
    ]);

    const faqData = [
        {
            category: "Acquisition & Logistics",
            icon: "📦",
            items: [
                { q: "How can I track my acquisition journey?", a: "Once your masterpiece has been finalized at the atelier, you will receive a tracking link via email. You can also view your journey status in your Profile dashboard." },
                { q: "What is White-Glove Delivery?", a: "All Batheja specimens are delivered via our global white-glove partners, ensuring your item is handled with the same care used during its creation. This includes full insurance and temperature-controlled transit where necessary." },
                { q: "Do you offer international transit?", a: "Yes, the atelier serves a global clientele. Customs and duties are calculated at checkout to ensure a frictionless border crossing for your items." }
            ]
        },
        {
            category: "The Bespoke Process",
            icon: "🧵",
            items: [
                { q: "How do I commission a unique piece?", a: "Simply click 'Bespoke Fitting' in our concierge chat or contact the master tailors directly via Direct Email. Our artisans will schedule a virtual consultation to discuss your vision and measurements." },
                { q: "What is the timeline for custom work?", a: "Bespoke commissions typically require 4-12 weeks depending on complexity and the rarity of materials requested." }
            ]
        },
        {
            category: "Returns & Exchanges",
            icon: "🔄",
            items: [
                { q: "Can I return a curated specimen?", a: "Ready-to-wear items can be returned within 14 days of receipt, provided they remain in pristine 'Vault' condition with all proprietary seals intact." },
                { q: "Are bespoke items returnable?", a: "Due to their highly personalized nature, bespoke commissions cannot be returned. We ensure your absolute satisfaction through multiple consultation stages before finalization." }
            ]
        }
    ];

    // --- Direct Email Submission Handler ---
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setEmailLoading(true);
        try {
            const res = await fetch("/api/support/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(emailForm)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Submission failed");

            setTicketReceipt(data);
        } catch (err) {
            alert(`Direct Mail Error: ${err.message}`);
        } finally {
            setEmailLoading(false);
        }
    };

    // --- Live Concierge Chat Handler ---
    const handleSendMessage = async (textToSend = null) => {
        const queryText = textToSend || chatInput;
        if (!queryText.trim()) return;

        const userMsg = {
            sender: "user",
            text: queryText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages(prev => [...prev, userMsg]);
        if (!textToSend) setChatInput("");
        setChatLoading(true);

        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "null");
            const res = await fetch("/api/support/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: queryText, user: storedUser })
            });
            const data = await res.json();

            const conciergeMsg = {
                sender: "concierge",
                text: data.reply,
                time: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                quickActions: data.quickActions || []
            };

            setChatMessages(prev => [...prev, conciergeMsg]);
        } catch (err) {
            setChatMessages(prev => [...prev, {
                sender: "concierge",
                text: "Our master concierge is temporarily offline. Please use Direct Email for urgent concerns.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    const containerStyle = {
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        padding: "120px 10% 80px",
        fontFamily: "'Inter', sans-serif",
        position: "relative"
    };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "80px" }}>
                <span style={{ color: "var(--text-accent)", fontSize: "14px", fontWeight: "900", letterSpacing: "8px", textTransform: "uppercase" }}>Concierge Services</span>
                <h1 style={{ fontSize: "62px", fontWeight: "900", margin: "20px 0", letterSpacing: "2px" }}>HELP CENTRE</h1>
                <p style={{ color: "#888", maxWidth: "600px", margin: "0 auto", fontSize: "18px", lineHeight: "1.6" }}>
                    Welcome to the heart of our support system. Whether you are tracking an acquisition or commissioning a masterpiece, our master concierges are available 24/7.
                </p>
            </div>

            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                {/* FAQ Accordions */}
                {faqData.map((section, idx) => (
                    <div key={idx} style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "12px",
                        padding: "40px",
                        marginBottom: "30px",
                        transition: "all 0.3s ease"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
                            <span style={{ fontSize: "24px" }}>{section.icon}</span>
                            <h2 style={{ fontSize: "20px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", margin: 0 }}>{section.category}</h2>
                        </div>
                        
                        {section.items.map((item, i) => (
                            <div 
                                key={i} 
                                style={{
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    padding: "25px 0",
                                    cursor: "pointer"
                                }}
                                onClick={() => setActiveSection(activeSection === `${idx}-${i}` ? null : `${idx}-${i}`)}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: activeSection === `${idx}-${i}` ? "var(--text-accent)" : "#fff" }}>{item.q}</h4>
                                    <span style={{ transform: activeSection === `${idx}-${i}` ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>↓</span>
                                </div>
                                {activeSection === `${idx}-${i}` && (
                                    <p style={{ marginTop: "20px", color: "#aaa", fontSize: "15px", lineHeight: "1.8", animation: "fadeIn 0.4s ease" }}>{item.a}</p>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {/* Interactive Contact Options */}
                <div style={{ 
                    marginTop: "80px", 
                    textAlign: "center", 
                    padding: "60px", 
                    background: "linear-gradient(to right, rgba(212,175,55,0.05), rgba(5,5,5,0.5))", 
                    border: "1px solid rgba(212,175,55,0.2)",
                    borderRadius: "16px"
                }}>
                    <h3 style={{ fontSize: "28px", fontWeight: "900", marginBottom: "15px", letterSpacing: "1px" }}>STILL REQUIRE ASSISTANCE?</h3>
                    <p style={{ color: "#888", marginBottom: "35px", fontSize: "15px" }}>Choose your preferred concierge channel for immediate resolution.</p>
                    <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button 
                            onClick={() => { setTicketReceipt(null); setIsEmailModalOpen(true); }}
                            className="shop-product-card"
                            style={{ 
                                padding: "18px 45px", 
                                background: "#fff", 
                                color: "#000", 
                                border: "none", 
                                borderRadius: "8px", 
                                fontWeight: "900", 
                                cursor: "pointer", 
                                fontSize: "12px", 
                                textTransform: "uppercase",
                                letterSpacing: "2px"
                            }}
                        >
                            ✉️ Direct Mail Concern
                        </button>
                        <button 
                            onClick={() => setIsChatOpen(true)}
                            className="shop-product-card"
                            style={{ 
                                padding: "18px 45px", 
                                background: "transparent", 
                                color: "#d4af37", 
                                border: "2px solid #d4af37", 
                                borderRadius: "8px", 
                                fontWeight: "900", 
                                cursor: "pointer", 
                                fontSize: "12px", 
                                textTransform: "uppercase",
                                letterSpacing: "2px"
                            }}
                        >
                            💬 Live Concierge Chat
                        </button>
                    </div>
                </div>
            </div>

            {/* --- DIRECT EMAIL MODAL --- */}
            {isEmailModalOpen && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)",
                    zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
                }}>
                    <div style={{
                        width: "100%", maxWidth: "600px", background: "#0c0c0c", border: "1px solid rgba(212,175,55,0.3)",
                        borderRadius: "16px", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.8)", animation: "fadeIn 0.3s"
                    }}>
                        <div style={{ padding: "25px 30px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ margin: 0, textTransform: "uppercase", letterSpacing: "2px", fontWeight: "900", color: "#d4af37", fontSize: "18px" }}>Direct Email Concern</h3>
                                <p style={{ margin: "5px 0 0", color: "#666", fontSize: "12px" }}>Logged directly to Senior Atelier Artisans</p>
                            </div>
                            <button onClick={() => setIsEmailModalOpen(false)} style={{ background: "none", border: "none", color: "#888", fontSize: "24px", cursor: "pointer" }}>×</button>
                        </div>

                        {ticketReceipt ? (
                            <div style={{ padding: "40px", textAlign: "center" }}>
                                <div style={{ fontSize: "50px", marginBottom: "20px" }}>🎟️</div>
                                <h3 style={{ fontSize: "24px", fontWeight: "900", color: "#fff", marginBottom: "10px" }}>Inquiry Logged</h3>
                                <p style={{ color: "#aaa", fontSize: "14px", lineHeight: "1.6", marginBottom: "25px" }}>{ticketReceipt.message}</p>
                                <div style={{ background: "rgba(212,175,55,0.1)", border: "1px solid #d4af37", padding: "15px", borderRadius: "8px", marginBottom: "30px" }}>
                                    <span style={{ fontSize: "11px", color: "#d4af37", fontWeight: "800", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>Expected Response</span>
                                    <span style={{ fontSize: "16px", fontWeight: "900", color: "#fff" }}>{ticketReceipt.estimatedResponse}</span>
                                </div>
                                <button 
                                    onClick={() => setIsEmailModalOpen(false)}
                                    style={{ padding: "14px 35px", background: "#d4af37", color: "#000", border: "none", borderRadius: "4px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", fontSize: "12px" }}
                                >
                                    Close Confirmation
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleEmailSubmit} style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "800", color: "#888", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Full Name</label>
                                        <input required type="text" placeholder="John Doe" value={emailForm.name} onChange={e => setEmailForm({...emailForm, name: e.target.value})} style={{ width: "100%", background: "#151515", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "6px", outline: "none" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "800", color: "#888", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Email Address</label>
                                        <input required type="email" placeholder="john@example.com" value={emailForm.email} onChange={e => setEmailForm({...emailForm, email: e.target.value})} style={{ width: "100%", background: "#151515", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "6px", outline: "none" }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: "800", color: "#888", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Concern Category</label>
                                    <select value={emailForm.category} onChange={e => setEmailForm({...emailForm, category: e.target.value})} style={{ width: "100%", background: "#151515", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "6px", outline: "none", cursor: "pointer" }}>
                                        <option value="Order Logistics">📦 Order Logistics & Tracking</option>
                                        <option value="Bespoke Tailoring">🧵 Bespoke Custom Tailoring</option>
                                        <option value="Returns & Exchange">🔄 Returns & Refund Request</option>
                                        <option value="Fabric & Product Info">💎 Fabric & Product Details</option>
                                        <option value="General Inquiry">💬 General Inquiry</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: "800", color: "#888", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Subject</label>
                                    <input required type="text" placeholder="e.g. Order Delivery Status Query" value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} style={{ width: "100%", background: "#151515", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "6px", outline: "none" }} />
                                </div>

                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: "800", color: "#888", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Detailed Concern Message</label>
                                    <textarea required rows="4" placeholder="Please describe your inquiry in detail..." value={emailForm.message} onChange={e => setEmailForm({...emailForm, message: e.target.value})} style={{ width: "100%", background: "#151515", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "6px", outline: "none", resize: "none" }} />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={emailLoading}
                                    style={{ 
                                        padding: "16px", background: "#d4af37", color: "#000", border: "none", 
                                        borderRadius: "6px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px",
                                        cursor: emailLoading ? "not-allowed" : "pointer", opacity: emailLoading ? 0.7 : 1
                                    }}
                                >
                                    {emailLoading ? "Dispatching Concern..." : "Submit Direct Concern"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* --- LIVE CONCIERGE CHAT OVERLAY --- */}
            {isChatOpen && (
                <div style={{
                    position: "fixed", bottom: "30px", right: "30px", width: "380px", height: "550px",
                    background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "16px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.9)", zIndex: 2000, display: "flex", flexDirection: "column",
                    overflow: "hidden", animation: "fadeIn 0.3s"
                }}>
                    {/* Chat Header */}
                    <div style={{ padding: "15px 20px", background: "rgba(212,175,55,0.12)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ width: "10px", height: "10px", background: "#00ff88", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 10px #00ff88" }} />
                            <div>
                                <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "900", letterSpacing: "1.5px", color: "#fff", textTransform: "uppercase" }}>Master Concierge</h4>
                                <span style={{ fontSize: "10px", color: "#d4af37", fontWeight: "700" }}>Belvedere Live Support</span>
                            </div>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer" }}>×</button>
                    </div>

                    {/* Chat Messages Log */}
                    <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }} className="no-scrollbar">
                        {chatMessages.map((msg, index) => (
                            <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                                <div style={{
                                    maxWidth: "80%", padding: "12px 16px", borderRadius: msg.sender === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                                    background: msg.sender === "user" ? "#d4af37" : "rgba(255,255,255,0.06)",
                                    color: msg.sender === "user" ? "#000" : "#fff",
                                    fontSize: "13px", lineHeight: "1.5", fontWeight: msg.sender === "user" ? "700" : "400"
                                }}>
                                    {msg.text}
                                </div>
                                <span style={{ fontSize: "9px", color: "#555", marginTop: "4px", padding: "0 4px" }}>{msg.time}</span>

                                {/* Render Interactive Quick Action Chips */}
                                {msg.quickActions && msg.quickActions.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                                        {msg.quickActions.map((action, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    if (action.includes("Orders")) navigate("/profile");
                                                    else handleSendMessage(action);
                                                }}
                                                style={{
                                                    padding: "6px 12px", background: "none", border: "1px solid rgba(212,175,55,0.4)",
                                                    color: "#d4af37", borderRadius: "12px", fontSize: "10px", fontWeight: "800",
                                                    cursor: "pointer", textTransform: "uppercase"
                                                }}
                                            >
                                                {action}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {chatLoading && (
                            <div style={{ fontSize: "11px", color: "#888", fontStyle: "italic" }}>Concierge is typing...</div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <div style={{ padding: "15px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "#050505", display: "flex", gap: "10px" }}>
                        <input
                            type="text"
                            placeholder="Ask concierge a question..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            style={{ flex: 1, background: "#111", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "6px", fontSize: "13px", outline: "none" }}
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            style={{ padding: "12px 20px", background: "#d4af37", color: "#000", border: "none", borderRadius: "6px", fontWeight: "900", cursor: "pointer", fontSize: "12px" }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpCentre;
