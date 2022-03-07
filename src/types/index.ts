export interface User {
  __typename?: "User";
  id: string;
  firstName: string;
  lastName: string;
}

export interface UsersQueryData {
  users: User[];
}

export interface Message {
  __typename?: "Message";
  id: string;
  text: string;
  createdBy: User;
  createdAt: string;
}

export interface MessagesQueryData {
  messages: Message[];
}
