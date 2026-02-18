import { useState, useEffect } from 'react';
import { authService } from './api';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

function App() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'login' | 'register'>('login');

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await authService.verify();
                    setUser(res.data.user);
                } catch (err) {
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', width: '100%', marginTop: '50px' }}>Loading...</div>;

    if (user) {
        return (
            <Dashboard
                user={user}
                onLogout={() => {
                    localStorage.removeItem('token');
                    setUser(null);
                }}
            />
        );
    }

    return (
        <div className="container" style={{ padding: '20px' }}>
            {view === 'login' ? (
                <Login
                    onLogin={(u: any) => setUser(u)}
                    onRegisterClick={() => setView('register')}
                />
            ) : (
                <Register
                    onRegister={() => setView('login')}
                    onBack={() => setView('login')}
                />
            )}
        </div>
    );
}

export default App;
