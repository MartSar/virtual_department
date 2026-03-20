import {API_URL} from "./config";

export const filterPublications = (publications, searchTerm, filters) => {
    return publications.filter(pub => {
        const matchesSearch = pub.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTopic = filters.topic === '' || pub.topic === filters.topic;
        const matchesCountry = filters.country === '' || pub.country === filters.country;
        const matchesFaculty = filters.faculty === '' || pub.faculty === filters.faculty;

        return matchesSearch && matchesTopic && matchesCountry && matchesFaculty;
    });
};

export const formatRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

export const handleLogout = (navigate) => {
    if (window.confirm('Do you really want to log out?')) {
        navigate('/');
    }
};

export const fetchPublications = async () => {
    try {
        const res = await fetch(`${API_URL}/publications`);
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
};
