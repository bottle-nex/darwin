import axios from "axios";

import { API_URL } from "@/routes/api_routes";

import SessionServices from "./session";

export const apiClient = axios.create({
    baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
    const token = SessionServices.get_token();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
