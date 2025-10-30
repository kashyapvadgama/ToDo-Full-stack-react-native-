// src/api/apiClient.ts

import axios from 'axios';
import { store } from '../store';

// This is the correct IP address from your screenshot
const MAC_IP_ADDRESS = '192.0.0.2';

// The baseURL now points directly to your server
const baseURL = `http://${MAC_IP_ADDRESS}:3000/api`;

const apiClient = axios.create({
  baseURL,
});

// This part adds the authentication token to every request after you log in
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;