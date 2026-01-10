import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../../inner_components/avatar/Avatar";

function ProfileHeader({ user, isOwner }) {
    const navigate = useNavigate();

    return (
        <div className="profile-header">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <Avatar
                    name={user.name}
                    lastname={user.lastname}
                    size={60}
                    onclick={() => {
                        console.log("Hey")
                    }}
                />
                <h2>
                    {user.role} {user.name} {user.lastname}
                </h2>
            </div>

            {isOwner && (
                <button className="edit-profile-btn">
                    Edit Profile
                </button>
            )}
        </div>
    );
}

export default ProfileHeader;
