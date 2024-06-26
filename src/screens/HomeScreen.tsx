import React, { useContext, useState } from "react";
import { Message, User } from "../utils/Types.tsx";
import { FriendsList } from "../components/FriendsList.tsx";
import { FriendsSearch } from "../components/FriendsSearch.tsx";
import { Notification } from "../utils/Types.tsx";
import NotificationStack from "../components/NotificationStack.tsx";
import { ChatRoom } from "../components/ChatRoom.tsx";
import { TokenContext, UserContext } from "../context/UserContextProvider.tsx";
import { WebSocketContext } from "../context/WebSocketContextProvider.tsx";
import WS_STATUS from "../utils/WSStatus.tsx";
import { ChatRoomConnectionContext } from "../context/EncryptionContextProvider.tsx";
import { pkdf2DecryptMessage, stringToBuffer } from "../utils/PKDFCrypto.tsx";
import { exportPublicKeyToJWK } from "../utils/WSCrypto.tsx";

const HomeScreen = () => {
  const currUser = useContext(UserContext);
  const token = useContext(TokenContext);
  const ws = useContext(WebSocketContext);
  const { publicKey, PKDF2Key, setFriendsPublicKey } = useContext(
    ChatRoomConnectionContext
  );

  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [friendSearchIsOpen, setFriendSearchIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleFriendSelect = async (friend: User) => {
    setSelectedFriend(friend);
    setFriendsPublicKey(null);

    if (ws) {
      if (selectedFriend) {
        ws.send(
          JSON.stringify({
            type: WS_STATUS.REQUEST_TO_DELETE_PUBLIC_KEY,
            data: {
              senderID: currUser!.id,
              receiverID: selectedFriend!.id,
            },
          })
        );
      }
    }

    const myJWKPublicKey = await exportPublicKeyToJWK(publicKey);

    const websocketMessage = {
      type: WS_STATUS.REQUEST_TO_SEND_PUBLIC_KEY,
      data: {
        senderID: currUser!.id,
        receiverID: friend.id,
        jwkPublicKey: myJWKPublicKey,
      },
    };

    if (ws) {
      setTimeout(async () => {
        ws.send(JSON.stringify(websocketMessage));
      }, 500);
    } else {
      console.error("Websocket is not connected!");
    }

    // Send inactivity signal to other clients

    setMessages([]);
    getMessages(friend);
  };

  const toggleFriendSearch = () => {
    if (friendSearchIsOpen) {
      getFriends();
      setFriendSearchIsOpen(false);
    } else {
      setFriendSearchIsOpen(true);
    }
  };

  const triggerNotification = (success: boolean, message: string) => {
    const id = Date.now(); // Generate unique ID based on current time
    const newNotification = { id, success, message };
    setNotifications((prevNotifications) => [
      ...prevNotifications,
      newNotification,
    ]);
  };

  const getMessages = (friend: User) => {
    fetch(`${process.env.REACT_APP_HEROKU_URL}/message/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        UserID: `${currUser!.id}`,
        Email: `${currUser!.email}`,
      },
      body: JSON.stringify({
        user_id: currUser!.id,
        friend_id: friend!.id,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(async (data) => {
        for (const message of data.messages) {
          const encryptedMessage = {
            iv: stringToBuffer(message.iv),
            ciphertext: stringToBuffer(message.message).buffer,
            hmac: message.hmac,
          };
          const decryptedMessage = await pkdf2DecryptMessage(
            encryptedMessage,
            PKDF2Key
          );
          message.message = decryptedMessage!;
        }
        setMessages(data.messages);
      })
      .catch((error) => {
        console.error(error.message);
      });
  };

  const getFriends = () => {
    const requestData = {
      userId: currUser!.id,
    };

    fetch(`${process.env.REACT_APP_HEROKU_URL}/user/get/friends`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        UserID: `${currUser!.id}`,
        Email: `${currUser!.email}`,
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        const friendsArray: User[] = data.friends.map((friendship) => {
          const friend =
            friendship.user1.user_id !== currUser!.id
              ? friendship.user1
              : friendship.user2;
          return {
            id: friend.user_id,
            username: friend.username,
            email: friend.email,
            createdAt: friend.created_at,
          };
        });
        setFriends(friendsArray);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  return (
    <div className="flex h-full w-full bg-gray-100">
      {friendSearchIsOpen ? (
        <FriendsSearch
          friendSearchIsOpen={friendSearchIsOpen}
          toggleFriendSearch={toggleFriendSearch}
          triggerNotification={triggerNotification}
        />
      ) : null}
      <FriendsList
        selectedFriend={selectedFriend}
        handleFriendSelect={handleFriendSelect}
        toggleFriendSearch={toggleFriendSearch}
        friends={friends}
        getFriends={getFriends}
      />
      <NotificationStack
        notifications={notifications}
        setNotifications={setNotifications}
      />
      <ChatRoom
        selectedFriend={selectedFriend}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
};

export default HomeScreen;
