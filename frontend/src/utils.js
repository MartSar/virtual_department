export const filterPublications = (publications, searchTerm, filters) => {
    return publications.filter(pub => {
        const matchesSearch = pub.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTopic = filters.topic === '' || pub.topic === filters.topic;
        const matchesCountry = filters.country === '' || pub.country === filters.country;
        const matchesFaculty = filters.faculty === '' || pub.faculty === filters.faculty;

        return matchesSearch && matchesTopic && matchesCountry && matchesFaculty;
    });
};

// Хелпер для форматирования роли
export const formatRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

// Другие функции, которые используются в разных компонентах
export const handleLogout = (navigate) => {
    if (window.confirm('Do you really want to log out?')) {
        navigate('/');
    }
};

// Пример функции для fetch
export const fetchPublications = async () => {
    try {
        const res = await fetch('http://localhost:3000/publications');
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
};
