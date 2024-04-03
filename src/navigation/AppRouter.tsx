import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserContext } from "../context/UserContextProvider.tsx";
import LoginScreen from "../screens/LoginScreen/LoginScreen.tsx";
import RegisterScreen from "../screens/RegisterScreen/RegisterScreen.tsx";
import HomeScreen from "../screens/HomeScreen/HomeScreen.tsx";

const AppRouter = () => {
  const user = useContext(UserContext);
  return (
    <Router>
      <Routes>
        {user ? (
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
