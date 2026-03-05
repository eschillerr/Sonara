import React from 'react';
import './static/css/login.css';
import Register from './register';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';


function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Login successful!');
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                navigate('/test-session');
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-logo-section">
                <h1 className="brand-logo">SONARA</h1>
            </div>

            <div className="login-form-section">
                <div className="login-card">
                    <div className="login-header">
                        <h2>Welcome Back</h2>
                        <p>Please enter your details to sign in.</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Enter your username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <div className="remember-me">
                                <input type="checkbox" id="remember" />
                                <label htmlFor="remember">Remember me</label>
                            </div>
                            <a href="/forgot-password" className="forgot-password">Forgot password?</a>
                        </div>

                    </form>

                    <div className="login-footer">
                        <p>Don't have an account? <Link to="/register">Create one</Link></p>
                        <button type="submit" form="login-form" className="login-button" onClick={handleSubmit} style={{ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;