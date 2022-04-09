import { FC, SyntheticEvent, useContext, useRef, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { v4 as uuidv4 } from "uuid";
import { AppContext } from "../contexts";
import {
  GET_MESSAGES,
  ADD_MESSAGE,
  CACHE_NEW_MESSAGE_FRAGMENT,
} from "../graphql/fragments";
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
  const { currentUser } = useContext(AppContext);

  const inputRef = useRef<HTMLInputElement>(null);

  const [lastDeliveredMessageId, setLastDeliveredMessageId] = useState<
    string | null
  >(null);

  const { loading, error, data } = useQuery<MessagesQueryData>(GET_MESSAGES);
  const [addMessage] = useMutation<
    AddMessageMutationData,
    AddMessageMutationVariables
  >(ADD_MESSAGE, {
    onCompleted(data) {
      setLastDeliveredMessageId(data.addMessage.id);
    },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const handleOnSubmit = (evt: SyntheticEvent) => {
    evt.preventDefault();

    if (inputRef?.current?.value && currentUser) {
      setLastDeliveredMessageId(null);

      const messageText = inputRef.current.value;

      addMessage({
        variables: { text: messageText, userId: currentUser.id },
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
        update(cache, mutationResult) {
          const resultMessage = mutationResult?.data?.addMessage;

          if (resultMessage) {
            cache.modify({
              fields: {
                messages(existingMessagesRef = []) {
                  const newMessageRef = cache.writeFragment({
                    data: resultMessage,
                    fragment: CACHE_NEW_MESSAGE_FRAGMENT,
                  });

                  return existingMessagesRef.concat(newMessageRef);
                },
              },
            });
          }
        },
      });

      inputRef.current.value = "";

      window.scrollTo(0, document.body.scrollHeight);
    }
  };

  const handleOnRetry = (message: Message) => {
    if (window.confirm("Would you like to resend this message?")) {
      try {
        addMessage({
          variables: {
            text: message.text,
            userId: message.createdBy.id,
            isRetry: true,
            createdAt: message.createdAt,
          },
          update(cache, mutationResult) {
            const resultMessage = mutationResult?.data?.addMessage;

            if (resultMessage && message.id.substring(0, 5) === "ERROR") {
              cache.updateFragment(
                {
                  id: `Message:${message.id}`,
                  fragment: CACHE_NEW_MESSAGE_FRAGMENT,
                },
                (data) => ({ ...data, id: resultMessage.id })
              );
            }
          },
        });
      } catch (err) {
        // Suppress the following error:
        // Warning: Encountered two children with the same key, `ERROR/...`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
        console.error(err);
      }
    }
  };

  return (
    <div className={className}>
      <ul className="list-style-none mb-4">
        {data?.messages.map((message: Message, i) => (
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
                  {currentUser?.id === message.createdBy.id &&
                    message.id.substring(0, 5) === "ERROR" && (
                      <button
                        type="button"
                        className="inline-block font-medium text-sm text-red-400"
                        onClick={(_evt) => handleOnRetry(message)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-7 w-7 ml-1 inline-block align-middle"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                </div>
                {currentUser?.id === message.createdBy.id && (
                  <>
                    {message.id.substring(0, 5) === "ERROR" ? (
                      <span className="text-right text-xs font-medium mt-2 text-red-400">
                        Not Delivered
                      </span>
                    ) : (
                      i === data.messages.length - 1 &&
                      lastDeliveredMessageId === message.id && (
                        <span className="text-right text-xs font-medium mt-2 text-slate-400">
                          Delivered
                        </span>
                      )
                    )}
                  </>
                )}
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
