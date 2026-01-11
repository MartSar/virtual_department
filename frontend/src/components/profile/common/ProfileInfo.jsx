import React from "react";

function ProfileInfo({ user, studentLocation, authorLocation }) {
    const location = user.role === 'student' ? studentLocation : authorLocation || {};

    return (
        <div className="profile-info">
            <h3>Profile Information</h3>

            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Last name:</strong> {user.lastname}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>User ID:</strong> {user.id}</p>

            {user.role === 'student' ? (
                <>
                    <p><strong>University:</strong> {location.university?.name || '-'}</p>
                    <p><strong>City:</strong> {location.city?.name || '-'}</p>
                    <p><strong>Country:</strong> {location.country?.name || '-'}</p>
                </>
            ) : (
                <>
                    <p><strong>Faculty:</strong> {location.faculty?.name || '-'}</p>
                    <p><strong>University:</strong> {location.university?.name || '-'}</p>
                    <p><strong>City:</strong> {location.city?.name || '-'}</p>
                    <p><strong>Country:</strong> {location.country?.name || '-'}</p>
                </>
            )}
        </div>
    );
}

export default ProfileInfo;
