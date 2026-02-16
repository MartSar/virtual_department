import React from "react";

function ProfileInfo({ user, location }) {
    const render = (value) => value || "-";

    return (
        <div className="profile-info">
            <h3>Profile Information</h3>

            <p><strong>Login:</strong> {render(user?.login)}</p>
            <p><strong>Name:</strong> {render(user?.name)}</p>
            <p><strong>Last name:</strong> {render(user?.lastname)}</p>
            <p><strong>Role:</strong> {render(user?.role)}</p>
            <p><strong>User ID:</strong> {render(user?.id)}</p>

            <p><strong>Faculty:</strong> {render(location?.faculty?.name)}</p>
            <p><strong>University:</strong> {render(location?.university?.name)}</p>
            <p><strong>City:</strong> {render(location?.city?.name)}</p>
            <p><strong>Country:</strong> {render(location?.country?.name)}</p>
        </div>
    );
}

export default ProfileInfo;
