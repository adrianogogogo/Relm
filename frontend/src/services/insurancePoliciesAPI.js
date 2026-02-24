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

export const insurancePoliciesAPI = {
  getAll: (params) => axios.get(`${API_URL}/api/insurance-policies`, { 
    ...getAuthHeaders(), 
    params 
  }),
  
  getOne: (id) => axios.get(`${API_URL}/api/insurance-policies/${id}`, getAuthHeaders()),
  
  getActive: () => axios.get(`${API_URL}/api/insurance-policies/active`, getAuthHeaders()),
  
  getExpiringSoon: (days = 30) => axios.get(`${API_URL}/api/insurance-policies/expiring-soon`, {
    ...getAuthHeaders(),
    params: { days },
  }),
  
  getStatistics: () => axios.get(`${API_URL}/api/insurance-policies/statistics`, getAuthHeaders()),
  
  create: (data) => axios.post(`${API_URL}/api/insurance-policies`, data, getAuthHeaders()),
  
  update: (id, data) => axios.patch(`${API_URL}/api/insurance-policies/${id}`, data, getAuthHeaders()),
  
  updateStatus: (id, status) => axios.patch(`${API_URL}/api/insurance-policies/${id}/status`, { status }, getAuthHeaders()),
  
  delete: (id) => axios.delete(`${API_URL}/api/insurance-policies/${id}`, getAuthHeaders()),
};

export const insuranceQuotesAPI = {
  getAll: () => axios.get(`${API_URL}/api/insurance-quote`, getAuthHeaders()),
  
  getOne: (id) => axios.get(`${API_URL}/api/insurance-quote/${id}`, getAuthHeaders()),
  
  create: (data) => axios.post(`${API_URL}/api/insurance-quote`, data, getAuthHeaders()),
  
  update: (id, data) => axios.patch(`${API_URL}/api/insurance-quote/${id}`, data, getAuthHeaders()),
};
