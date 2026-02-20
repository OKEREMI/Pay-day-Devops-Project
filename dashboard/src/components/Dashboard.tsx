import { useState, useEffect } from 'react';
import { paymentService } from '../api';
import { Wallet, ArrowRight, ArrowDownLeft, ArrowUpRight, LogOut, History } from 'lucide-react';

export default function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
    const [balance, setBalance] = useState(0);
    const [accountNumber, setAccountNumber] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Transfer State
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferStep, setTransferStep] = useState(1);
    const [recipientAccount, setRecipientAccount] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferError, setTransferError] = useState('');
    const [verifying, setVerifying] = useState(false);

    // Deposit State
    const [showDeposit, setShowDeposit] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositError, setDepositError] = useState('');

    // Withdraw State
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawError, setWithdrawError] = useState('');

    const fetchData = async () => {
        try {
            const [balRes, txRes] = await Promise.all([
                paymentService.getBalance(),
                paymentService.getTransactions()
            ]);
            setBalance(balRes.data.balance);
            setAccountNumber(balRes.data.accountNumber);
            setTransactions(txRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleVerifyRecipient = async () => {
        setVerifying(true);
        setTransferError('');
        try {
            const res = await paymentService.getAccountName(recipientAccount);
            setRecipientName(res.data.name);
            setTransferStep(2);
        } catch (err) {
            setTransferError('Account not found');
        } finally {
            setVerifying(false);
        }
    };

    const handleTransfer = async () => {
        try {
            await paymentService.transfer(Number(transferAmount), recipientAccount);
            setShowTransfer(false);
            setTransferStep(1);
            setRecipientAccount('');
            setRecipientName('');
            setTransferAmount('');
            fetchData();
        } catch (err: any) {
            setTransferError(err.response?.data?.message || 'Transfer failed');
        }
    };

    const handleDeposit = async () => {
        try {
            await paymentService.deposit(Number(depositAmount));
            setShowDeposit(false);
            setDepositAmount('');
            fetchData();
        } catch (err: any) {
            setDepositError(err.response?.data?.message || 'Deposit failed');
        }
    };

    const handleWithdraw = async () => {
        try {
            await paymentService.withdraw(Number(withdrawAmount));
            setShowWithdraw(false);
            setWithdrawAmount('');
            fetchData();
        } catch (err: any) {
            setWithdrawError(err.response?.data?.message || 'Withdrawal failed');
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h2 style={{ margin: 0 }}>Welcome back, <span className="gradient-text">{user.name}</span></h2>
                    <p style={{ color: '#9ca3af', margin: '4px 0 0 0' }}>Manage your payments and transactions</p>
                </div>
                <button onClick={onLogout} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LogOut size={18} /> Logout
                </button>
            </header>

            <div className="dashboard-grid">
                {/* Sidebar - Actions & Balance */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#6366f1' }}>
                            <Wallet size={24} />
                            <span style={{ fontWeight: 600 }}>Total Balance</span>
                        </div>
                        <h1 style={{ margin: 0, fontSize: '36px' }}>${balance.toLocaleString()}</h1>
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>ACCOUNT NUMBER</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontFamily: 'monospace', letterSpacing: '1px' }}>
                                {accountNumber || 'Loading...'}
                            </p>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                className="btn-primary"
                                onClick={() => setShowDeposit(true)}
                                style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                            >
                                Deposit Funds
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => setShowTransfer(true)}
                                style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                            >
                                Transfer Money
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => setShowWithdraw(true)}
                                style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.2)' }}
                            >
                                Withdraw Funds
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content - Transaction History */}
                <div className="glass-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <History size={24} />
                        <h3 style={{ margin: 0 }}>Recent Transactions</h3>
                    </div>

                    <div className="transactions-list">
                        {loading ? (
                            <p>Loading transactions...</p>
                        ) : transactions.length === 0 ? (
                            <p style={{ color: '#9ca3af' }}>No transactions found.</p>
                        ) : (
                            transactions.map((tx: any) => (
                                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            padding: '10px',
                                            borderRadius: '12px',
                                            background: tx.type.includes('IN') || tx.type === 'DEPOSIT' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: tx.type.includes('IN') || tx.type === 'DEPOSIT' ? '#4ade80' : '#f87171'
                                        }}>
                                            {tx.type.includes('IN') || tx.type === 'DEPOSIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{tx.type.replace('_', ' ')}</div>
                                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(tx.timestamp).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: '18px', color: tx.type.includes('IN') || tx.type === 'DEPOSIT' ? '#4ade80' : 'white' }}>
                                            {tx.type.includes('IN') || tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount}
                                        </div>
                                        {tx.relatedName && (
                                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                {tx.type === 'TRANSFER_IN' ? 'From' : 'To'}: {tx.relatedName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Transfer Modal Overlay */}
            {showTransfer && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content">
                        <h2 style={{ marginTop: 0 }}>Transfer Money</h2>

                        {transferStep === 1 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <label>Recipient Account Number</label>
                                <input
                                    type="text"
                                    value={recipientAccount}
                                    onChange={e => setRecipientAccount(e.target.value)}
                                    placeholder="Enter 10-digit account number"
                                />
                                {transferError && <p style={{ color: '#ef4444' }}>{transferError}</p>}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button onClick={() => setShowTransfer(false)} className="btn-primary" style={{ background: 'transparent', border: '1px solid #374151' }}>Cancel</button>
                                    <button onClick={handleVerifyRecipient} disabled={verifying} className="btn-primary">
                                        {verifying ? 'Verifying...' : 'Next'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#818cf8' }}>RECIPIENT</p>
                                    <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{recipientName}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{recipientAccount}</p>
                                </div>

                                <label>Amount to Transfer</label>
                                <input
                                    type="number"
                                    value={transferAmount}
                                    onChange={e => setTransferAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                                {transferError && <p style={{ color: '#ef4444' }}>{transferError}</p>}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button onClick={() => setTransferStep(1)} className="btn-primary" style={{ background: 'transparent', border: '1px solid #374151' }}>Back</button>
                                    <button onClick={handleTransfer} className="btn-primary" style={{ background: '#22c55e', color: 'black' }}>
                                        Confirm Transfer
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Deposit Modal Overlay */}
            {showDeposit && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content">
                        <h2 style={{ marginTop: 0 }}>Deposit Funds</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label>Amount to Deposit</label>
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={e => setDepositAmount(e.target.value)}
                                placeholder="0.00"
                            />
                            {depositError && <p style={{ color: '#ef4444' }}>{depositError}</p>}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button onClick={() => setShowDeposit(false)} className="btn-primary" style={{ background: 'transparent', border: '1px solid #374151' }}>Cancel</button>
                                <button onClick={handleDeposit} className="btn-primary" style={{ background: '#22c55e', color: 'black' }}>
                                    Confirm Deposit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal Overlay */}
            {showWithdraw && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content">
                        <h2 style={{ marginTop: 0 }}>Withdraw Funds</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label>Amount to Withdraw</label>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={e => setWithdrawAmount(e.target.value)}
                                placeholder="0.00"
                            />
                            {withdrawError && <p style={{ color: '#ef4444' }}>{withdrawError}</p>}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button onClick={() => setShowWithdraw(false)} className="btn-primary" style={{ background: 'transparent', border: '1px solid #374151' }}>Cancel</button>
                                <button onClick={handleWithdraw} className="btn-primary" style={{ background: '#ec4899', color: 'black' }}>
                                    Confirm Withdraw
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
