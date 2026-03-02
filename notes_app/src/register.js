import React from 'react';
import './static/css/register.css';

function Register() {
    return (
        <div className="register-container">
            <div className="register-logo-section">
                <h1 className="brand-logo">SONARA</h1>
            </div>

            <div className="register-form-section">
                <div className="register-card">
                    <div className="register-header">
                        <h2>Create an Account</h2>
                        <p>Join us today! Please enter your details below.</p>
                    </div>

                    <form className="register-form">
                        <div className="name-group">
                            <div className="input-group">
                                <label htmlFor="firstName">First Name</label>
                                <input type="text" id="firstName" placeholder="First Name" required />
                            </div>
                            <div className="input-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input type="text" id="lastName" placeholder="Last Name" required />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id="email" placeholder="name@example.com" required />
                        </div>

                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input type="text" id="username" placeholder="Choose a username" required />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input type="password" id="password" placeholder="Create a password" required />
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" placeholder="Confirm your password" required />
                        </div>

                        <div className="form-actions">
                            <div className="terms-agreement">
                                <input type="checkbox" id="terms" required />
                                <label htmlFor="terms">I agree to the <a href="/terms">Terms & Conditions</a></label>
                            </div>
                        </div>

                        <button type="submit" className="register-button">Sign Up</button>
                    </form>

                    <div className="register-footer">
                        <p>Already have an account? <a href="/login">Sign In</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
