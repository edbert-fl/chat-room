import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserUpdateContext } from  "../../context/UserContextProvider.tsx";
import './LoginScreen.css'

export const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigation = useNavigate();

  const setCurrUser = useContext(UserUpdateContext);

  const handleLogin = () => {
    // Add your login logic here
    console.log('Username:', username);
    console.log('Password:', password);
    setCurrUser({
      id: 1, 
      name: "Penguin"
    })
    navigation("/")
  };

  return (
    <div className="login-form shadow-md p-20 rounded-lg">
      <h1 className="text-2xl text-center mb-4 text-teal-600">Login</h1>
      <div className="mb-10">
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
      </div>
      <button onClick={handleLogin} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring focus:ring-teal-300">Login</button>
      <div className='text-center'>
        <p>Don't have an account?</p>
        <p className="text-teal-600"><Link to="/register">Register here!</Link></p>
      </div>
    </div>
  );
}

export default LoginScreen;
