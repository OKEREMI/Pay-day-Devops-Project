import axios from 'axios';

const AUTH_URL = 'http://localhost:4001';
const PAYMENT_URL = 'http://localhost:4002';

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
        axios.post(`${AUTH_URL}/login`, { username, password }),
    register: (username: string, password: string, name: string) =>
        axios.post(`${AUTH_URL}/register`, { username, password, name }),
    verify: () => api.get(`${AUTH_URL}/verify`),
};

export const paymentService = {
    getBalance: () => api.get(`${PAYMENT_URL}/balance`),
    getTransactions: () => api.get(`${PAYMENT_URL}/transactions`),
    deposit: (amount: number) => api.post(`${PAYMENT_URL}/deposit`, { amount }),
    withdraw: (amount: number) => api.post(`${PAYMENT_URL}/withdraw`, { amount }),
    transfer: (amount: number, toAccountNumber: string) => api.post(`${PAYMENT_URL}/transfer`, { amount, toAccountNumber }),
    getAccountName: (accountNumber: string) => api.get(`${PAYMENT_URL}/accounts/${accountNumber}`),
};
