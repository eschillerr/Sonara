import React from 'react';
import './static/css/register.css';
import { Link } from 'react-router-dom';
import { useState } from 'react';


function Register() {

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        password: '',
        confirm_password: ''
    });

    // Función para actualizar el estado cada vez que el usuario escribe
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value // Usa el id del input para saber qué actualizar
        });
    }
    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita que la página se recargue
        // Validación básica de contraseñas
        if (formData.password !== formData.confirm_password) {
            alert("Las contraseñas no coinciden");
            return;
        }
        try {
            // Hacemos la petición POST al backend
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Convertimos el estado formData a cadena JSON
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                alert("¡Registro exitoso!");
                // Aquí podrías redireccionar al usuario al login con useNavigate()
            } else {
                alert("Ocurrió un error: " + data.error);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor.");
        }
    };


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

                    <form className="register-form" onSubmit={handleSubmit} >
                        <div className="name-group">
                            <div className="input-group">
                                <label htmlFor="first_name">First Name</label>
                                <input type="text" id="first_name" placeholder="First Name" required value={formData.first_name} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label htmlFor="last_name">Last Name</label>
                                <input type="text" id="last_name" placeholder="Last Name" required value={formData.last_name} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id="email" placeholder="name@example.com" required value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input type="text" id="username" placeholder="Choose a username" required value={formData.username} onChange={handleChange} />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input type="password" id="password" placeholder="Create a password" required value={formData.password} onChange={handleChange} />
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirm_password">Confirm Password</label>
                            <input type="password" id="confirm_password" placeholder="Confirm your password" required value={formData.confirm_password} onChange={handleChange} />
                        </div>

                        <div className="form-actions">
                            <div className="terms-agreement">
                                <input type="checkbox" id="terms" required />
                                <label htmlFor="terms">I agree to the <a href="/terms">Terms & Conditions</a></label>
                            </div>
                        </div>

                        <button type="submit" className="register-button">Sign Up</button>
                    </form>
                </div>

                <div className="register-footer">
                    <p>Already have an account? <Link to="/">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Register;
