import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import RegisterForm from "./components/RegisterForm";
import Dashboard from './components/Dashboard';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AuthForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
