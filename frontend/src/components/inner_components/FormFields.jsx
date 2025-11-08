import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function FormFields({
                  role, setRole,
                  name, setName,
                  lastname, setLastname,
                  password, setPassword,
                  showPassword, setShowPassword
              }){
    return (
        <div className="form">
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
        </div>
    );
};

