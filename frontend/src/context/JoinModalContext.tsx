import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { JoinModal } from "../components";

interface JoinModalContextValue {
    openJoinModal: () => void;
}

const JoinModalContext = createContext<JoinModalContextValue | null>(null);

export const JoinModalProvider = ({ children }: { children: ReactNode }) => {
    
    const [ isOpen, setIsOpen ] = useState(false);

    return (
        <JoinModalContext.Provider value={{ openJoinModal: () => setIsOpen(true) }}>
            { children }
            <JoinModal isOpen={ isOpen } onClose={ () => setIsOpen(false) } />
        </JoinModalContext.Provider>
    );
};

export const useJoinModal = (): JoinModalContextValue => {
    const ctx = useContext(JoinModalContext);
    if( !ctx ) throw new Error("useJoinModal must be used within JoinModalProvider");
    return ctx;
};