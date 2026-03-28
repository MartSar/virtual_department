import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../../inner_components/avatar/Avatar";
import { FaUserGraduate, FaUserTie, FaUser, FaGraduationCap } from "react-icons/fa";

function ProfileHeader({ user }) {
    const navigate = useNavigate();

    const getRoleIcon = (role) => {
        switch (role) {
            case "student":
                return <FaUserGraduate size={24} color="#1e1e2f" />;
            case "postgraduate" || "professor":
                return <FaUserTie size={24} color="#1e1e2f" />;
        }
    };

    return (
        <div className="profile-header">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <Avatar
                    name={user.name}
                    lastname={user.lastname}
                    size={60}
                    onclick={() => console.log("Hey")}
                />
                <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {getRoleIcon(user.role)}
                    {user.name} {user.lastname}
                </h2>
            </div>
        </div>
    );
}

export default ProfileHeader;