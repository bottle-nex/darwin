export type ToastStatus = "default" | "success" | "info" | "warning" | "error";

export type ToastVerticalPosition = "top" | "bottom";
export type ToastHorizontalPosition = "left" | "center" | "right";
export type ToastPosition = `${ToastVerticalPosition}-${ToastHorizontalPosition}`;

export type ToastAction = {
    label: string;
    onClick: () => void;
};

export type ToastOptions = {
    title: string;
    description?: string;
    status?: ToastStatus;
    position?: ToastPosition;
    duration?: number;
    action?: ToastAction;
};

export type ToastItem = ToastOptions & { id: string };
