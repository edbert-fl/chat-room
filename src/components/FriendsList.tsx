import React, { useContext, useEffect } from "react";
import { RiUserAddLine } from "react-icons/ri";
import colors from "tailwindcss/colors";
import { User } from "../utils/Types";
import RandomEmoji from "./RandomEmoji.tsx";
import { Link } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { UserUpdateContext } from "../context/UserContextProvider.tsx";

interface FriendsListProps {
  selectedFriend: User | null;
  handleFriendSelect: (friend: User | null) => void;
  toggleFriendSearch: () => void;
  friends: User[];
  getFriends: () => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({
  selectedFriend,
  handleFriendSelect,
  toggleFriendSearch,
  friends,
  getFriends,
}) => {
  const setCurrUser = useContext(UserUpdateContext);
  
  useEffect(() => {
    getFriends();
    // eslint-disable-next-line
  }, []);

  const handleLogout = () => {
    setCurrUser(null);
  };

  return (
    <div className="pr-1 w-1/4 min-w-80 border-r bg-white border-gray-300 shadow-lg">
      <div className="pt-5 p-4 mx-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold inline-block">Friends</h2>
        <button
          className="bg-transparent hover:bg-transparent w-10 h-10 pt-3 items-center justify-center"
          onClick={toggleFriendSearch}
        >
          <RiUserAddLine size={24} color={colors.black} />
        </button>
      </div>

      <ul className="h-[80%]">
        {friends.map((friend) => (
          <li
            key={friend.id}
            className={`cursor-pointer py-2 px-4 mx-2 my-1 rounded-md ${
              selectedFriend && selectedFriend.id === friend.id
                ? "bg-teal-300"
                : ""
            }
              ${
                selectedFriend && selectedFriend.id !== friend.id
                  ? "hover:bg-gray-100"
                  : ""
              }`}
            onClick={() => handleFriendSelect(friend)}
          >
            <span className="text-xl">{<RandomEmoji id={friend.id} />}</span>{" "}
            {friend.username}
          </li>
        ))}
      </ul>
      <Link className="ml-6 flex flex-row items-center" to="/" onClick={handleLogout}>
        <FiLogOut className="text-lg" />
        <span className="ml-2 text-lg">Logout</span>
      </Link>
    </div>
  );
};
