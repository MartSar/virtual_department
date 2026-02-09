export const handleSignIn = async ({
                                       role,
                                       name,
                                       lastname,
                                       login,
                                       password,
                                       university_id,
                                       setMessage,
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

        if (role === 'student') {
            body.university_id = university_id;
        }

        const res = await fetch('http://localhost:3000/login', {
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
            setMessage(data.error || 'Sign In Error');
        }
    } catch (err) {
        console.error('Login error:', err);
        setMessage('Server Error. Try Later.');
    }
};


export const handleRegister = async ({
                                         role,
                                         name,
                                         lastname,
                                         login,
                                         password,
                                         university_id,
                                         faculty_id,
                                         setMessage,
                                         navigate
                                     }) => {
    try {
        const res = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role,
                name,
                lastname,
                login,
                password,
                university_id,
                faculty_id
            }),
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