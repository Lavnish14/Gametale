"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

const toastConfig = {
    success: {
        icon: CheckCircle,
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        text: "text-green-400",
        iconColor: "text-green-400",
    },
    error: {
        icon: XCircle,
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-400",
        iconColor: "text-red-400",
    },
    warning: {
        icon: AlertCircle,
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
        iconColor: "text-yellow-400",
    },
    info: {
        icon: Info,
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        text: "text-blue-400",
        iconColor: "text-blue-400",
    },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, [removeToast]);

    const success = useCallback((message: string) => showToast(message, "success"), [showToast]);
    const error = useCallback((message: string) => showToast(message, "error"), [showToast]);
    const warning = useCallback((message: string) => showToast(message, "warning"), [showToast]);
    const info = useCallback((message: string) => showToast(message, "info"), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => {
                        const config = toastConfig[toast.type];
                        const Icon = config.icon;

                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className={`
                                    pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl
                                    backdrop-blur-xl border shadow-lg shadow-black/20
                                    ${config.bg} ${config.border}
                                    min-w-[280px] max-w-[400px]
                                `}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
                                <p className={`text-sm font-medium flex-1 ${config.text}`}>
                                    {toast.message}
                                </p>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-4 h-4 text-zinc-400" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

