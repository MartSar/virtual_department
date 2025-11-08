export const handleSignIn = async ({ role, name, lastname, password, setMessage, navigate }) => {
    try {
        const res = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, name, lastname, password }),
        });
        const data = await res.json();
        if (data.success) {
            navigate('/dashboard', { state: { role, name, lastname, userId: data.userId } });
        } else {
            setMessage(data.error);
        }
    } catch (err) {
        console.error(err);
        setMessage('Server error');
    }
};

export const handleRegister = async ({ role, name, lastname, password, setMessage, navigate }) => {
    try {
        const res = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, name, lastname, password }),
        });
        const data = await res.json();
        if (data.success) {
            setMessage('Registration was successful!');
            setTimeout(() => navigate('/'), 1500);
        } else {
            setMessage(data.error);
        }
    } catch (err) {
        console.error(err);
        setMessage('Server Error');
    }
};

export const handleLogout = ({ navigate }) => {
    if (window.confirm('Do you really want to log out?')) {
        navigate('/');
    }
};