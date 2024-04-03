import React, { createContext, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { User } from "../utils/Types";

interface UserContextProviderProps {
    children: ReactNode;
}

export const UserContext = createContext<User | null>(null);
export const UserUpdateContext = createContext<Dispatch<SetStateAction<User | null>>>(() => null);

const UserContextProvider = ({ children }: UserContextProviderProps) => {
    const [currUser, setCurrUser] = useState<User | null>(null);

    return (
        <UserContext.Provider value={ currUser }>
            <UserUpdateContext.Provider value={ setCurrUser }>
                {children}
            </UserUpdateContext.Provider>
        </UserContext.Provider>
    );
};

export default UserContextProvider;
