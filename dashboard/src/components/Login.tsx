import { useState } from 'react';
import { authService } from '../api';
import { LogIn } from 'lucide-react';

export default function Login({ onLogin, onRegisterClick }: { onLogin: (user: any) => void, onRegisterClick: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await authService.login(username, password);
            localStorage.setItem('token', res.data.token);
            onLogin(res.data.user);
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto' }} className="glass-card">
            <div style={{ padding: '40px' }}>
                <h1 className="gradient-text" style={{ fontSize: '32px', marginBottom: '8px', textAlign: 'center' }}>Payday</h1>
                <p style={{ color: '#9ca3af', textAlign: 'center', marginBottom: '32px' }}>Merchant Dashboard Access</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="e.g. merchant_bob"
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}
                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <LogIn size={20} />
                        Sign In
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <button
                            type="button"
                            onClick={onRegisterClick}
                            style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Create an account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
