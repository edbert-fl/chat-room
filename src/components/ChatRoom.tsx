import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Message, User } from "../utils/Types";
import { TokenContext, UserContext } from "../context/UserContextProvider.tsx";
import RandomEmoji from "./RandomEmoji.tsx";
import WS_STATUS from "../utils/WSStatus.tsx";
import {
  UpdateWebSocketContext,
  WebSocketContext,
} from "../context/WebSocketContextProvider.tsx";
import { ChatRoomConnectionContext } from "../context/EncryptionContextProvider.tsx";
import { bufferToString, pkdf2EncryptMessage } from "../utils/PKDFCrypto.tsx";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  exportPublicKeyToJWK,
  importPublicKeyFromJWK,
  wsDecryptMessage,
  wsEncryptMessage,
} from "../utils/WSCrypto.tsx";

interface ChatRoomProps {
  selectedFriend: User | null;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  selectedFriend,
  messages,
  setMessages,
}) => {
  let prevAuthorID: number | null = null;

  const currUser = useContext(UserContext);
  const token = useContext(TokenContext);
  const ws = useContext(WebSocketContext);
  const setWs = useContext(UpdateWebSocketContext);

  const {
    publicKey,
    friendsPublicKey,
    setFriendsPublicKey,
    privateKey,
    PKDF2Key,
  } = useContext(ChatRoomConnectionContext);

  const [messageDraft, setMessageDraft] = useState<string>("");
  // eslint-disable-next-line
  const [chatLoading, setChatLoading] = useState(false);

  const prevSelectedFriend = useRef<User | null>(null);
  
  useEffect(() => {
    if (!ws) {
      const newWs = new WebSocket(
        `${process.env.REACT_APP_WEBSOCKET_SERVER as string}?userId=${
          currUser!.id
        }`
      );

      newWs.onopen = () => {};

      newWs.onmessage = async (event) => {
        const websocketMessage = JSON.parse(event.data);
        console.log(websocketMessage);

        if (websocketMessage.type === WS_STATUS.MESSAGE_TRANSFER) {
          try {
            if (!privateKey) {
              console.error("Private key not generated");
              return;
            }

            const encryptedMessageBuffer = base64ToArrayBuffer(
              websocketMessage.data.message
            );

            const decryptedMessage = await wsDecryptMessage(
              encryptedMessageBuffer,
              privateKey
            );
            const message = {
              ...websocketMessage.data,
              message: decryptedMessage,
            };

            // Store message with my own pbkdf2 encryption
            storeMessage(decryptedMessage);

            setMessages((prevMessages) => [...prevMessages, message]);
          } catch (error) {
            console.error("Error receiving and decrypting message:", error);
          }
        } else if (
          websocketMessage.type === WS_STATUS.REQUEST_TO_SEND_PUBLIC_KEY
        ) {
          setFriendsPublicKey(
            await importPublicKeyFromJWK(websocketMessage.data.jwkPublicKey)
          );

          // Timeout to allow state to update
          setTimeout(async () => {
            const myJWKPublicKey = await exportPublicKeyToJWK(publicKey);
            const newConnection = {
              type: WS_STATUS.ACCEPTED_REQUEST_FOR_PUBLIC_KEY,
              data: {
                senderID: currUser!.id,
                receiverID: websocketMessage.data.senderID,
                jwkPublicKey: myJWKPublicKey,
              },
            };
            newWs.send(JSON.stringify(newConnection));
          }, 500);
        } else if (
          websocketMessage.type === WS_STATUS.ACCEPTED_REQUEST_FOR_PUBLIC_KEY
        ) {
          setFriendsPublicKey(
            await importPublicKeyFromJWK(websocketMessage.data.jwkPublicKey)
          );
        }
      };

      newWs.onclose = () => {};

      setWs(newWs);

      // Clean up WebSocket connection on unmount
      return () => {
        newWs.close();
      };
    }
    // eslint-disable-next-line
  }, [currUser, setMessages]);

  useEffect(() => {
    prevSelectedFriend.current = selectedFriend;
  }, [selectedFriend]);

  const sendMessage = async (messageDraftContent) => {
    const pkdf2EncryptedData = await pkdf2EncryptMessage(
      messageDraftContent,
      PKDF2Key
    );

    const ciphertext = bufferToString(pkdf2EncryptedData.ciphertext);
    const ivString = bufferToString(pkdf2EncryptedData.iv);

    fetch(`${process.env.REACT_APP_HEROKU_URL}/message/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        UserID: `${currUser!.id}`,
        Email: `${currUser!.email}`,
      },
      body: JSON.stringify({
        sender_id: currUser!.id,
        receiver_id: selectedFriend!.id,
        message: ciphertext,
        iv: ivString,
        hmac: pkdf2EncryptedData.hmac,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(async (data) => {
        if (data) {
          if (!friendsPublicKey) {
            console.error("Could not send message");
            return;
          }

          const encryptedMessageBuffer = await wsEncryptMessage(
            messageDraftContent,
            friendsPublicKey
          );

          const encryptedMessageString = arrayBufferToBase64(
            encryptedMessageBuffer
          );

          const websocketMessage = {
            type: WS_STATUS.MESSAGE_TRANSFER,
            data: {
              id: data.message.id,
              message: encryptedMessageString,
              sender: data.message.sender,
              receiver: data.message.receiver,
              sentAt: data.message.sentAt,
            },
          };

          if (ws) {
            ws.send(JSON.stringify(websocketMessage));
          }
        }
        setMessageDraft("");
        const newLocallyDisplayedMessage = {
          id: data.message.id,
          message: messageDraft,
          sender: data.message.sender,
          receiver: data.message.receiver,
          sentAt: data.message.sentAt,
        };
        setMessages((prevMessages) => [
          ...prevMessages,
          newLocallyDisplayedMessage,
        ]);
      })
      .catch((error) => {
        console.error("Error sending message:", error.message);
      });
  };

  const storeMessage = async (messageDraftContent) => {
    const pkdf2EncryptedData = await pkdf2EncryptMessage(
      messageDraftContent,
      PKDF2Key
    );

    const ciphertext = bufferToString(pkdf2EncryptedData.ciphertext);
    const ivString = bufferToString(pkdf2EncryptedData.iv);

    console.log(selectedFriend);

    console.log(
      "String",
      JSON.stringify({
        storer_id: currUser!.id,
        sender_id: prevSelectedFriend.current!.id,
        receiver_id: currUser!.id,
        message: ciphertext,
        iv: ivString,
      })
    );

    fetch(`${process.env.REACT_APP_HEROKU_URL}/message/store`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        UserID: `${currUser!.id}`,
        Email: `${currUser!.email}`,
      },
      body: JSON.stringify({
        storer_id: currUser!.id,
        sender_id: prevSelectedFriend.current!.id,
        receiver_id: currUser!.id,
        message: ciphertext,
        iv: ivString,
        hmac: pkdf2EncryptedData.hmac,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Message stored", data);
      })
      .catch((error) => {
        console.error("Error sending message:", error.message);
      });
  };

  return (
    <div className="flex-1 p-6 mt-2 flex flex-col">
      {selectedFriend ? (
        <>
          <h2 className="text-lg font-semibold mb-4">
            <span className="text-[28px]">
              {<RandomEmoji id={selectedFriend.id} />}
            </span>{" "}
            {selectedFriend.username}{" "}
            {friendsPublicKey === null ||
            selectedFriend === null
              ? "❌"
              : "✅"}
          </h2>
          <div className="flex flex-col flex-1">
            <div
              className="flex-1 overflow-y-auto  mb-5"
              style={{ maxHeight: "calc(100vh - 14rem)" }}
            >
              {chatLoading ? (
                <div className="animate-pulse p-1 flex h-10 w-4/5 space-x-4">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="grid grid-cols-4 gap-1">
                      <div className="h-5 bg-gray-200 rounded col-span-3"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="h-5 bg-gray-200 rounded col-span-2"></div>
                      <div className="h-5 bg-gray-200 rounded col-span-1"></div>
                    </div>
                    <div className="pt-5 grid grid-cols-5 gap-1">
                      <div className="h-5 bg-gray-200 rounded col-span-3"></div>
                      <div className="h-5 bg-gray-200 rounded col-span-1"></div>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      <div className="h-5 bg-gray-200 rounded col-span-1"></div>
                      <div className="h-5 bg-gray-200 rounded col-span-3"></div>
                    </div>
                    <div className="pt-5 grid grid-cols-4 gap-1">
                      <div className="h-5 bg-gray-200 rounded col-span-3"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="h-5 bg-gray-200 rounded col-span-2"></div>
                      <div className="h-5 bg-gray-200 rounded col-span-1"></div>
                    </div>
                    <div className="pt-5 grid grid-cols-5 gap-1">
                      <div className="h-5 bg-gray-200 rounded col-span-3"></div>
                      <div className="h-5 bg-gray-200 rounded col-span-1"></div>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      <div className="h-5 bg-gray-200 rounded col-span-1"></div>
                      <div className="h-5 bg-gray-200 rounded col-span-3"></div>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const showAuthor = message.sender.id !== prevAuthorID; // Check if the author is different from the previous one
                  prevAuthorID = message.sender.id; // Update the previous author

                  return (
                    <div key={index}>
                      {showAuthor && (
                        <div
                          key={index + "_author"}
                          className={`text-md mb-1 mt-4 font-bold ${
                            currUser!.id === message.sender.id
                              ? "text-teal-500"
                              : "text-violet-500"
                          }`}
                        >
                          {currUser!.id === message.sender.id
                            ? `${message.sender.username} (You)`
                            : `${message.sender.username}`}{" "}
                          <span className={`text-gray-500 text-xs font-medium`}>
                            {new Date(message.sentAt).toLocaleString("en-US", {
                              month: "2-digit",
                              day: "2-digit",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      )}
                      <div
                        key={index + "_content"}
                        className={"flex items-start justify-start"}
                      >
                        <div
                          className={`rounded-lg max-w-3xl break-words gray`}
                        >
                          <div className="text-sm text-gray-700">
                            {message.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {friendsPublicKey === null ||
            selectedFriend === null ? (
              <div className="bg-gray-200 rounded-lg flex items-center justify-between p-6 h-28">
                <input
                  type="text"
                  placeholder="Encrypting your conversation..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mr-2 focus:outline"
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                />
                <button className="w-20 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-500">
                  ...
                </button>
              </div>
            ) : (
              <div className="bg-gray-200 rounded-lg flex items-center justify-between p-6 h-28">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mr-2 focus:outline focus:outline-teal-300"
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      sendMessage(messageDraft);
                      setMessageDraft("");
                    }
                  }}
                />
                <button
                  className="w-20 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"
                  onClick={() => sendMessage(messageDraft)}
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 flex-1 flex items-center justify-center">
          Select a friend to start chatting
        </div>
      )}
    </div>
  );
};
