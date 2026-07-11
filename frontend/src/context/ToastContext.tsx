import { createContext, useContext, useState, useRef } from "react";
import type { ReactNode } from "react";
import { ToastContainer, type ToastItem, type ToastType } from "../components";

interface QueuedToast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: ( message: string, type?: ToastType ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const DURATION = 2200;
const EXIT_DURATION = 300;

export const ToastProvider = ({ children }: { children: ReactNode }) => {

    const [ current, setCurrent ] = useState<ToastItem | null>(null);
    const queueRef = useRef<QueuedToast[]>([]);
    const activeRef = useRef(false);
    const nextId = useRef(0);

    // Toast are showed one by one: the next in the queue doesn't appear until the previous one has dissapeared
    const showNext = () => {
        const next = queueRef.current.shift();
        if( !next ){
            activeRef.current = false;
            setCurrent(null);
            return;
        }
        activeRef.current = true;
        setCurrent({ id: next.id, message: next.message, type: next.type });
        setTimeout(() => dismissCurrent(next.id), DURATION);
    };

    const dismissCurrent = ( id: number ) => {
        setCurrent((c) => c && c.id === id ? { ...c, exiting: true } : c);
        setTimeout(showNext, EXIT_DURATION);
    };

    const showToast = ( message: string, type: ToastType = "info" ) => {
        const id = nextId.current++;
        queueRef.current.push({ id, message, type });
        if( !activeRef.current ) showNext();
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            { children }
            <ToastContainer toasts={ current ? [current] : [] } onDismiss={ dismissCurrent } />
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextValue => {
    const ctx = useContext(ToastContext);
    if( !ctx ) throw new Error("useToast must be used within ToastProvider");
    return ctx;
};