import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserContext } from "../context/UserContextProvider.tsx";
import LoginScreen from "../screens/LoginScreen.tsx";
import RegisterScreen from "../screens/RegisterScreen.tsx";
import HomeScreen from "../screens/HomeScreen.tsx";

const AppRouter = () => {
  const currUser = useContext(UserContext);
  return (
    <Router>
      <Routes>
        {currUser ? (
          <Route path="/" element={<HomeScreen />} />
        ) : (
          <>
            <Route path="/" element={<LoginScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
          </>
        )}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
