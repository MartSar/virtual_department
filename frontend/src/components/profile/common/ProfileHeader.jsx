import React from "react";
import { useNavigate } from "react-router-dom";

function ProfileHeader({ user, isOwner }) {
    const navigate = useNavigate();

    return (
        <div className="profile-header">
            <button
                onClick={() =>
                    navigate("/dashboard", {
                        state: {
                            role: user.role,
                            name: user.name,
                            lastname: user.lastname,
                            userId: user.id
                        }
                    })
                }
            >
                Back to Dashboard
            </button>


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
