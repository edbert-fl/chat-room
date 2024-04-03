import React, { useContext, useState } from "react";
import { Message, User } from "../../utils/Types.tsx";
import { UserContext } from "../../context/UserContextProvider.tsx";

const HomeScreen = () => {
  let prevAuthorID: number | null = null;

  const currUser = useContext(UserContext);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messageDraft, setMessageDraft] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Dummy data for friends and messages
  const friends = [
    { id: 1, name: "Friend 1" },
    { id: 2, name: "Friend 2" },
    { id: 3, name: "Friend 3" },
  ];

  // Function to handle friend selection
  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend);
    setMessages([]);
  };

  // Function to handle sending message
  const sendMessage = (messageDraftContent) => {
    const newMessage = {
      author: currUser!,
      content: messageDraftContent,
      read: false,
      sentAt: new Date(),
    };
    setMessages([...messages, newMessage!]);
    setMessageDraft("");
  };

  return (
    <div className="flex h-full w-full bg-gray-100">
      <div className="w-1/4 border-r border-gray-300">
        <div className="pt-5 p-4">
          <h2 className="text-lg font-semibold">Friends</h2>
        </div>
        <ul>
          {friends.map((friend) => (
            <li
              key={friend.id}
              className={`cursor-pointer py-2 px-4 mx-2 rounded-md ${
                selectedFriend && selectedFriend.id === friend.id
                  ? "bg-teal-400"
                  : ""
              }
              ${
                selectedFriend && selectedFriend.id !== friend.id
                  ? "hover:bg-gray-200"
                  : ""
              }`}
              onClick={() => handleFriendSelect(friend)}
            >
              {friend.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Chat Room</h2>
        {selectedFriend ? (
          <div className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto pb-4">
              {messages.map((message, index) => {
                const showAuthor = message.author.id !== prevAuthorID; // Check if the author is different from the previous one
                prevAuthorID = message.author.id; // Update the previous author

                return (
                  <>
                    {showAuthor && (
                      <div
                        key={index + "_author"}
                        className={`text-sm font-semibold mb-1`}
                      >
                        {message.author.name}{" "}
                        {message.sentAt.toLocaleString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                    )}
                    <div
                      key={index + "_content"}
                      className={"flex items-start justify-start"}
                    >
                      <div className={`rounded-lg max-w-3xl break-words gray`}>
                        <div className="text-sm">{message.content}</div>
                      </div>
                    </div>
                  </>
                );
              })}
            </div>
            <div className="bg-gray-200 flex items-center justify-between p-4">
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 mr-2 focus:outline focus:outline-teal-300"
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
              />
              <button
                className="w-20 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"
                onClick={() => sendMessage(messageDraft)}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 flex-1 flex items-center justify-center">
            Select a friend to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
