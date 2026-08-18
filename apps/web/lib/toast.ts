import { useToastStore } from "@/store/toast/useToastStore";
import type { ToastOptions, ToastStatus } from "@/types/toast.type";

const DEFAULT_DURATION_MS = 4000;

type ToastInput = Omit<ToastOptions, "title" | "status">;

function show(status: ToastStatus, title: string, options: ToastInput = {}) {
    const id = crypto.randomUUID();
    useToastStore.getState().push({
        id,
        title,
        status,
        duration: DEFAULT_DURATION_MS,
        ...options,
    });
    return id;
}

export const toast = Object.assign(
    (title: string, options?: ToastInput) => show("default", title, options),
    {
        success: (title: string, options?: ToastInput) => show("success", title, options),
        info: (title: string, options?: ToastInput) => show("info", title, options),
        warning: (title: string, options?: ToastInput) => show("warning", title, options),
        error: (title: string, options?: ToastInput) => show("error", title, options),
        dismiss: (id: string) => useToastStore.getState().dismiss(id),
        clear: () => useToastStore.getState().clear(),
    },
);
