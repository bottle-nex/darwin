import axios from "axios";
import AdminSession from "./session";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8080";

export const API_URL = `${BACKEND_URL}/api/v1`;

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
    const token = AdminSession.get_token();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && AdminSession.is_authenticated()) {
            AdminSession.clear();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    },
);

export function error_message(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        return err.response?.data?.message ?? fallback;
    }
    return fallback;
}
