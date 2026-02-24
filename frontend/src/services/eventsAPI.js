import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const eventsAPI = {
  getAll: () => axios.get(`${API_URL}/api/events`, getAuthHeaders()),
  
  getOne: (id) => axios.get(`${API_URL}/api/events/${id}`, getAuthHeaders()),
  
  create: (data) => axios.post(`${API_URL}/api/events`, data, getAuthHeaders()),
  
  update: (id, data) => axios.patch(`${API_URL}/api/events/${id}`, data, getAuthHeaders()),
  
  delete: (id) => axios.delete(`${API_URL}/api/events/${id}`, getAuthHeaders()),
};

export const publicEventsAPI = {
  getActive: () => axios.get(`${API_URL}/api/public/events`),
  
  getOne: (id) => axios.get(`${API_URL}/api/public/events/${id}`),
};
