import React from "react";
import "./App.css";
import UserContextProvider from "./context/UserContextProvider.tsx";
import AppRouter from "./navigation/AppRouter.tsx";

export const App = () => {
  return (
    <UserContextProvider>
      <div className="App">
        <div className="page bg-teal-900">
          <AppRouter />
        </div>
      </div>
    </UserContextProvider>
  );
};

export default App;
