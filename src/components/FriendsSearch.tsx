import React, { useContext, useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import colors from "tailwindcss/colors";
import { LoadingRequest } from "../utils/Types";
import { UserContext } from "../context/UserContextProvider.tsx";
import { bouncy } from "ldrs";
import RandomEmoji from "./RandomEmoji.tsx";

interface FriendsSearchProps {
  friendSearchIsOpen: boolean;
  toggleFriendSearch: () => void;
  triggerNotification: (success: boolean, message: string) => void;
}

export const FriendsSearch: React.FC<FriendsSearchProps> = ({
  friendSearchIsOpen,
  toggleFriendSearch,
  triggerNotification,
}) => {
  const [friendRequests, setFriendRequests] = useState<LoadingRequest[]>([]);
  const [searchText, setSearchText] = useState("");
  const currUser = useContext(UserContext);

  bouncy.register();

  useEffect(() => {
    getFriendRequests();
  }, []);

  const sendFriendRequest = (requestedUsername) => {
    fetch(`${process.env.REACT_APP_HEROKU_URL}/friend/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_id: currUser!.id,
        friend_name: requestedUsername,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log(JSON.stringify(data));
        triggerNotification(true, `Friend request sent`);
        getFriendRequests();
      })
      .catch((error) => {
        triggerNotification(false, `Error sending friend request`);
      });
  };

  const getFriendRequests = () => {
    const requestData = { userID: currUser!.id };

    fetch(`${process.env.REACT_APP_HEROKU_URL}/user/get/friend-requests`, {
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
        const loadingRequests: LoadingRequest[] = data.friendRequests.map(
          (friendRequest) => ({
            request: friendRequest,
            loading: false,
          })
        );
        console.log(loadingRequests);
        setFriendRequests(loadingRequests);
      })
      .catch((error) => {
        triggerNotification(false, `Error fetching friend requests`);
      });
  };

  const acceptFriendRequest = (loadingRequest: LoadingRequest) => {
    const { request, loading } = loadingRequest;

    if (loading) return;

    // Update the loading state for the request
    setFriendRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.request.id === request.id ? { ...req, loading: true } : req
      )
    );

    // Send a POST request to the server to accept the friend request
    fetch(`${process.env.REACT_APP_HEROKU_URL}/friend/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ request_id: request.id }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        triggerNotification(true, `Friend request accepted`);
        setFriendRequests((prevRequests) =>
          prevRequests.filter((req) => req.request.id !== request.id)
        );
      })
      .catch((error) => {
        console.error("Error accepting friend request:", error);
        setFriendRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.request.id === request.id ? { ...req, loading: false } : req
          )
        );
      });
  };

  const rejectFriendRequest = (loadingRequest: LoadingRequest) => {
    const { request, loading } = loadingRequest;

    if (loading) return;

    // Update the loading state for the request
    setFriendRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.request.id === request.id ? { ...req, loading: true } : req
      )
    );

    // Send a POST request to the server to accept the friend request
    fetch(`${process.env.REACT_APP_HEROKU_URL}/friend/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ request_id: request.id }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        triggerNotification(true, `Friend request rejected`);
        setFriendRequests((prevRequests) =>
          prevRequests.filter((req) => req.request.id !== request.id)
        );
      })
      .catch((error) => {
        console.error("Error accepting friend request:", error);
        setFriendRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.request.id === request.id ? { ...req, loading: false } : req
          )
        );
      });
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 border-r bg-white pr-5 w-1/4 min-w-80 border-gray-300 ${
        friendSearchIsOpen
          ? "transition-all duration-300 ease-in-out transform translate-x-0"
          : "transition-all duration-300 ease-in-out transform -translate-x-full"
      }`}
    >
      <div className="pt-5 p-2 flex items-center">
        <button
          className="bg-transparent hover:bg-transparent w-10 h-10 pt-3 items-center justify-center"
          onClick={toggleFriendSearch}
        >
          <IoArrowBack color={colors.black} size={24} />
        </button>
        <h1 className="text-xl font-semibold ml-3">Friend Requests</h1>
      </div>
      <div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search for friends"
            className="border border-gray-300 p-2 rounded-md w-full focus:outline focus:outline-teal-300"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendFriendRequest(searchText);
                setSearchText("");
              }
            }}
          />
        </div>

        <div className="divide-y divide-gray-200">
          {/* Assuming `friendRequests` is an array of friend request objects */}
          {friendRequests.map((loadingRequest) => (
            <div
              key={loadingRequest.request.id}
              className="px-4 pt-4 pb-2 flex justify-between items-center"
            >
              <div>
                <span className="text-xl mr-2">
                  {<RandomEmoji id={loadingRequest.request.sender.id} />}
                </span>
                {loadingRequest.request.sender.username}
              </div>
              <div className="flex space-x-1 w-1/2 h-10 items-center justify-center">
                {loadingRequest.loading ? (
                  <div className="my-2">
                    <l-bouncy size="35" speed="1.75" color={colors.teal[600]} />
                  </div>
                ) : (
                  <div className="my-2 w-full flex flex-row">
                    <button
                      className="bg-teal-500 text-white text-sm w-20 py-2 ml-1 rounded-md hover:bg-teal-600"
                      onClick={() => acceptFriendRequest(loadingRequest)}
                    >
                      Accept
                    </button>
                    <button
                      className="bg-rose-500 text-white text-sm w-20 py-2 ml-1 rounded-md hover:bg-rose-600"
                      onClick={() => rejectFriendRequest(loadingRequest)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
