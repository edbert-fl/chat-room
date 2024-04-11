import React, { useContext, useState } from "react";
import { Message, User } from "../../utils/Types.tsx";
import { FriendsList } from "../../components/FriendsList.tsx";
import { FriendsSearch } from "../../components/FriendsSearch.tsx";
import { Notification } from "../../utils/Types.tsx";
import NotificationStack from "../../components/NotificationStack.tsx";
import { ChatRoom } from "../../components/ChatRoom.tsx";
import { UserContext } from "../../context/UserContextProvider.tsx";

const HomeScreen = () => {
  const currUser = useContext(UserContext);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [friendSearchIsOpen, setFriendSearchIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Function to handle friend selection
  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend);
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
    console.log({
      user_id: currUser!.id,
      friend_id: friend!.id,
    });
    fetch(`${process.env.REACT_APP_HEROKU_URL}/message/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      .then((data) => {
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
