import { useState } from "react";
import { AppContext } from "./contexts";
import MessagesClient from "./components/MessagesClient";
import UsersList from "./components/UsersList";
import { User } from "./types";

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const changeCurrentUser = (user: User) => {
    setCurrentUser(user);
  };

  return (
    <AppContext.Provider value={{ currentUser, changeCurrentUser }}>
      <div className="bg-gray-100 py-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-blue-800 sm:text-6xl lg:text-7xl mx-4 mb-8">
            Apollo Client - Optimistic UI Demo
          </h1>
          <UsersList className="mx-4 my-8" />
          {currentUser && <MessagesClient className="mx-4 my-8" />}
        </div>
      </div>
    </AppContext.Provider>
  );
}

export default App;
