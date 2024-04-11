import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { Message, User } from "../utils/Types";
import { UserContext } from "../context/UserContextProvider.tsx";
import RandomEmoji from "./RandomEmoji.tsx";

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
  const [messageDraft, setMessageDraft] = useState<string>("");
  const [chatLoading, setChatLoading] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const newWs = new WebSocket(
      `${process.env.REACT_APP_WEBSOCKET_SERVER as string}?userId=${
        currUser!.id
      }`
    );

    newWs.onopen = () => {
      console.log("WebSocket connection opened");
    };

    newWs.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      console.log(newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    newWs.onclose = () => {
      console.log("WebSocket connection closed");
    };

    setWs(newWs);

    // Clean up WebSocket connection on unmount
    return () => {
      newWs.close();
    };
  }, [currUser, setMessages]);

  const sendMessage = (messageDraftContent) => {
    fetch(`${process.env.REACT_APP_HEROKU_URL}/message/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_id: currUser!.id,
        receiver_id: selectedFriend!.id,
        message: messageDraftContent,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          setMessages((prevMessages) => [...prevMessages, data.message]);
          if (ws) {
            ws.send(JSON.stringify(data.message));
          }
        }
        setMessageDraft("");
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
            {selectedFriend.username}
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
