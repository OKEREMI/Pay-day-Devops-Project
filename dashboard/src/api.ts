import axios from 'axios';

const api = axios.create();

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: (username: string, password: string) =>
        axios.post(`/api/auth/login`, { username, password }),
    register: (username: string, password: string, name: string) =>
        axios.post(`/api/auth/register`, { username, password, name }),
    verify: () => api.get(`/api/auth/verify`),
};

export const paymentService = {
    getBalance: () => api.get(`/api/payment/balance`),
    getTransactions: () => api.get(`/api/payment/transactions`),
    deposit: (amount: number) => api.post(`/api/payment/deposit`, { amount }),
    withdraw: (amount: number) => api.post(`/api/payment/withdraw`, { amount }),
    transfer: (amount: number, toAccountNumber: string) => api.post(`/api/payment/transfer`, { amount, toAccountNumber }),
    getAccountName: (accountNumber: string) => api.get(`/api/payment/accounts/${accountNumber}`),
};
