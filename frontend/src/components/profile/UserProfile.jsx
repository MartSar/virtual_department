import React from "react";
import { useLocation, useParams } from "react-router-dom";
import ProfileHeader from "./common/ProfileHeader";
import ProfileInfo from "./common/ProfileInfo";

function UserProfile() {
    const location = useLocation();
    const { id } = useParams();

    const loggedUser = location.state?.loggedUser;

    const profileUser = loggedUser;

    if (!profileUser) {
        return <h2 style={{ textAlign: "center" }}>Profile not found</h2>;
    }

    const isOwner = loggedUser?.id === profileUser.id;

    return (
        <div className="user-profile">
            <ProfileHeader user={profileUser} isOwner={isOwner} />
            <ProfileInfo user={profileUser} />
        </div>
    );
}

export default UserProfile;
