import React from "react";
import { useNavigate } from "react-router-dom";

function ProfileHeader({ user, isOwner }) {
    const navigate = useNavigate();

    return (
        <div className="profile-header">
            <h2>
                {user.role} {user.name} {user.lastname}
            </h2>

            {isOwner && (
                <button className="edit-profile-btn">
                    Edit Profile
                </button>
            )}
        </div>
    );
}

export default ProfileHeader;
