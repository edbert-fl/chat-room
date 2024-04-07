import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./RegisterScreen.css";
import axios from "axios";
import * as crypto from 'crypto-js';

import { UserUpdateContext } from "../../context/UserContextProvider.tsx";

export const RegisterScreen = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const setCurrUser = useContext(UserUpdateContext);

  const navigation = useNavigate();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("Passwords need to match!");
      return;
    }

    try {
      const salt = crypto.lib.WordArray.random(127).toString(crypto.enc.Base64);
      const hashedPassword = crypto.SHA256(password + salt);
      const hashedPasswordString = hashedPassword.toString(crypto.enc.Base64);
      
      const response = await axios.post(
        `${process.env.REACT_APP_HEROKU_URL}/user/register`,
        {
          username: username,
          email: email,
          salt: salt,
          hashedPassword: hashedPasswordString,
        }
      );
      console.log(response);
      setCurrUser({
        id: response.data.user.user_id,
        name: username,
      });

      navigation("/");
    } catch (error) {
      if (error.response) {
        setError("An unexpected error occurred.");
        return;
      } else {
        setError("Network error.");
      }
    }
  };

  return (
    <div className="register-form p-8 min-w-100 rounded-lg shadow-lg w-full">
      <h1 className="text-2xl text-center mb-4 text-teal-600">Register</h1>
      <div className="mb-10">
        <input
          type="text"
          placeholder="Display Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 mb-4 placeholder-gray-400 text-gray-700 rounded-md bg-gray-100 focus:outline focus:outline-teal-300"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 mb-4 placeholder-gray-400 text-gray-700 rounded-md bg-gray-100 focus:outline focus:outline-teal-300"
        />
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 mb-4 placeholder-gray-500 text-gray-700 rounded-md bg-gray-100 focus:outline focus:outline-teal-300"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 mb-4 placeholder-gray-500 text-gray-700 rounded-md bg-gray-100 focus:outline focus:outline-teal-300"
        />
        <p className="text-red-600 text-sm">{error}</p>
      </div>
      <button
        onClick={handleRegister}
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md focus:outline focus:outline-teal-300"
      >
        Register
      </button>
      <div className="text-center">
        <p>Already have an account?</p>
        <p className="text-teal-600">
          <Link to="/login">Sign in here!</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
