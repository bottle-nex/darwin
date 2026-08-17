import axios from "axios";
import { API_URL } from "@/routes/api_routes";
import AdminSession from "./session";

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
    const token = AdminSession.get_token();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && AdminSession.is_authenticated()) {
            AdminSession.clear();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    },
);

export function getErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        return err.response?.data?.message ?? fallback;
    }
    return fallback;
}
