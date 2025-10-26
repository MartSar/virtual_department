import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/AuthForm.css';

function AuthForm() {
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');

    const navigate = useNavigate();

    // Регистрация
    const handleSignUp = async () => {
        try {
            const res = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, name, lastname, password }),
            });
            const data = await res.json();
            setMessage(data.success ? 'Signed up successfully!' : data.error);
        } catch (err) {
            console.error(err);
            setMessage('Server error');
        }
    };

    // Вход
    const handleSignIn = async () => {
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

    return (
        <div className="auth-container">
            <h1>Virtual Department</h1>

            <label>
                Role:
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="student">Student</option>
                    <option value="professor">Professor</option>
                    <option value="postgraduate">Postgraduate</option>
                </select>
            </label>

            <input
                className="first-name-input"
                type="text"
                placeholder="First Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <input
                className="last-name-input"
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

            <div className="auth-btns-container">
                <button className="sign-up-btn" onClick={handleSignUp}>Sign Up</button>
                <button className="sign-in-btn" onClick={handleSignIn}>Sign In</button>
            </div>

            {message && <p className="auth-message">{message}</p>}
        </div>
    );
}

export default AuthForm;
