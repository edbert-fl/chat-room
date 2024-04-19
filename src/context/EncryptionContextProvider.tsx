import React, {
  createContext,
  useState,
  ReactNode,
  SetStateAction,
  Dispatch,
} from "react";
import { ChatRoomConnection } from "../utils/Types";

interface EncryptionContextProviderProps {
  children: ReactNode;
}

export interface ChatRoomConnectionContextType {
  chatRoomConnections: ChatRoomConnection[];
  addConnection: (connection: ChatRoomConnection) => void;
  getPublicKey: (friendID: number) => CryptoKey | null;
  getPrivateKey: (friendID: number) => CryptoKey | null;
  PKDF2Key: CryptoKey | null;
  setPKDF2Key: Dispatch<SetStateAction<CryptoKey | null>>;
}

export const ChatRoomConnectionContext =
  createContext<ChatRoomConnectionContextType>({
    chatRoomConnections: [],
    addConnection: () => {},
    getPublicKey: () => null,
    getPrivateKey: () => null,
    PKDF2Key: null,
    setPKDF2Key: () => {},
  });

export const EncryptionContextProvider = ({
  children,
}: EncryptionContextProviderProps) => {
  const [chatRoomConnections, setChatRoomConnections] = useState<
    ChatRoomConnection[]
  >([]);
  const [PKDF2Key, setPKDF2Key] = useState<CryptoKey | null>(null);

  const addConnection = (connection: ChatRoomConnection) => {
    console.log("Adding Connection:", connection);
    setTimeout(function delay() {
      setChatRoomConnections((prevConnections) => {
        console.log("Previous Connections:", prevConnections);
        const existingIndex = prevConnections.findIndex(
          (c) => c.friendID === connection.friendID
        );
        if (existingIndex !== -1) {
          const updatedConnections = [...prevConnections];
          updatedConnections[existingIndex] = connection;
          return updatedConnections;
        } else {
          return [...prevConnections, connection];
        }
      });
    });
  };

  const getPublicKey = (friendID: number) => {
    const connection = chatRoomConnections.find(
      (connection) => connection.friendID === friendID
    );
    return connection ? connection.publicKey : null;
  };

  const getPrivateKey = (friendID: number) => {
    const connection = chatRoomConnections.find(
      (connection) => connection.friendID === friendID
    );
    return connection ? connection.privateKey : null;
  };

  const contextValue: ChatRoomConnectionContextType = {
    chatRoomConnections,
    addConnection,
    getPublicKey,
    getPrivateKey,
    PKDF2Key,
    setPKDF2Key,
  };

  return (
    <ChatRoomConnectionContext.Provider value={contextValue}>
      {children}
    </ChatRoomConnectionContext.Provider>
  );
};

export default EncryptionContextProvider;
