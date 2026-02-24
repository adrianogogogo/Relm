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

export const benefitsAPI = {
  getAll: (params) => axios.get(`${API_URL}/api/benefits`, {
    ...getAuthHeaders(),
    params,
  }),
  
  getOne: (id) => axios.get(`${API_URL}/api/benefits/${id}`, getAuthHeaders()),
  
  getStatistics: () => axios.get(`${API_URL}/api/benefits/statistics`, getAuthHeaders()),
  
  create: (data) => axios.post(`${API_URL}/api/benefits`, data, getAuthHeaders()),
  
  update: (id, data) => axios.patch(`${API_URL}/api/benefits/${id}`, data, getAuthHeaders()),
  
  delete: (id) => axios.delete(`${API_URL}/api/benefits/${id}`, getAuthHeaders()),
};

export const publicBenefitsAPI = {
  getActive: () => axios.get(`${API_URL}/api/public/benefits`),
  
  getFeatured: () => axios.get(`${API_URL}/api/public/benefits/featured`),
  
  getOne: (id) => axios.get(`${API_URL}/api/public/benefits/${id}`),
};
