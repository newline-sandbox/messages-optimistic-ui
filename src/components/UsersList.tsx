import { FC, useContext } from "react";
import { useQuery } from "@apollo/client";
import { AppContext } from "../contexts";
import { GET_USERS } from "../graphql/fragments";
import { UsersQueryData } from "../types";

export interface UsersListProps {
  className?: string;
}

const UsersList: FC<UsersListProps> = ({ className }) => {
  const { currentUser, changeCurrentUser } = useContext(AppContext);
  const { loading, error, data } = useQuery<UsersQueryData>(GET_USERS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className={className}>
      <strong className="block mb-2 text-lg">Pick a user:</strong>
      <ul className="list-style-none">
        {data?.users.map((user) => (
          <li className="mb-2" key={user.id}>
            <button
              type="button"
              className="px-4 py-2 font-semibold text-sm border border-gray-200 rounded-full shadow-sm"
              onClick={(_evt) => changeCurrentUser(user)}
            >
              {user.firstName} {user.lastName}{" "}
              {currentUser?.id === user.id && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 inline-block text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsersList;
