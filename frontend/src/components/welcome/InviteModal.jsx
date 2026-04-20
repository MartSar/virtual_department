import React, { useState } from "react";
import "../../styles/WelcomePage.css";

function InviteModal({ onClose }) {
    // Invite link = current origin (so it works locally and in production).
    const inviteLink =
        typeof window !== "undefined"
            ? `${window.location.origin}/register`
            : "/register";

    const [copied, setCopied] = useState(false);
    const [email, setEmail] = useState("");

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    const handleSendEmail = () => {
        if (!email) return;
        const subject = encodeURIComponent("Join me on Virtual Department");
        const body = encodeURIComponent(
            `Hi!\n\nI'd like to invite you to join Virtual Department – a platform where students, professors and postgraduates share and co-author academic publications.\n\nYou can sign up here: ${inviteLink}\n\nSee you there!`
        );
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content invite-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Invite a Colleague</h3>
                <p className="invite-modal-text">
                    Share this link with someone who should join the
                    department.
                </p>

                <div className="invite-link-row">
                    <input
                        className="invite-link-input"
                        type="text"
                        value={inviteLink}
                        readOnly
                    />
                    <button
                        className="invite-copy-btn"
                        onClick={handleCopy}
                    >
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>

                <div className="invite-divider">or send by email</div>

                <div className="invite-email-row">
                    <input
                        className="invite-email-input"
                        type="email"
                        placeholder="colleague@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                        className="invite-send-btn"
                        onClick={handleSendEmail}
                        disabled={!email}
                    >
                        Send
                    </button>
                </div>

                <div className="modal-btns invite-modal-btns">
                    <button className="modal-cancel-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InviteModal;
