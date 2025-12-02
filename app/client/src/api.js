import axios from 'axios';

// MODIFICAR ESTA LÍNEA: Cambiar de:
//   baseURL: 'http://localhost:3001/api',   // sólo para localhost
// A:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
});

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