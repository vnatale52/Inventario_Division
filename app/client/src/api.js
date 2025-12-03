import axios from 'axios';

// MODIFICAR ESTA LÍNEA: Cambiar de:
//   baseURL: 'http://localhost:3001/api',   // sólo para localhost
// A:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
};

export const register = async (username, password, role) => {
    const response = await api.post('/auth/register', { username, password, role });
    return response.data;
};

export const fetchData = async () => {
    const response = await api.get('/data');
    return response.data;
};

export const updateData = async (type, row) => {
    const response = await api.post('/data', { type, row });
    return response.data;
};

export const updateColumns = async (type, column) => {
    const response = await api.post('/columns', { type, column });
    return response.data;
};

export const createBackup = async (username) => {
    const response = await api.post('/backup', { username });
    return response.data;
};