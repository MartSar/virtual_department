import {API_URL} from "./config";

export const handleSignIn = async ({
                                       role,
                                       name,
                                       lastname,
                                       login,
                                       password,
                                       setMessage,
                                       setMessageType,
                                       navigate
                                   }) => {
    try {
        const body = {
            role,
            name,
            lastname,
            login,
            password
        };

        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (data.success) {
            const { id, login: login, role: serverRole } = data.user;

            navigate('/dashboard', {
                state: {
                    user_id: id,
                    login: login,
                    role: serverRole,
                }
            });
        } else {
            setMessageType('error');
            setMessage(data.error || 'Sign In Error');
        }
    } catch (err) {
        console.error('Login error:', err);
        setMessageType('error');
        setMessage('Server Error. Try Later.');
    }
};


export const handleRegister = async ({
                                         role,
                                         name,
                                         lastname,
                                         login,
                                         password,
                                         faculty_id,
                                         setMessage,
                                         setMessageType,
                                         navigate
                                     }) => {
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role,
                name,
                lastname,
                login,
                password,
                faculty_id
            }),
        });

        const data = await res.json();

        if (data.success) {
            setMessageType('success');
            setMessage('Registration was successful!');
            setTimeout(() => navigate('/'), 1500);
        } else {
            setMessageType('error');
            setMessage(data.error);
        }
    } catch (err) {
        console.error(err);
        setMessageType('error');
        setMessage('Server Error');
    }
};