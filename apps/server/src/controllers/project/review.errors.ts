export function github_error_message(error: unknown, fallback: string): string {
    if (error && typeof error === "object" && "status" in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        return response?.data?.message ?? fallback;
    }
    return fallback;
}
