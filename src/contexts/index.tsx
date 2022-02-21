import { createContext } from "react";
import { User } from "../types";

interface AppContextInterface {
  currentUser: User | null;
  changeCurrentUser: (user: User) => void;
}

export const AppContext = createContext({} as AppContextInterface);
