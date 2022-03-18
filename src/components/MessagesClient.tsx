import { FC, SyntheticEvent, useContext, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { gql, useMutation, useQuery } from "@apollo/client";
import { AppContext } from "../contexts";
import {
  Message,
  MessagesQueryData,
  AddMessageMutationData,
  AddMessageMutationVariables,
} from "../types";

export interface MessagesListProps {
  className?: string;
}

const MessagesClient: FC<MessagesListProps> = ({ className }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { currentUser } = useContext(AppContext);
  const { loading, error, data } = useQuery<MessagesQueryData>(gql`
    query {
      messages {
        id
        text
        createdBy {
          id
          firstName
          lastName
        }
        createdAt
      }
    }
  `);

  const [addMessage] = useMutation<
    AddMessageMutationData,
    AddMessageMutationVariables
  >(gql`
    mutation AddMessage($text: String!, $userId: ID!) {
      addMessage(text: $text, userId: $userId) {
        id
        text
        createdBy {
          id
          firstName
          lastName
        }
        createdAt
      }
    }
  `);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const handleOnSubmit = (evt: SyntheticEvent) => {
    evt.preventDefault();

    if (inputRef?.current?.value && currentUser) {
      const messageText = inputRef.current.value;

      addMessage({
        variables: { text: messageText, userId: currentUser.id },
        update(cache, mutationResult) {
          const resultMessage = mutationResult?.data?.addMessage;

          if (resultMessage) {
            cache.modify({
              fields: {
                messages(existingMessagesRefs = []) {
                  const newMessageRef = cache.writeFragment({
                    data: resultMessage,
                    fragment: gql`
                      fragment NewMessage on Message {
                        id
                        text
                        createdBy {
                          id
                          firstName
                          lastName
                        }
                        createdAt
                      }
                    `,
                  });

                  return existingMessagesRefs.concat(newMessageRef);
                },
              },
            });
          }
        },
        optimisticResponse: {
          addMessage: {
            __typename: "Message",
            id: uuidv4(),
            text: messageText,
            createdBy: {
              __typename: "User",
              ...currentUser,
            },
            createdAt: new Date().toISOString(),
          },
        },
      });

      inputRef.current.value = "";

      window.scrollTo(0, document.body.scrollHeight);
    }
  };

  return (
    <div className={className}>
      <ul className="list-style-none mb-4">
        {data?.messages.map((message: Message) => (
          <li className="mb-2" key={message.id}>
            <div
              className={`flex items-end${
                currentUser?.id === message.createdBy?.id
                  ? " flex-row-reverse"
                  : ""
              }`}
            >
              {currentUser?.id !== message.createdBy.id && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-400 text-white mr-2">
                  <span className="text-xs">
                    {message.createdBy.firstName[0]}
                    {message.createdBy.lastName[0]}
                  </span>
                </div>
              )}
              <div
                className={`flex flex-col${
                  currentUser?.id === message.createdBy.id ? " items-end" : ""
                }`}
              >
                {currentUser?.id !== message.createdBy.id && (
                  <span className="text-xs text-slate-400 font-semibold dark:text-slate-300 ml-2">
                    {message.createdBy.firstName}{" "}
                    {message.createdBy.lastName[0]}.
                  </span>
                )}
                <div className="mt-0.5">
                  <p
                    className={`inline-block text-lg p-3 rounded-xl max-w-md${
                      currentUser?.id === message.createdBy.id
                        ? " bg-blue-500 text-white"
                        : " bg-gray-200"
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={handleOnSubmit}>
        <label className="block relative">
          <span className="sr-only">Type Message</span>
          <input
            className="form-input block w-full rounded-full border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 pr-10"
            ref={inputRef}
          />
          <button
            type="submit"
            className="absolute top-2 right-2 text-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </label>
      </form>
    </div>
  );
};

export default MessagesClient;
