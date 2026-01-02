import React from "react";

function ProfileInfo({ user }) {
    return (
        <div className="profile-info">
            <h3>Profile Information</h3>

            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Last name:</strong> {user.lastname}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>User ID:</strong> {user.id}</p>
        </div>
    );
}

export default ProfileInfo;
