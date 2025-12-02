import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api',
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
