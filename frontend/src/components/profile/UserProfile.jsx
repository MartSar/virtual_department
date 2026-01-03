import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import ProfileHeader from "./common/ProfileHeader";
import ProfileInfo from "./common/ProfileInfo";

function UserProfile() {
    const { id } = useParams();
    console.log(useParams())
    const location = useLocation();
    const [profileUser, setProfileUser] = useState(null);

    // логин пользователя передаётся через state или localStorage
    const loggedUser = location.state?.loggedUser || JSON.parse(localStorage.getItem("loggedUser"));

    useEffect(() => {
        fetch(`http://localhost:3000/users/${id}`)
            .then(res => res.json())
            .then(data => setProfileUser(data))
            .catch(err => console.error(err));
    }, [id]);

    if (!profileUser || !loggedUser) {
        return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
    }

    const isOwner = loggedUser.user_id === profileUser.id;

    return (
        <>
            <Navbar user={loggedUser} />
            <div className="user-profile">
                <ProfileHeader user={profileUser} isOwner={isOwner} />
                <ProfileInfo user={profileUser} />
            </div>
        </>
    );
}

export default UserProfile;
