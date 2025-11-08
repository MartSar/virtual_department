import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/RegisterForm.css';

function RegisterForm() {
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');

    const navigate = useNavigate();

    const handleRegister = async () => {
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
            setMessage('Chyba servera');
        }
    };

    return (
        <div className="auth-container">
            <h1>Registration</h1>

            <label>
                Role:
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="student">Student</option>
                    <option value="professor">Professor</option>
                    <option value="postgraduate">Postgraduate</option>
                </select>
            </label>

            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <input
                type="text"
                placeholder="Last Name"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
            />

            <div className="password-wrapper">
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="password-input"
                />
                <button
                    type="button"
                    className="show-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>

            <div className="register-btns-container">
                <button className="set-acc-btn" onClick={handleRegister}>Set an Account</button>
                <button className="back-to-sign-in-btn" onClick={() => navigate('/')}>Back to Sign In</button>
            </div>
            {message && <p className="auth-message">{message}</p>}
        </div>
    );
}

export default RegisterForm;
