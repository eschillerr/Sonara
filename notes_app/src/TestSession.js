import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function TestSession() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSession = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found. Please log in.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                } else {
                    setError('Failed to fetch session. Invalid or expired token.');
                    localStorage.removeItem('token');
                }
            } catch (err) {
                console.error('Error fetching session:', err);
                setError('An error occurred while fetching session.');
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px', color: 'white', backgroundColor: '#111', minHeight: '100vh' }}>Loading session...</div>;
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', color: 'white', backgroundColor: '#111', minHeight: '100vh' }}>
                <h1 style={{ color: '#ff4d4d' }}>Error</h1>
                <p>{error}</p>
                <button
                    onClick={() => navigate('/')}
                    style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px' }}>
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', padding: '50px', color: 'white', backgroundColor: '#111', minHeight: '100vh' }}>
            <h1>Welcome {userData?.username || 'User'}!</h1>
            <p>This is a test view to verify your session is working correctly.</p>
            {userData && (
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#222', borderRadius: '8px', display: 'inline-block', textAlign: 'left', minWidth: '300px' }}>
                    <h3 style={{ marginTop: 0 }}>Session Data:</h3>
                    <pre style={{ margin: 0, color: '#4caf50' }}>{JSON.stringify(userData, null, 2)}</pre>
                </div>
            )}
            <br />
            <button
                onClick={handleLogout}
                style={{ padding: '10px 20px', marginTop: '30px', cursor: 'pointer', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                Logout
            </button>
        </div>
    );
}

export default TestSession;
