import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserUpdateContext } from "../../context/UserContextProvider.tsx";
import "./LoginScreen.css";
import axios from "axios";

export const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigation = useNavigate();

  const setCurrUser = useContext(UserUpdateContext);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_HEROKU_URL}/user/login`,
        {
          username: username,
          password: password,
        }
      );
      console.log(response.data);
    } catch (error) {
      if (error.response) {
        setError(`${error.response.mes}`)
        if (error.response.status === 401) {
          setError("Invalid credentials.");
        } else if (error.response.status === 404) {
          setError("User not found.");
        } else if (error.response.status === 400) {
          setError("Please input username and password.");
        } else {
          setError("An unexpected error occurred.");
        }
        return;
      } else {
        setError("Network error.");
      }
    }

    setCurrUser({
      id: 1,
      name: username,
    });

    navigation("/");
  };

  return (
    <div className="login-form shadow-md p-20 rounded-lg">
      <h1 className="text-2xl text-center mb-4 text-teal-600">Login</h1>
      <div className="mb-5">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 mb-4 placeholder-gray-400 text-gray-700 rounded-md bg-gray-100 focus:outline focus:outline-teal-300"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 mb-4 placeholder-gray-500 text-gray-700 rounded-md bg-gray-100 focus:outline focus:outline-teal-300"
        />
        <p className="text-red-600 text-sm">{error}</p>
      </div>
      <button
        onClick={handleLogin}
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring focus:ring-teal-300"
      >
        Login
      </button>
      <div className="text-center">
        <p>Don't have an account?</p>
        <p className="text-teal-600">
          <Link to="/register">Register here!</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
