import axios from 'axios';
import { LOCAL_STORAGE__TOKEN } from "./services/auth.services"

const axiosInstance=axios.create({
    baseURL:import.meta.env.BACKEND_BASE_URL || "http://localhost:8081",
    headers:{
        "Content-Type":"application/json"
    }
})

axiosInstance.interceptors.request.use((config) => {
	const token = localStorage.getItem(LOCAL_STORAGE__TOKEN);
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

export default axiosInstance;